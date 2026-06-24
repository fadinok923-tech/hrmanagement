import { BrandPanel } from "@/components/brand-panel";
import { LoginPanel } from "@/components/login-panel";

export default function Home() {
  return (
    <div className="grid min-h-screen w-full grid-cols-1 lg:grid-cols-[5fr_6fr] xl:grid-cols-[2fr_3fr]">
      <BrandPanel />
      <LoginPanel />
    </div>
  );
}
