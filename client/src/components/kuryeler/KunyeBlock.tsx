import { contactPhoneTel } from "@/lib/contact";
import { kunyeDisplayLines, type BusinessProfile, type KunyeLine } from "@shared/businessProfile";
import { BUSINESS, CONTACT_PHONE_TEL } from "@shared/kuryeler";

function lineValue(line: KunyeLine) {
  if (line.label === "Telefon") {
    return (
      <a className="font-semibold text-[#D4AF37] hover:underline" href={CONTACT_PHONE_TEL}>
        {line.value}
      </a>
    );
  }
  return line.value;
}

export function KunyeBlock({
  profile = BUSINESS,
  compact = false,
}: {
  profile?: BusinessProfile;
  compact?: boolean;
}) {
  const lines = kunyeDisplayLines(profile);
  if (compact) {
    return (
      <p className="max-w-md text-xs leading-6">
        {lines.map((line, index) => (
          <span key={line.label}>
            {index > 0 ? <br /> : null}
            {line.label}: {lineValue(line)}
          </span>
        ))}
        <br />
        {profile.trademarkNote}
      </p>
    );
  }
  return (
    <section>
      {lines.map(line => (
        <p key={line.label}>
          {line.label}: {lineValue(line)}
        </p>
      ))}
      <p>{profile.trademarkNote}</p>
    </section>
  );
}

export function kunyePhoneHref() {
  return contactPhoneTel();
}
