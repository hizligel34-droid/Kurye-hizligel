import { BrandMark } from "@/components/kuryeler/BrandShell";
import { SkipLink } from "@/components/kuryeler/UiStates";
import { Button } from "@/components/ui/button";
import { goldBtn } from "@/lib/kuryelerTheme";
import { AlertCircle, Home } from "lucide-react";
import { Link } from "wouter";

export default function NotFound({
  homeHref = "/",
  homeLabel = "Ana sayfa",
}: {
  homeHref?: string;
  homeLabel?: string;
}) {
  return (
    <div className="flex min-h-dvh w-full flex-col bg-[#0a0a0a] text-[#f5edd6]">
      <SkipLink />
      <header className="border-b border-[#3a3014] bg-black">
        <div className="mx-auto flex h-16 max-w-lg items-center px-4">
          <BrandMark compact href={homeHref} />
        </div>
      </header>
      <main id="icerik" className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-lg rounded-3xl border border-[#3a3014] bg-[#101010] p-8 text-center">
          <AlertCircle className="mx-auto h-16 w-16 text-[#D4AF37]" />
          <h1 className="mt-6 text-4xl font-black">404</h1>
          <h2 className="mt-2 text-xl font-semibold text-[#b4a882]">Sayfa bulunamadı</h2>
          <p className="mt-4 text-sm leading-6 text-[#8a7c52]">
            Aradığınız adres bu uygulamada yok.
          </p>
          <div className="mt-8">
            <Button className={goldBtn} asChild>
              <Link href={homeHref}>
                <Home className="mr-2 h-4 w-4" />
                {homeLabel}
              </Link>
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
