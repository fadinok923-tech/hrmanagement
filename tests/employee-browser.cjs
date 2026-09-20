// Run against a local server. All API requests use sample data, never real employees.
// Requires Playwright (or PLAYWRIGHT_MODULE pointing to an installed copy).
const assert = require('node:assert/strict');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const baseURL = process.env.TEST_BASE_URL || 'http://localhost:3102';

(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1050 } });
    const pageErrors = [];
    page.on('pageerror', (error) => pageErrors.push(error.message));
    let employee = {
      id: 'sample-1', empNo: 'TEST-1', fullName: 'Sample Employee', fullNameAr: '',
      nationality: 'Saudi', gender: ' MALE ', maritalStatus: 'Single', employmentType: 'full_time',
      status: 'active', jobTitle: 'Operator', department: 'Production', hireDate: '2026-01-01',
      basicSalary: '7000', allowances: '1000', visaType: 'Saudi National',
      leaveAnnual: 21, leaveSick: 30, leaveEmergency: 3, leaveCasualPerWeek: 1,
      phone: '', notes: '', attendance: [], documents: [], leaves: [], payrolls: [], kpis: [],
    };
    const writes = [];
    let failSave = false;
    let failDetail = false;
    let releaseOldList;
    let oldListFinished;
    await page.route(`${baseURL}/api/**`, async (route) => {
      const request = route.request();
      const url = new URL(request.url());
      if (url.pathname === '/api/employees/sample-1' && request.method() === 'PUT') {
        if (failSave) return route.fulfill({ status: 409, json: { ok: false, error: 'Employee number is already in use' } });
        const body = request.postDataJSON();
        writes.push(body);
        employee = { ...employee, ...body };
        return route.fulfill({ json: { ok: true, data: employee } });
      }
      if (url.pathname === '/api/employees/sample-1') {
        if (failDetail) return route.fulfill({ status: 500, json: { ok: false, error: 'Details temporarily unavailable' } });
        return route.fulfill({ json: { ok: true, data: employee } });
      }
      if (url.pathname === '/api/employees') {
        if (url.searchParams.get('search') === 'slow') {
          const oldEmployee = { ...employee, fullName: 'Outdated Employee' };
          await new Promise((resolve) => { releaseOldList = resolve; });
          await route.fulfill({ json: { ok: true, data: [oldEmployee] } }).catch(() => {});
          oldListFinished();
          return;
        }
        return route.fulfill({ json: { ok: true, data: [employee] } });
      }
      return route.fulfill({ json: { ok: false, error: 'Sample preview' } });
    });
    await page.addInitScript(() => sessionStorage.setItem('tanoor-session', JSON.stringify({ user: { name: 'Sample Tester' } })));
    await page.goto(baseURL);
    await page.getByRole('button', { name: 'Employees', exact: true }).click();
    await page.getByText('Sample Employee', { exact: true }).waitFor();
    await page.getByRole('button', { name: 'Cards', exact: true }).click();

    // Imported uppercase gender must agree between detail and edit even before saving.
    await page.getByRole('button', { name: 'View Details' }).click();
    await page.getByText('Male', { exact: true }).waitFor();
    await page.getByRole('button', { name: 'Close', exact: true }).click();
    await page.getByRole('button', { name: 'Edit', exact: true }).click();
    const form = page.getByRole('dialog', { name: 'Edit Employee' });
    assert.equal(await form.getByRole('combobox', { name: 'Gender', exact: true }).inputValue(), 'male');
    assert.deepEqual(await form.getByLabel('Visa Type').locator('option:enabled').allTextContents(),
      ['COMPANY VISA', 'SAUDI NATIONAL', 'EXTERNAL VISA']);
    assert.equal(await form.getByLabel('Visa Type').inputValue(), 'SAUDI NATIONAL');
    await form.getByRole('combobox', { name: 'Gender', exact: true }).selectOption('female');
    await form.getByLabel('Full Name', { exact: false }).fill('Updated Employee');
    await form.getByLabel('Phone', { exact: true }).fill('0501234567');
    await form.getByLabel('Visa Type').selectOption('EXTERNAL VISA');
    await form.getByLabel('Annual Leave (days)').fill('28');
    await form.getByLabel('Sick Leave (days)').fill('0');
    await form.getByLabel('Notes', { exact: true }).fill('Saved on first attempt');
    await form.getByRole('button', { name: 'Save', exact: true }).click();
    await form.waitFor({ state: 'hidden' });
    assert.equal(writes.length, 1);
    await page.getByRole('button', { name: 'View Details' }).click();
    await page.getByText('Female', { exact: true }).waitFor();
    await page.getByText('0501234567', { exact: true }).waitFor();
    await page.getByText('EXTERNAL VISA', { exact: true }).last().waitFor();
    await page.getByText('Saved on first attempt', { exact: true }).waitFor();
    await page.getByRole('button', { name: 'Employment', exact: true }).click();
    const annualRow = page.getByText('Annual Leave (days)', { exact: true }).locator('..');
    assert.match(await annualRow.innerText(), /28/);
    const sickRow = page.getByText('Sick Leave (days)', { exact: true }).locator('..');
    assert.match(await sickRow.innerText(), /\b0\b/);
    await page.screenshot({ path: 'local-employee-details.png' });
    await page.getByRole('button', { name: 'Close', exact: true }).click();
    await page.getByRole('button', { name: 'Edit', exact: true }).click();
    assert.equal(await form.getByRole('combobox', { name: 'Gender', exact: true }).inputValue(), 'female');
    assert.equal(await form.getByLabel('Phone', { exact: true }).inputValue(), '0501234567');
    assert.equal(await form.getByLabel('Visa Type').inputValue(), 'EXTERNAL VISA');

    // A failed save must retain the user's edits and must not close the dialog.
    failSave = true;
    await form.getByLabel('Phone', { exact: true }).fill('0500000000');
    await form.getByRole('button', { name: 'Save', exact: true }).click();
    await page.getByText('Employee number is already in use', { exact: true }).waitFor();
    assert.equal(await form.isVisible(), true);
    assert.equal(await form.getByLabel('Phone', { exact: true }).inputValue(), '0500000000');
    assert.equal(writes.length, 1);
    await form.getByRole('button', { name: 'Close', exact: true }).click();

    // Failed detail reads show an error and recover through Retry.
    failDetail = true;
    await page.getByRole('button', { name: 'View Details' }).click();
    await page.getByRole('alert').getByText('Details temporarily unavailable').waitFor();
    failDetail = false;
    await page.getByRole('button', { name: 'Try Again', exact: true }).click();
    await page.getByText('Female', { exact: true }).waitFor();
    await page.getByRole('button', { name: 'Close', exact: true }).click();

    // Bulk weekend leave must use the server's actual field name.
    failSave = false;
    await page.getByRole('button', { name: 'Table', exact: true }).click();
    await page.getByRole('checkbox').first().check();
    await page.getByRole('button', { name: /Bulk Edit/ }).first().click();
    const bulk = page.getByRole('dialog', { name: /Bulk Edit/ });
    await bulk.getByLabel('Weekend Leave (days/month)').fill('2');
    await bulk.getByRole('button', { name: /Apply to/ }).click();
    await bulk.waitFor({ state: 'hidden' });
    assert.equal(writes.at(-1).leaveCasualPerWeek, 2);
    assert.equal(writes.at(-1).leaveCasualPerMonth, undefined);

    // An older request completing after a newer search must not overwrite the list.
    const search = page.locator('main input[type="text"]').first();
    const pendingOldResponse = new Promise((resolve) => { oldListFinished = resolve; });
    const oldRequest = page.waitForRequest((request) => request.url().includes('search=slow'));
    await search.fill('slow');
    await oldRequest;
    await search.fill('Updated');
    await page.getByText('Updated Employee', { exact: true }).waitFor();
    releaseOldList();
    await pendingOldResponse;
    await page.waitForTimeout(300);
    assert.equal(await page.getByText('Outdated Employee', { exact: true }).count(), 0);
    await page.getByRole('button', { name: 'Edit', exact: true }).click();
    await page.setViewportSize({ width: 390, height: 844 });
    assert.deepEqual(await form.getByLabel('Visa Type').locator('option:enabled').allTextContents(),
      ['COMPANY VISA', 'SAUDI NATIONAL', 'EXTERNAL VISA']);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    await page.screenshot({ path: 'local-employee-mobile.png' });
    assert.deepEqual(pageErrors, []);
    console.log('PASS: first save and reopen across fields, legacy gender, three visa options, zero leave, save failure, detail retry, bulk leave, out-of-order requests, mobile layout, no page errors.');
  } finally {
    await browser.close();
  }
})().catch((error) => { console.error(error); process.exit(1); });
