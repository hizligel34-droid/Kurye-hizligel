import { BrandMark, DemoBanner, InstallHint } from "@/components/kuryeler/BrandShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useKuryelerAuth, panelPathForRole } from "@/contexts/KuryelerAuth";
import { DEMO_ACCOUNTS } from "@/lib/kuryelerApi";
import { cardClass, fieldClass, goldBtn } from "@/lib/kuryelerTheme";
import { FieldError, SkipLink } from "@/components/kuryeler/UiStates";
import { firstError, validateAuthForm, type FieldErrors } from "@shared/kuryelerValidation";
import { normalizeTurkishMobilePhone } from "@shared/orderValidation";
import { ROLE_LABELS, type UserRole } from "@shared/kuryeler";
import type { PwaPanel } from "@shared/kuryelerPwa";
import { useEffect, useState, type FormEvent } from "react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";

const PANEL_ROLE: Record<Exclude<PwaPanel, "site">, UserRole> = {
  musteri: "customer",
  kurye: "courier",
  yonetici: "admin",
};

export default function AuthPage({
  mode,
  panel,
}: {
  mode: "giris" | "kayit";
  panel: Exclude<PwaPanel, "site">;
}) {
  const { signIn, signUp, user, mode: dataMode } = useKuryelerAuth();
  const [, navigate] = useLocation();
  const expectedRole = PANEL_ROLE[panel];
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<"customer" | "courier">(
    panel === "kurye" ? "courier" : "customer",
  );
  const [busy, setBusy] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("demo") !== "1") return;
    const account = DEMO_ACCOUNTS.find(item => item.role === expectedRole);
    if (!account) return;
    setEmail(account.email);
    setPassword(account.password);
    void signIn(account.email, account.password)
      .then(next => navigate(panelPathForRole(next.role)))
      .catch(error => toast.error(error instanceof Error ? error.message : "Demo giriş başarısız"));
    // Demo otomatik giriş yalnızca ilk yüklemede.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expectedRole]);

  useEffect(() => {
    if (!user) return;
    if (user.role !== expectedRole) {
      toast.message(`${ROLE_LABELS[user.role]} hesabı kendi paneline alındı`);
    }
    navigate(panelPathForRole(user.role));
  }, [user, expectedRole, navigate]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const nextErrors = validateAuthForm({
      mode,
      email,
      password,
      fullName,
      phone,
    });
    if (mode === "kayit" && panel === "yonetici") {
      nextErrors.email = "Yönetici hesabı kayıt formundan açılamaz; mevcut yönetici atar.";
    }
    setFieldErrors(nextErrors);
    const message = firstError(nextErrors);
    if (message) {
      toast.error(message);
      return;
    }
    setBusy(true);
    try {
      if (mode === "giris") {
        const next = await signIn(email, password);
        if (next.role !== expectedRole) {
          toast.message(`Bu hesap ${ROLE_LABELS[next.role]} paneline aittir`);
        } else {
          toast.success("Giriş başarılı");
        }
        navigate(panelPathForRole(next.role));
        return;
      }
      const next = await signUp({
        email,
        password,
        fullName,
        phone: normalizeTurkishMobilePhone(phone),
        role,
      });
      toast.success("Hesabınız oluşturuldu");
      navigate(panelPathForRole(next.role));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "İşlem başarısız");
    } finally {
      setBusy(false);
    }
  };

  const demoForPanel = DEMO_ACCOUNTS.filter(account => account.role === expectedRole);

  return (
    <div className="min-h-dvh bg-[#0a0a0a] text-[#f5edd6]">
      <SkipLink />
      <DemoBanner />
      <header className="border-b border-[#3a3014] bg-black">
        <div className="mx-auto flex h-16 max-w-lg items-center px-4">
          <BrandMark compact />
        </div>
      </header>
      <main id="icerik" className="mx-auto max-w-lg px-4 py-8">
        <Card className={cardClass}>
          <CardHeader>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#D4AF37]">
              {ROLE_LABELS[expectedRole]} · {mode === "giris" ? "Giriş" : "Kayıt"}
            </p>
            <CardTitle className="text-2xl font-black text-[#f5edd6]">
              {mode === "giris" ? "Panele girin" : "kuryeler.tr’ye katılın"}
            </CardTitle>
            <InstallHint panel={panel} />
          </CardHeader>
          <CardContent>
            <form className="space-y-3" onSubmit={submit} noValidate>
              {mode === "kayit" && panel !== "yonetici" && (
                <>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-[#8a7c52]" htmlFor="full-name">
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
                    <label className="mb-1 block text-xs font-semibold text-[#8a7c52]" htmlFor="signup-phone">
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
                      inputMode="tel"
                      autoComplete="tel"
                    />
                    <FieldError id="signup-phone-err" message={fieldErrors.phone} />
                  </div>
                  {panel === "musteri" && (
                    <div className="grid grid-cols-2 gap-2">
                      {(["customer", "courier"] as const).map(option => (
                        <button
                          type="button"
                          key={option}
                          onClick={() => setRole(option)}
                          className={`rounded-2xl border px-3 py-3 text-sm font-bold ${
                            role === option
                              ? "border-[#D4AF37] bg-[#1a1508] text-[#D4AF37]"
                              : "border-[#3a3014] bg-black text-[#b4a882]"
                          }`}
                        >
                          {ROLE_LABELS[option]}
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}
              <div>
                <label className="mb-1 block text-xs font-semibold text-[#8a7c52]" htmlFor="email">
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
                <label className="mb-1 block text-xs font-semibold text-[#8a7c52]" htmlFor="password">
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
              <Button className={`h-11 w-full ${goldBtn}`} disabled={busy}>
                {busy ? "Lütfen bekleyin…" : mode === "giris" ? "Giriş yap" : "Hesap oluştur"}
              </Button>
            </form>
            <p className="mt-4 text-center text-sm text-[#8a7c52]">
              {mode === "giris" && panel !== "yonetici" ? (
                <>
                  Hesabınız yok mu?{" "}
                  <Link href={`/${panel}/kayit`} className="font-bold text-[#D4AF37]">
                    Kayıt olun
                  </Link>
                </>
              ) : mode === "kayit" ? (
                <>
                  Zaten üye misiniz?{" "}
                  <Link href={`/${panel}/giris`} className="font-bold text-[#D4AF37]">
                    Giriş yapın
                  </Link>
                </>
              ) : (
                "Yönetici hesabı kayıtla açılmaz."
              )}
            </p>
            {dataMode === "demo" && (
              <div className="mt-6 space-y-2 rounded-2xl border border-[#3a3014] bg-black p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-[#8a7c52]">
                  Demo hesap
                </p>
                {demoForPanel.map(account => (
                  <button
                    key={account.email}
                    type="button"
                    className="flex w-full items-center justify-between rounded-xl border border-[#3a3014] bg-[#141414] px-3 py-2 text-left text-sm"
                    onClick={() => {
                      setEmail(account.email);
                      setPassword(account.password);
                    }}
                  >
                    <span className="font-semibold text-[#D4AF37]">{ROLE_LABELS[account.role]}</span>
                    <span className="text-xs text-[#8a7c52]">{account.email}</span>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
