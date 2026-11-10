import { contactEmail, contactPhoneDisplay, whatsappHref } from "@/lib/contact";

export function PwaLegalLinks() {
  const phone = contactPhoneDisplay();
  const tel = `+90${phone.replace(/\D/g, "").slice(-10)}`;
  return (
    <nav aria-label="İletişim ve yasal" className="flex flex-wrap gap-x-4 gap-y-2 text-xs font-semibold text-[#8a7c52]">
      <a className="hover:text-[#D4AF37]" href={`tel:${tel}`}>
        {phone}
      </a>
      <a className="hover:text-[#D4AF37]" href={whatsappHref()} target="_blank" rel="noopener noreferrer">
        WhatsApp
      </a>
      <a className="hover:text-[#D4AF37]" href={`mailto:${contactEmail()}`}>
        {contactEmail()}
      </a>
      <a className="hover:text-[#D4AF37]" href="/kvkk">
        KVKK
      </a>
      <a className="hover:text-[#D4AF37]" href="/kosullar">
        Kullanım koşulları
      </a>
    </nav>
  );
}
