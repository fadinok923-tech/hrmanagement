const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');

// Load the actual TypeScript handlers with an isolated in-memory database.
function loadSource(relativePath, db) {
  const filename = path.resolve(__dirname, '..', relativePath);
  const loaded = new Module(filename, module);
  loaded.filename = filename;
  loaded.paths = Module._nodeModulePaths(path.dirname(filename));
  const nativeRequire = loaded.require.bind(loaded);
  loaded.require = (name) => {
    if (name === '@/lib/db') return { db };
    if (name.startsWith('@/')) return loadSource(`src/${name.slice(2)}.ts`, db);
    return nativeRequire(name);
  };
  const code = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  loaded._compile(code, filename);
  return loaded.exports;
}

test('one save persists personal, employment, legal, financial and leave fields', async () => {
  let employee = { id: 'sample', empNo: 'TEST-1', fullName: 'Sample Employee', gender: 'male' };
  const db = { employee: {
    findFirst: async () => null,
    update: async ({ data }) => employee = { ...employee, ...data },
    findUnique: async () => employee,
  } };
  const handlers = loadSource('src/app/api/employees/[id]/route.ts', db);
  const changes = {
    gender: ' FEMALE ', fullName: 'Updated Employee', fullNameAr: 'اسم',
    maritalStatus: 'married', phone: '0501234567', email: 'sample@example.com',
    address: 'New address', emergencyContact: '0509876543', nationality: 'Saudi',
    jobTitle: 'Supervisor', department: 'Management', employmentType: 'part_time',
    hireDate: '2026-01-02', activeDate: '2026-02-03', dateOfBirth: '1990-01-01',
    contractEnd: '2027-01-01', passportNo: 'P123', passportExpiry: '2028-01-01',
    iqamaNo: '1234567890', iqamaExpiry: '2027-02-01', visaType: 'External Visa',
    basicSalary: 7500, allowances: 0, bankAccount: 'Bank', iban: 'SA123',
    status: 'active', notes: '', leaveAnnual: 28, leaveSick: 0,
    leaveEmergency: 5, leaveCasualPerWeek: 2,
  };
  const params = { params: Promise.resolve({ id: 'sample' }) };
  const response = await handlers.PUT(new Request('http://test/api/employees/sample', {
    method: 'PUT', body: JSON.stringify(changes),
  }), params);
  assert.equal(response.status, 200);
  const saved = (await response.json()).data;
  const read = await handlers.GET(new Request('http://test/api/employees/sample'), params);
  assert.match(read.headers.get('cache-control'), /no-store/);
  assert.deepEqual((await read.json()).data, saved);
  for (const [field, value] of Object.entries(changes)) {
    const expected = field === 'gender' ? 'female' : field === 'visaType' ? 'EXTERNAL VISA'
      : /Date$|Expiry$|dateOfBirth|contractEnd/.test(field) ? new Date(value).toISOString() : value;
    assert.equal(saved[field], expected, field);
  }
  const cleared = await handlers.PUT(new Request('http://test/api/employees/sample', {
    method: 'PUT', body: JSON.stringify({ dateOfBirth: '', activeDate: null, phone: null }),
  }), params);
  const data = (await cleared.json()).data;
  assert.equal(data.dateOfBirth, null);
  assert.equal(data.activeDate, null);
  assert.equal(data.phone, null);
  assert.equal(data.visaType, 'EXTERNAL VISA', 'partial updates retain visa type');
});

test('duplicate employee number returns an error instead of reporting a partial save', async () => {
  let updated = false;
  const { PUT } = loadSource('src/app/api/employees/[id]/route.ts', { employee: {
    findFirst: async () => ({ id: 'another' }), update: async () => { updated = true; },
  } });
  const response = await PUT(new Request('http://test', {
    method: 'PUT', body: JSON.stringify({ empNo: 'TAKEN', gender: 'female' }),
  }), { params: Promise.resolve({ id: 'sample' }) });
  assert.equal(response.status, 409);
  assert.equal(updated, false);
});

test('edit and detail normalization agrees for imported values and preserves zero entitlements', () => {
  const { normalizeEmployee } = loadSource('src/components/dashboard/api-helpers.ts');
  const result = normalizeEmployee({ gender: ' MALE ', maritalStatus: 'Married',
    employmentType: 'FULL_TIME', status: 'Active', visaType: 'Saudi National',
    basicSalary: '7000', allowances: '1000', leaveAnnual: 0, leaveSick: null });
  assert.equal(result.gender, 'male');
  assert.equal(result.maritalStatus, 'married');
  assert.equal(result.employmentType, 'full_time');
  assert.equal(result.visaType, 'SAUDI NATIONAL');
  assert.equal(result.basicSalary + result.allowances, 8000);
  assert.equal(result.leaveAnnual, 0);
  assert.equal(result.leaveSick, 30);
  assert.equal(result.leaveEmergency, 3);
});

test('three visa choices are canonical while legacy custom values are preserved', () => {
  const { VISA_TYPES, normalizeVisaType } = loadSource('src/lib/employee-values.ts');
  assert.deepEqual(VISA_TYPES, ['COMPANY VISA', 'SAUDI NATIONAL', 'EXTERNAL VISA']);
  assert.equal(normalizeVisaType(' company visa '), 'COMPANY VISA');
  assert.equal(normalizeVisaType('Iqama'), 'Iqama');
  assert.equal(normalizeVisaType(''), null);
});

test('visa filtering includes old casing and employee lists cannot be cached', async () => {
  let query;
  const { GET } = loadSource('src/app/api/employees/route.ts', { employee: {
    findMany: async (args) => { query = args; return []; },
  } });
  const response = await GET(new Request('http://test/api/employees?visaType=SAUDI%20NATIONAL'));
  assert.deepEqual(query.where.visaType, { equals: 'SAUDI NATIONAL', mode: 'insensitive' });
  assert.match(response.headers.get('cache-control'), /no-store/);
});
