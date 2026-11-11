import { BrandMark, DemoBanner, InstallHint } from "@/components/kuryeler/BrandShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useKuryelerAuth } from "@/contexts/KuryelerAuth";
import { getPricing, requestPasswordReset } from "@/lib/kuryelerApi";
import { cardClass, fieldClass, goldBtn } from "@/lib/kuryelerTheme";
import { FieldError, SkipLink } from "@/components/kuryeler/UiStates";
import { firstError, validateAuthForm, type FieldErrors } from "@shared/kuryelerValidation";
import { normalizeTurkishMobilePhone } from "@shared/orderValidation";
import {
  CONTACT_PHONE_DISPLAY,
  DEMO_SIGNUP_HINT,
  canSelfSignupRole,
  isLocalDemoPreview,
  isShowcaseMode,
  ROLE_LABELS,
  type UserRole,
} from "@shared/kuryeler";
import { PANEL_ROLE, PWA_APPS, type PwaPanel } from "@shared/kuryelerPwa";
import { useEffect, useState, type FormEvent } from "react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";

export default function AuthPage({
  mode,
  panel,
}: {
  mode: "giris" | "kayit";
  panel: PwaPanel;
}) {
  const { signIn, signUp, user, mode: dataMode } = useKuryelerAuth();
  const [, navigate] = useLocation();
  const expectedRole: UserRole = PANEL_ROLE[panel];
  const app = PWA_APPS[panel];
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [resetOpen, setResetOpen] = useState(false);
  const [showcase, setShowcase] = useState(isShowcaseMode());
  const localDemo = isLocalDemoPreview();
  const courierSignupClosed = mode === "kayit" && panel === "kurye" && !canSelfSignupRole("courier", localDemo);
  const adminSignupClosed = mode === "kayit" && panel === "yonetici" && !canSelfSignupRole("admin", localDemo);
  const signupClosed = courierSignupClosed || adminSignupClosed;

  useEffect(() => {
    void getPricing()
      .then(pricing => setShowcase(isShowcaseMode(pricing)))
      .catch(() => setShowcase(isShowcaseMode()));
  }, []);

  useEffect(() => {
    if (user) navigate("/");
  }, [user, navigate]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const nextErrors = validateAuthForm({
      mode,
      email,
      password,
      fullName,
      phone,
    });
    if (adminSignupClosed) {
      nextErrors.email = "Yönetici hesabı bu uygulamadan açılamaz.";
    }
    if (mode === "kayit" && showcase) {
      nextErrors.email = "Vitrin modunda kayıt alınmaz.";
    }
    setFieldErrors(nextErrors);
    const message = firstError(nextErrors);
    if (message) {
      toast.error(message);
      return;
    }
    if (signupClosed) {
      toast.error(
        adminSignupClosed ? "Yönetici hesabı bu uygulamadan açılmaz." : "Kurye hesabı bu uygulamadan açılmaz.",
      );
      return;
    }
    setBusy(true);
    try {
      if (mode === "giris") {
        await signIn(email, password);
        toast.success("Giriş başarılı");
        navigate("/");
        return;
      }
      await signUp({
        email,
        password,
        fullName,
        phone: normalizeTurkishMobilePhone(phone),
        role: expectedRole,
      });
      toast.success("Hesabınız oluşturuldu");
      navigate("/");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "İşlem başarısız");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="touch-scope min-h-dvh overflow-x-clip bg-[#0a0a0a] pb-[env(safe-area-inset-bottom)] text-base leading-[1.5] text-[#f5edd6]">
      <SkipLink />
      <DemoBanner />
      <header className="border-b border-[#3a3014] bg-black pt-[env(safe-area-inset-top)]">
        <div className="mx-auto flex h-16 max-w-lg items-center px-4">
          <BrandMark compact href="/" />
        </div>
      </header>
      <main id="icerik" className="mx-auto max-w-lg px-4 py-8">
        <Card className={cardClass}>
          <CardHeader>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#D4AF37]">
              {app.name} · {mode === "giris" ? "Giriş" : "Kayıt"}
            </p>
            <CardTitle className="text-2xl font-black text-[#f5edd6]">
              {mode === "giris" ? "Hesabınıza girin" : `${app.name} kaydı`}
            </CardTitle>
            <InstallHint panel={panel} />
          </CardHeader>
          <CardContent>
            {signupClosed ? (
              <p className="mb-4 rounded-2xl border border-[#3a3014] bg-black p-4 text-sm text-[#b4a882]">
                {adminSignupClosed
                  ? "Yönetici hesabı bu uygulamadan açılmaz."
                  : "Kurye hesabı bu uygulamadan açılmaz. Yönetici sizi kurye olarak atar."}
              </p>
            ) : null}
            <form className="space-y-3" onSubmit={submit} noValidate>
              {mode === "kayit" && !adminSignupClosed && (
                <>
                  <div>
                    <label className="mb-1 block text-sm font-semibold text-[#8a7c52]" htmlFor="full-name">
                      Ad soyad
                    </label>
                    <Input
                      id="full-name"
                      className={fieldClass}
                      placeholder="Ad soyad"
                      value={fullName}
                      aria-invalid={Boolean(fieldErrors.fullName)}
                      aria-describedby={fieldErrors.fullName ? "full-name-err" : undefined}
                      onChange={e => setFullName(e.target.value)}
                      autoComplete="name"
                    />
                    <FieldError id="full-name-err" message={fieldErrors.fullName} />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-semibold text-[#8a7c52]" htmlFor="signup-phone">
                      Cep telefonu
                    </label>
                    <Input
                      id="signup-phone"
                      className={fieldClass}
                      placeholder="05xx xxx xx xx"
                      value={phone}
                      aria-invalid={Boolean(fieldErrors.phone)}
                      aria-describedby={fieldErrors.phone ? "signup-phone-err" : undefined}
                      onChange={e => setPhone(e.target.value)}
                      type="tel"
                      inputMode="tel"
                      autoComplete="tel"
                    />
                    <FieldError id="signup-phone-err" message={fieldErrors.phone} />
                  </div>
                </>
              )}
              <div>
                <label className="mb-1 block text-sm font-semibold text-[#8a7c52]" htmlFor="email">
                  E-posta
                </label>
                <Input
                  id="email"
                  className={fieldClass}
                  type="email"
                  placeholder="E-posta"
                  value={email}
                  aria-invalid={Boolean(fieldErrors.email)}
                  aria-describedby={fieldErrors.email ? "email-err" : undefined}
                  onChange={e => setEmail(e.target.value)}
                  autoComplete="email"
                />
                <FieldError id="email-err" message={fieldErrors.email} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-[#8a7c52]" htmlFor="password">
                  Şifre
                </label>
                <Input
                  id="password"
                  className={fieldClass}
                  type="password"
                  placeholder="Şifre"
                  value={password}
                  aria-invalid={Boolean(fieldErrors.password)}
                  aria-describedby={fieldErrors.password ? "password-err" : undefined}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete={mode === "giris" ? "current-password" : "new-password"}
                />
                <FieldError id="password-err" message={fieldErrors.password} />
              </div>
              {mode === "kayit" ? (
                <p className="text-sm leading-6 text-[#8a7c52]">
                  Hesap oluşturarak{" "}
                  <a href="/kullanim-kosullari" className="inline-flex min-h-11 items-center font-bold text-[#D4AF37]">
                    Kullanım Koşulları
                  </a>
                  ’nı kabul etmiş olursunuz. Kişisel verilerinizin nasıl işlendiğini{" "}
                  <a href="/kvkk" className="inline-flex min-h-11 items-center font-bold text-[#D4AF37]">
                    KVKK Aydınlatma Metni
                  </a>
                  {panel === "kurye" ? " (kurye adayları için aynı metin, kurye bölümü)" : ""}
                  ’nde okuyabilirsiniz.
                </p>
              ) : null}
              {mode === "kayit" && showcase ? (
                <p className="rounded-xl border border-[#3a3014] bg-[#1a1508] p-3 text-xs text-[#D4AF37]">
                  Vitrin modu: yeni kayıt kapalıdır. {CONTACT_PHONE_DISPLAY}
                </p>
              ) : (
                <Button className={`h-12 w-full ${goldBtn}`} disabled={busy || signupClosed || (mode === "kayit" && showcase)}>
                  {busy ? "Lütfen bekleyin…" : mode === "giris" ? "Giriş yap" : "Hesap oluştur"}
                </Button>
              )}
            </form>
            {mode === "giris" ? (
              <div className="mt-3 text-center">
                {resetOpen ? (
                  <button
                    type="button"
                    className="inline-flex min-h-11 min-w-11 items-center justify-center px-3 text-base font-bold text-[#D4AF37]"
                    onClick={() => {
                      if (!email.trim()) {
                        toast.error("Önce e-posta yazın.");
                        return;
                      }
                      void requestPasswordReset(email)
                        .then(() => toast.success("Sıfırlama bağlantısı e-postanıza gönderilir."))
                        .catch(err => toast.error(err instanceof Error ? err.message : "Gönderilemedi"));
                    }}
                  >
                    Sıfırlama e-postası gönder
                  </button>
                ) : (
                  <button
                    type="button"
                    className="inline-flex min-h-11 min-w-11 items-center justify-center px-3 text-base font-bold text-[#D4AF37]"
                    onClick={() => setResetOpen(true)}
                  >
                    Şifremi unuttum
                  </button>
                )}
              </div>
            ) : null}
            <p className="mt-4 text-center text-sm text-[#8a7c52]">
              {mode === "giris" && !showcase && (panel !== "yonetici" || localDemo) ? (
                <>
                  Hesabınız yok mu?{" "}
                  <Link href="/kayit" className="inline-flex min-h-11 items-center px-2 font-bold text-[#D4AF37]">
                    Kayıt olun
                  </Link>
                </>
              ) : mode === "kayit" ? (
                <>
                  Zaten üye misiniz?{" "}
                  <Link href="/giris" className="inline-flex min-h-11 items-center px-2 font-bold text-[#D4AF37]">
                    Giriş yapın
                  </Link>
                </>
              ) : (
                "Yönetici hesabı kayıtla açılmaz."
              )}
            </p>
            <p className="mt-3 text-center text-sm text-[#8a7c52]">
              Bu uygulama yalnızca {ROLE_LABELS[expectedRole].toLocaleLowerCase("tr-TR")} hesapları içindir.
            </p>
            {dataMode === "demo" ? (
              <p className="mt-4 text-center text-sm text-[#8a7c52]">{DEMO_SIGNUP_HINT}</p>
            ) : null}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
