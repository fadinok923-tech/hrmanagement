"use client";

import { useState, useEffect, type FormEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  Mail,
  Loader2,
  ShieldCheck,
  Globe,
  Info,
} from "lucide-react";
import { useLanguage } from "@/components/language-provider";
import { Logo } from "@/components/logo";
import { toast } from "sonner";

const ease = [0.22, 1, 0.36, 1] as const;
const SUPPORT_EMAIL = "fadinkp123@gmail.com";

export function LoginPanel() {
  const { t, dir, toggle, locale } = useLanguage();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const Arrow = dir === "rtl" ? ArrowLeft : ArrowRight;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!username.trim() || !password) {
      setError(t("login.err.required"));
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username.trim(),
          password,
          remember,
        }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.ok) {
        setError(data.error || t("login.err.invalid"));
        toast.error(data.error || t("login.err.invalid"));
        return;
      }

      toast.success(t("login.success"));
      try {
        sessionStorage.setItem("tanoor-session", JSON.stringify({ user: data.user, at: Date.now() }));
      } catch {}
      window.location.reload();
    } catch {
      setError(t("login.err.invalid"));
      toast.error(t("login.err.invalid"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      dir={dir}
      className="relative flex min-h-screen flex-col bg-white lg:min-h-0"
    >
      {/* Mobile brand bar */}
      <div className="flex items-center justify-between px-5 pt-5 lg:hidden">
        <div className="flex items-center gap-2.5">
          <Logo className="h-9 w-9 rounded-xl shadow-md" />
          <div className="leading-tight">
            <div className="text-sm font-bold text-slate-900">
              {t("brand.name")}
            </div>
            <div className="text-[10px] text-slate-500">{t("brand.sub")}</div>
          </div>
        </div>
        <LanguageToggle />
      </div>

      {/* Desktop language toggle (top-right) */}
      <div className="absolute end-6 top-6 z-20 hidden lg:block">
        <LanguageToggle />
      </div>

      <div className="flex flex-1 items-center justify-center px-5 py-8 sm:px-8 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease }}
          className="w-full max-w-md"
        >
          {/* Accent line + heading */}
          <div className="flex flex-col items-center text-center">
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.7, ease, delay: 0.15 }}
              className="gold-shimmer h-[3px] w-16 rounded-full bg-gradient-to-r from-[var(--color-gold)] to-[#fbbf24]"
            />
            <h2 className="mt-4 text-2xl font-bold tracking-tight text-slate-900 sm:text-[1.75rem]">
              {t("login.title")}
            </h2>
            <p className="mt-1.5 text-sm text-slate-500">
              {t("login.subtitle")}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4" noValidate>
            {/* Username */}
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease, delay: 0.25 }}
            >
              <label
                htmlFor="username"
                className="mb-1.5 block text-xs font-medium text-slate-600"
              >
                {t("login.username")}
              </label>
              <div className="group relative">
                <span className="pointer-events-none absolute inset-y-0 start-0 flex items-center ps-3.5 text-slate-400 transition-colors group-focus-within:text-[var(--color-brand-light)]">
                  <User className="h-4 w-4" />
                </span>
                <input
                  id="username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder={t("login.username.ph")}
                  className="tanoor-input h-11 w-full rounded-xl border border-slate-300 bg-white ps-10 pe-3 text-sm text-slate-900 placeholder:text-slate-400 transition focus:outline-none"
                />
              </div>
            </motion.div>

            {/* Password */}
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease, delay: 0.33 }}
            >
              <label
                htmlFor="password"
                className="mb-1.5 block text-xs font-medium text-slate-600"
              >
                {t("login.password")}
              </label>
              <div className="group relative">
                <span className="pointer-events-none absolute inset-y-0 start-0 flex items-center ps-3.5 text-slate-400 transition-colors group-focus-within:text-[var(--color-brand-light)]">
                  <Lock className="h-4 w-4" />
                </span>
                <input
                  id="password"
                  name="password"
                  type={showPw ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t("login.password.ph")}
                  className="tanoor-input h-11 w-full rounded-xl border border-slate-300 bg-white ps-10 pe-10 text-sm text-slate-900 placeholder:text-slate-400 transition focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((s) => !s)}
                  aria-label={showPw ? t("hide") : t("show")}
                  className="absolute inset-y-0 end-0 flex items-center pe-3.5 text-slate-400 transition-colors hover:text-slate-700"
                >
                  {showPw ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </motion.div>

            {/* Remember + Forgot */}
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease, delay: 0.4 }}
              className="flex items-center justify-between"
            >
              <label className="flex cursor-pointer select-none items-center gap-2 text-xs text-slate-600">
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={remember}
                  onClick={() => setRemember((r) => !r)}
                  className={`grid h-4 w-4 place-items-center rounded border transition ${
                    remember
                      ? "border-[var(--color-brand-light)] bg-[var(--color-brand-light)] text-white"
                      : "border-slate-300 bg-white"
                  }`}
                >
                  {remember && (
                    <svg
                      viewBox="0 0 12 12"
                      className="h-3 w-3"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M2.5 6.5l2.5 2.5 4.5-5" />
                    </svg>
                  )}
                </button>
                {t("login.remember")}
              </label>
              <button
                type="button"
                onClick={() => setForgotOpen(true)}
                className="text-xs font-medium text-[var(--color-brand-light)] transition-colors hover:text-[var(--color-brand-deep)] hover:underline"
              >
                {t("login.forgot")}
              </button>
            </motion.div>

            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600"
                >
                  <Info className="h-3.5 w-3.5 shrink-0" />
                  <span>{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit */}
            <motion.button
              type="submit"
              disabled={loading}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease, delay: 0.46 }}
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.985 }}
              className="group relative flex h-12 w-full items-center justify-center gap-2 overflow-hidden rounded-full border-2 border-[var(--color-brand-light)] bg-white text-sm font-semibold text-[var(--color-brand-deep)] transition-all hover:bg-[var(--color-brand-light)] hover:text-white hover:shadow-lg hover:shadow-[var(--color-brand-light)]/30 disabled:cursor-not-allowed disabled:opacity-80"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t("login.submitting")}
                </>
              ) : (
                <>
                  {t("login.submit")}
                  <Arrow className="h-4 w-4 transition-transform group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5" />
                </>
              )}
            </motion.button>
          </form>

          {/* Support contact box */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease, delay: 0.55 }}
            className="mt-6 flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3.5"
          >
            <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-[var(--color-brand-light)]/10 text-[var(--color-brand-light)]">
              <Mail className="h-3.5 w-3.5" />
            </span>
            <p className="text-xs leading-relaxed text-slate-600">
              {t("login.support")}{" "}
              <a
                href={`mailto:${SUPPORT_EMAIL}`}
                className="font-semibold text-[var(--color-brand-light)] hover:underline"
              >
                {SUPPORT_EMAIL}
              </a>
            </p>
          </motion.div>

          {/* Secured by footer */}
          <div className="mt-8 flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
            <ShieldCheck className="h-3 w-3" />
            {t("login.secured")}
          </div>
        </motion.div>
      </div>

      <ForgotPasswordDialog open={forgotOpen} onOpenChange={setForgotOpen} />
    </main>
  );
}

