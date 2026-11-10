import {
  CONTACT_EMAIL,
  CONTACT_PHONE_DISPLAY,
  CONTACT_PHONE_TEL,
  CONTACT_WHATSAPP_E164,
} from "@shared/kuryeler";

export function whatsappNumber() {
  return (import.meta.env.VITE_WHATSAPP_NUMBER ?? CONTACT_WHATSAPP_E164).replace(/\D/g, "");
}

export function whatsappHref(text = "Merhaba, kuryeler.tr üzerinden sipariş vermek istiyorum.") {
  return `https://wa.me/${whatsappNumber()}?text=${encodeURIComponent(text)}`;
}

export function contactEmail() {
  return import.meta.env.VITE_CONTACT_EMAIL ?? CONTACT_EMAIL;
}

export function contactPhoneDisplay() {
  return import.meta.env.VITE_CONTACT_PHONE ?? CONTACT_PHONE_DISPLAY;
}

export function contactPhoneTel() {
  const digits = contactPhoneDisplay().replace(/\D/g, "");
  const national = digits.slice(-10);
  return national.length === 10 ? `tel:+90${national}` : CONTACT_PHONE_TEL;
}
