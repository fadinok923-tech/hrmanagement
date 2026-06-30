"use client";

import { useEffect, useState } from "react";
import { BrandPanel } from "@/components/brand-panel";
import { LoginPanel } from "@/components/login-panel";
import { Dashboard } from "@/components/dashboard/dashboard";

export default function Home() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    let shouldLogin = false;
    try {
      const raw = sessionStorage.getItem("tanoor-session");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.user) shouldLogin = true;
      }
    } catch {}
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
     
    setLoggedIn(shouldLogin);
  }, []);

  if (!mounted || !loggedIn) {
    return (
      <div className="grid min-h-screen w-full grid-cols-1 lg:grid-cols-[5fr_6fr] xl:grid-cols-[2fr_3fr]">
        <BrandPanel />
        <LoginPanel />
      </div>
    );
  }

  return (
    <Dashboard
      onLogout={() => {
        sessionStorage.removeItem("tanoor-session");
        setLoggedIn(false);
      }}
    />
  );
}
