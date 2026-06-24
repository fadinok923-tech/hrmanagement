"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";

export type Locale = "en" | "ar";

type Dict = Record<string, string>;

const en: Dict = {
  "brand.name": "Tanoor Al Jazeera",
  "brand.sub": "Industrial Factory",
  "brand.badge": "HR Management System",
  "hero.eyebrow": "Saudi-Compliant",
  "hero.title": "Complete HR Management,",
  "hero.desc":
    "A unified platform for employees, attendance, payroll, documents, recruitment and KPIs — integrated with Absher, MODON, Qiwa and Mudad.",
  "features.title": "01",
  "features.subtitle": "Core Modules",
  "feature.1": "Employee Management",
  "feature.2": "Payroll & Attendance",
  "feature.3": "Document Expiry",
  "feature.4": "KPI Tracking",
  "portals.title": "Government Portals",
  "portal.absher": "Absher",
  "portal.qiwa": "Qiwa",
  "portal.modon": "MODON",
  "portal.mudad": "Mudad",
  "footer.copy": "© 2025 Tanoor Al Jazeera",
  "footer.compliance": "Saudi-compliant",
  "lang.toggle": "عربي",
  "lang.toggle.en": "English",
  "login.title": "Welcome back",
  "login.subtitle": "Sign in to access the HR dashboard",
  "login.username": "Username",
  "login.username.ph": "Enter username",
  "login.password": "Password",
  "login.password.ph": "Enter password",
  "login.remember": "Remember me",
  "login.forgot": "Forgot password?",
  "login.submit": "Sign In",
  "login.submitting": "Signing in…",
  "login.support":
    "For an account or to recover your password, contact the system administrator at",
  "login.secured": "Secured by Tanoor Al Jazeera HR System",
  "login.admin": "Admin",
  "login.err.required": "Please enter your username and password.",
  "login.err.invalid": "Invalid username or password.",
  "login.success": "Welcome back! Redirecting to your dashboard…",
  "forgot.title": "Reset Password",
  "forgot.desc":
    "Enter your username and we will send reset instructions to the registered email.",
  "forgot.username": "Username",
  "forgot.username.ph": "Enter your username",
  "forgot.submit": "Send Reset Link",
  "forgot.submitting": "Sending…",
  "forgot.cancel": "Back to sign in",
  "forgot.success":
    "If the username exists, reset instructions have been sent to the registered email.",
  "forgot.back": "Back to login",
  "show": "Show",
  "hide": "Hide",
  "demo.hint": "Demo: admin / tanoor2025",
};

const ar: Dict = {
  "brand.name": "تنور الجزيرة",
  "brand.sub": "المصنع الصناعي",
  "brand.badge": "نظام إدارة الموارد البشرية",
  "hero.eyebrow": "متوافق مع الأنظمة السعودية",
  "hero.title": "إدارة موارد بشرية متكاملة،",
  "hero.desc":
    "منصة موحدة للموظفين والحضور والرواتب والمستندات والتوظيف ومؤشرات الأداء — متكاملة مع أبشر ومدن وقوى ومُدد.",
  "features.title": "01",
  "features.subtitle": "الوحدات الأساسية",
  "feature.1": "إدارة الموظفين",
  "feature.2": "الرواتب والحضور",
  "feature.3": "انتهاء المستندات",
  "feature.4": "تتبع مؤشرات الأداء",
  "portals.title": "البوابات الحكومية",
  "portal.absher": "أبشر",
  "portal.qiwa": "قوى",
  "portal.modon": "مُدن",
  "portal.mudad": "مُدد",
  "footer.copy": "© 2025 تنور الجزيرة",
  "footer.compliance": "متوافق سعوديًا",
  "lang.toggle": "English",
  "lang.toggle.en": "English",
  "login.title": "مرحبًا بعودتك",
  "login.subtitle": "سجّل الدخول للوصول إلى لوحة الموارد البشرية",
  "login.username": "اسم المستخدم",
  "login.username.ph": "أدخل اسم المستخدم",
  "login.password": "كلمة المرور",
  "login.password.ph": "أدخل كلمة المرور",
  "login.remember": "تذكّرني",
  "login.forgot": "نسيت كلمة المرور؟",
  "login.submit": "تسجيل الدخول",
  "login.submitting": "جارٍ تسجيل الدخول…",
  "login.support":
    "للحصول على حساب أو لاستعادة كلمة المرور، تواصل مع مسؤول النظام على",
  "login.secured": "محمي بواسطة نظام تنور الجزيرة للموارد البشرية",
  "login.admin": "المسؤول",
  "login.err.required": "يرجى إدخال اسم المستخدم وكلمة المرور.",
  "login.err.invalid": "اسم المستخدم أو كلمة المرور غير صحيحة.",
  "login.success": "مرحبًا بعودتك! جارٍ تحويلك إلى لوحة التحكم…",
  "forgot.title": "استعادة كلمة المرور",
  "forgot.desc":
    "أدخل اسم المستخدم وسنرسل تعليمات الاستعادة إلى البريد الإلكتروني المسجّل.",
  "forgot.username": "اسم المستخدم",
  "forgot.username.ph": "أدخل اسم المستخدم",
  "forgot.submit": "إرسال رابط الاستعادة",
  "forgot.submitting": "جارٍ الإرسال…",
  "forgot.cancel": "العودة لتسجيل الدخول",
  "forgot.success":
    "إذا كان اسم المستخدم موجودًا، فقد تم إرسال تعليمات الاستعادة إلى البريد المسجّل.",
  "forgot.back": "العودة لتسجيل الدخول",
  "show": "إظهار",
  "hide": "إخفاء",
  "demo.hint": "تجريبي: admin / tanoor2025",
};

const dictionaries: Record<Locale, Dict> = { en, ar };

const STORAGE_KEY = "tanoor-locale";

type LanguageContextValue = {
  locale: Locale;
  dir: "ltr" | "rtl";
  t: (key: string) => string;
  toggle: () => void;
  setLocale: (l: Locale) => void;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

/* External locale store backed by localStorage + a subscription model. */
const listeners = new Set<() => void>();

function subscribe(cb: () => void) {
  listeners.add(cb);
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) cb();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", onStorage);
  };
}

function getSnapshot(): string {
  return window.localStorage.getItem(STORAGE_KEY) || "en";
}

function getServerSnapshot(): string {
  return "en";
}

function notify() {
  listeners.forEach((l) => l());
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const stored = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  ) as Locale;

  const locale: Locale = stored === "ar" ? "ar" : "en";
  const dir: "ltr" | "rtl" = locale === "ar" ? "rtl" : "ltr";

  // Keep <html> lang/dir in sync (client-only side effect).
  useEffect(() => {
    const html = document.documentElement;
    html.lang = locale;
    html.dir = dir;
  }, [locale, dir]);

  const setLocale = useCallback((l: Locale) => {
    try {
      window.localStorage.setItem(STORAGE_KEY, l);
    } catch {
      /* ignore */
    }
    notify();
  }, []);

  const toggle = useCallback(() => {
    setLocale(stored === "ar" ? "en" : "ar");
  }, [stored, setLocale]);

  const t = useCallback(
    (key: string) => dictionaries[locale][key] ?? dictionaries.en[key] ?? key,
    [locale],
  );

  const value = useMemo(
    () => ({ locale, dir, t, toggle, setLocale }),
    [locale, dir, t, toggle, setLocale],
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return ctx;
}
