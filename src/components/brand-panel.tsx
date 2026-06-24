"use client";

import { motion } from "framer-motion";
import {
  ShieldCheck,
  Globe,
  Building2,
  ScrollText,
  CreditCard,
  type LucideIcon,
} from "lucide-react";
import { useLanguage } from "@/components/language-provider";
import { Logo } from "@/components/logo";

const ease = [0.22, 1, 0.36, 1] as const;

const portalIcons: { key: string; Icon: LucideIcon; href: string; label: string }[] = [
  { key: "portal.absher", Icon: ShieldCheck, href: "https://www.absher.sa", label: "Absher" },
  { key: "portal.qiwa", Icon: ScrollText, href: "https://www.qiwa.sa", label: "Qiwa" },
  { key: "portal.modon", Icon: Building2, href: "https://www.modon.gov.sa", label: "MODON" },
  { key: "portal.mudad", Icon: CreditCard, href: "https://www.mudad.gov.sa", label: "Mudad" },
];

export function BrandPanel() {
  const { t, dir } = useLanguage();

  return (
    <aside
      dir={dir}
      className="relative hidden lg:flex flex-col justify-between overflow-hidden text-white brand-sheen"
      style={{ background: "linear-gradient(155deg, #1e3a8a 0%, #1d3f97 50%, #1e40af 100%)" }}
    >
      {/* Decorative layers */}
      <div className="absolute inset-0 brand-grid opacity-60" aria-hidden />
      <div className="absolute inset-0 brand-glow" aria-hidden />

      {/* Floating orbs */}
      <motion.div
        aria-hidden
        className="absolute top-24 end-16 h-40 w-40 rounded-full blur-3xl float-slow"
        style={{ background: "rgba(96,165,250,0.22)" }}
      />
      <motion.div
        aria-hidden
        className="absolute bottom-32 start-12 h-44 w-44 rounded-full blur-3xl float-slow"
        style={{ background: "rgba(245,158,11,0.16)", animationDelay: "1.6s" }}
      />

      {/* Top: Branding */}
      <div className="relative z-10 p-10 xl:p-12">
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease }}
          className="flex items-center gap-3"
        >
          <Logo className="h-11 w-11 rounded-2xl shadow-lg shadow-black/20" />
          <div>
            <div className="text-lg font-bold leading-tight tracking-tight">
              {t("brand.name")}
            </div>
            <div className="text-xs text-white/70">{t("brand.sub")}</div>
          </div>
          <span className="ms-3 inline-flex items-center rounded-full border border-[var(--color-gold-soft)] bg-[var(--color-gold-soft)] px-3 py-1 text-[11px] font-semibold text-[#7c4a03]">
            {t("brand.badge")}
          </span>
        </motion.div>

        {/* Hero */}
        <div className="mt-14 max-w-md">
          <motion.h1
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease, delay: 0.18 }}
            className="mt-5 text-4xl xl:text-[2.6rem] font-bold leading-[1.12] tracking-tight"
          >
            {t("hero.title")}{" "}
            <span className="bg-gradient-to-r from-[var(--color-gold)] to-[#fbbf24] bg-clip-text text-transparent">
              {t("hero.eyebrow")}
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease, delay: 0.28 }}
            className="mt-4 text-sm leading-relaxed text-white/75"
          >
            {t("hero.desc")}
          </motion.p>
        </div>

        {/* Feature cards (2x2) */}
        <div className="mt-10 grid max-w-md grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((n, i) => {
            return (
              <motion.div
                key={n}
                initial={{ opacity: 0, y: 22, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.55, ease, delay: 0.35 + i * 0.1 }}
                whileHover={{ y: -4 }}
                className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.06] p-4 backdrop-blur-sm transition-colors hover:bg-white/[0.12]"
              >
                <div className="absolute -end-6 -top-6 h-16 w-16 rounded-full bg-[var(--color-gold)]/10 blur-xl transition-all group-hover:bg-[var(--color-gold)]/25" />
                <div className="relative flex items-center gap-3">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[var(--color-gold)] text-xs font-bold text-[#1e3a8a] shadow-md">
                    {String(n).padStart(2, "0")}
                  </span>
                </div>
                <div className="relative mt-3 text-sm font-medium leading-snug text-white">
                  {t(`feature.${n}`)}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Bottom: Government portals + footer */}
      <div className="relative z-10 p-10 xl:p-12 pt-0">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease, delay: 0.7 }}
        >
          <div className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/55">
            <Globe className="h-3.5 w-3.5" />
            {t("portals.title")}
          </div>
          <div className="flex flex-wrap items-center gap-2.5 rounded-2xl border border-white/15 bg-white/[0.1] p-3 backdrop-blur-sm">
            {portalIcons.map(({ key, Icon, href, label }, i) => (
              <motion.a
                key={key}
                href={href}
                target="_blank"
                rel="noreferrer noopener"
                title={`${label} — ${t(key)}`}
                aria-label={`${label} — ${t(key)}`}
                initial={{ opacity: 0, scale: 0.6, rotate: -20 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                transition={{ duration: 0.5, ease, delay: 0.8 + i * 0.09 }}
                whileHover={{ y: -4, scale: 1.12 }}
                whileTap={{ scale: 0.92 }}
                className="group relative grid h-10 w-10 place-items-center rounded-full border border-white/20 bg-[var(--color-brand-light)]/35 text-white transition-colors hover:border-[var(--color-gold)] hover:bg-[var(--color-brand-light)]/60"
              >
                <Icon className="h-[18px] w-[18px] text-[var(--color-gold)] transition-transform group-hover:scale-110" />
                <span className="pointer-events-none absolute -bottom-9 left-1/2 z-20 -translate-x-1/2 whitespace-nowrap rounded-md bg-slate-900/90 px-2 py-0.5 text-[10px] font-medium text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
                  {t(key)}
                </span>
              </motion.a>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 1 }}
          className="mt-8 flex items-center justify-between border-t border-white/10 pt-5 text-xs text-white/55"
        >
          <span>{t("footer.copy")}</span>
          <span className="inline-flex items-center gap-1.5">
            <span className="relative inline-flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full rounded-full bg-[var(--color-gold)] pulse-ring" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--color-gold)]" />
            </span>
            {t("footer.compliance")}
          </span>
        </motion.div>
      </div>
    </aside>
  );
}
