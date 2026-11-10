import { BrandMark, DemoBanner } from "@/components/kuryeler/BrandShell";
import { DraftLegalBanner } from "@/components/kuryeler/DraftLegalBanner";
import { KunyeBlock } from "@/components/kuryeler/KunyeBlock";
import { SiteFooter } from "@/components/kuryeler/SiteFooter";
import { SkipLink } from "@/components/kuryeler/UiStates";
import { cardClass } from "@/lib/kuryelerTheme";
import { LEGAL_DOCUMENTS, LEGAL_PAGE_LINKS, type LegalDocKey } from "@shared/legalTexts";
import { Link } from "wouter";

export type LegalKind =
  | "kunye"
  | "iletisim"
  | "islem-rehberi"
  | "kvkk"
  | "cerez"
  | "kosullar"
  | "on-bilgi"
  | "mesafeli"
  | "odeme-bilgisi"
  | "aracilik"
  | "kurye-soz"
  | "gonderici-soz";

const KIND_TO_DOC: Record<LegalKind, LegalDocKey> = {
  kunye: "kunye",
  iletisim: "kunye",
  "islem-rehberi": "islem_rehberi",
  kvkk: "kvkk",
  cerez: "cerez",
  kosullar: "kosullar",
  "on-bilgi": "on_bilgi",
  mesafeli: "mesafeli",
  "odeme-bilgisi": "odeme",
  aracilik: "aracilik",
  "kurye-soz": "kurye_soz",
  "gonderici-soz": "gonderici_soz",
};

export default function LegalPage({ kind }: { kind: LegalKind }) {
  const doc = LEGAL_DOCUMENTS[KIND_TO_DOC[kind]];
  const showKunye = kind === "kunye" || kind === "iletisim";
  return (
    <div className="min-h-dvh bg-[#0a0a0a] text-[#f5edd6]">
      <SkipLink />
      <DemoBanner />
      <header className="border-b border-[#3a3014] bg-black">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-4">
          <BrandMark compact />
          <Link href="/" className="text-sm font-bold text-[#D4AF37]">
            Ana sayfa
          </Link>
        </div>
      </header>
      <main id="icerik" className="mx-auto max-w-3xl px-4 py-8 sm:py-12">
        <DraftLegalBanner />
        <p className="mt-4 text-xs font-bold uppercase tracking-[0.2em] text-[#D4AF37]">Yasal</p>
        <h1 className="mt-2 text-3xl font-black">{kind === "iletisim" ? "İletişim / Künye" : doc.title}</h1>
        <p className="mt-2 text-xs text-[#8a7c52]">Sürüm {doc.version}</p>
        <article className={`${cardClass} mt-6 space-y-5 p-5 text-base leading-7 text-[#b4a882] sm:p-8`}>
          {showKunye ? (
            <div className="space-y-3">
              <KunyeBlock />
              <p className="text-xs text-[#8a7c52]">
                İşletme esnaftır; MERSİS satırı gösterilmez. Vergi kimlik no ve KEP henüz yok; yer tutucu olarak ?
                gösterilir.
              </p>
            </div>
          ) : null}
          <pre className="whitespace-pre-wrap font-sans text-base leading-7">{doc.body}</pre>
        </article>
        <nav className="mt-6 flex flex-wrap gap-3 text-sm font-semibold text-[#D4AF37]" aria-label="Yasal sayfalar">
          {LEGAL_PAGE_LINKS.map(link => (
            <Link key={link.href} href={link.href}>
              {link.label}
            </Link>
          ))}
        </nav>
      </main>
      <SiteFooter />
    </div>
  );
}