function LanguageToggle() {
  const { toggle, locale, t } = useLanguage();
  return (
    <motion.button
      onClick={toggle}
      whileTap={{ scale: 0.95 }}
      className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 shadow-sm transition-colors hover:border-[var(--color-brand-light)] hover:text-[var(--color-brand-deep)]"
      aria-label="Toggle language"
    >
      <Globe className="h-3.5 w-3.5" />
      {locale === "en" ? t("lang.toggle") : t("lang.toggle.en")}
    </motion.button>
  );
}

function ForgotPasswordDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { t, dir } = useLanguage();
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onOpenChange]);
  const [done, setDone] = useState(false);
  const Arrow = dir === "rtl" ? ArrowRight : ArrowLeft;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!username.trim()) return;
    setLoading(true);
    try {
      await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim() }),
      });
      setDone(true);
      toast.success(t("forgot.success"));
    } finally {
      setLoading(false);
    }
  }

  function handleClose(v: boolean) {
    onOpenChange(v);
    if (!v) {
      setTimeout(() => {
        setUsername("");
        setDone(false);
      }, 250);
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          dir={dir}
        >
          <div
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
            onClick={() => handleClose(false)}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 16 }}
            transition={{ duration: 0.3, ease }}
            className="relative z-10 w-full max-w-sm overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
          >
            <div className="h-1.5 w-full bg-gradient-to-r from-[var(--color-brand-deep)] to-[var(--color-brand-light)]" />
            <div className="p-6">
              {!done ? (
                <>
                  <div className="flex items-center gap-2">
                    <span className="grid h-9 w-9 place-items-center rounded-xl bg-[var(--color-brand-light)]/10 text-[var(--color-brand-light)]">
                      <Lock className="h-4 w-4" />
                    </span>
                    <h3 className="text-lg font-bold text-slate-900">
                      {t("forgot.title")}
                    </h3>
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-slate-500">
                    {t("forgot.desc")}
                  </p>
                  <form onSubmit={handleSubmit} className="mt-5 space-y-4">
                    <div>
                      <label
                        htmlFor="fp-username"
                        className="mb-1.5 block text-xs font-medium text-slate-600"
                      >
                        {t("forgot.username")}
                      </label>
                      <div className="group relative">
                        <span className="pointer-events-none absolute inset-y-0 start-0 flex items-center ps-3.5 text-slate-400">
                          <User className="h-4 w-4" />
                        </span>
                        <input
                          id="fp-username"
                          type="text"
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          placeholder={t("forgot.username.ph")}
                          autoFocus
                          className="tanoor-input h-11 w-full rounded-xl border border-slate-300 bg-white ps-10 pe-3 text-sm text-slate-900 placeholder:text-slate-400 transition focus:outline-none"
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleClose(false)}
                        className="h-11 flex-1 rounded-full border border-slate-200 bg-white text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
                      >
                        {t("forgot.cancel")}
                      </button>
                      <button
                        type="submit"
                        disabled={loading || !username.trim()}
                        className="h-11 flex-1 rounded-full bg-gradient-to-r from-[var(--color-brand-deep)] to-[var(--color-brand-light)] text-sm font-semibold text-white shadow-md transition disabled:opacity-60"
                      >
                        {loading ? t("forgot.submitting") : t("forgot.submit")}
                      </button>
                    </div>
                  </form>
                </>
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="py-4 text-center"
                >
                  <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-green-100 text-green-600">
                    <Mail className="h-6 w-6" />
                  </div>
                  <h3 className="mt-4 text-lg font-bold text-slate-900">
                    {t("forgot.title")}
                  </h3>
                  <p className="mt-2 text-xs leading-relaxed text-slate-500">
                    {t("forgot.success")}
                  </p>
                  <button
                    onClick={() => handleClose(false)}
                    className="mt-5 inline-flex h-10 items-center gap-2 rounded-full bg-slate-900 px-5 text-sm font-medium text-white transition hover:bg-slate-800"
                  >
                    <Arrow className="h-4 w-4" />
                    {t("forgot.back")}
                  </button>
                </motion.div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
