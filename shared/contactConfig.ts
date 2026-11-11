/** Müşteri hattı — tek kaynak. Başka dosyaya numara yazma. */

export const CUSTOMER_PHONE_NATIONAL = "05532556745";

const ten = CUSTOMER_PHONE_NATIONAL.slice(-10);

export const CONTACT_PHONE_DISPLAY = `${CUSTOMER_PHONE_NATIONAL.slice(0, 4)} ${CUSTOMER_PHONE_NATIONAL.slice(4, 7)} ${CUSTOMER_PHONE_NATIONAL.slice(7, 9)} ${CUSTOMER_PHONE_NATIONAL.slice(9)}`;
export const CONTACT_PHONE_INTERNATIONAL = `+90 ${ten.slice(0, 3)} ${ten.slice(3, 6)} ${ten.slice(6, 8)} ${ten.slice(8)}`;
export const CONTACT_PHONE_E164 = `90${ten}`;
export const CONTACT_PHONE_TEL = `tel:+${CONTACT_PHONE_E164}`;
export const CONTACT_WHATSAPP_E164 = CONTACT_PHONE_E164;
export const CONTACT_WHATSAPP_HREF = `https://wa.me/${CONTACT_WHATSAPP_E164}`;
