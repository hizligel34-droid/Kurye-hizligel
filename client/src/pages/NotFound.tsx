import { BrandMark } from "@/components/kuryeler/BrandShell";
import { SiteFooter } from "@/components/kuryeler/SiteFooter";
import { SkipLink } from "@/components/kuryeler/UiStates";
import { Button } from "@/components/ui/button";
import { goldBtn } from "@/lib/kuryelerTheme";
import { AlertCircle, Home } from "lucide-react";
import { useLocation } from "wouter";

export default function NotFound() {
  const [, setLocation] = useLocation();

  return (
    <div className="flex min-h-dvh w-full flex-col bg-[#0a0a0a] text-[#f5edd6]">
      <SkipLink />
      <header className="border-b border-[#3a3014] bg-black">
        <div className="mx-auto flex h-16 max-w-lg items-center px-4">
          <BrandMark compact />
        </div>
      </header>
      <main id="icerik" className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg rounded-3xl border border-[#3a3014] bg-[#101010] p-8 text-center">
        <AlertCircle className="mx-auto h-16 w-16 text-[#D4AF37]" />
        <h1 className="mt-6 text-4xl font-black">404</h1>
        <h2 className="mt-2 text-xl font-semibold text-[#b4a882]">Sayfa bulunamadı</h2>
        <p className="mt-4 text-sm leading-6 text-[#8a7c52]">
          Aradığınız adres yok. Ana sayfaya veya müşteri paneline dönebilirsiniz.
        </p>
        <div id="not-found-button-group" className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Button className={goldBtn} onClick={() => setLocation("/")}>
            <Home className="mr-2 h-4 w-4" />
            Ana sayfa
          </Button>
          <Button variant="outline" className="border-[#3a3014] bg-transparent text-[#f5edd6]" onClick={() => setLocation("/musteri")}>
            Müşteri paneli
          </Button>
        </div>
      </div>
      </main>
      <SiteFooter />
    </div>
  );
}
