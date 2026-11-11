import {
  CONTACT_EMAIL,
  CONTACT_PHONE_DISPLAY,
  CONTACT_PHONE_TEL,
  CONTACT_WHATSAPP_E164,
  CONTACT_WHATSAPP_HREF,
} from "@shared/kuryeler";

export function whatsappNumber() {
  return CONTACT_WHATSAPP_E164;
}

export function whatsappHref(text?: string) {
  if (!text) return CONTACT_WHATSAPP_HREF;
  return `${CONTACT_WHATSAPP_HREF}?text=${encodeURIComponent(text)}`;
}

export function contactEmail() {
  return import.meta.env.VITE_CONTACT_EMAIL ?? CONTACT_EMAIL;
}

export function contactPhoneDisplay() {
  return CONTACT_PHONE_DISPLAY;
}

export function contactPhoneTel() {
  return CONTACT_PHONE_TEL;
}
