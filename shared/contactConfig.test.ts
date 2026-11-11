import { describe, expect, it } from "vitest";
import {
  CONTACT_PHONE_DISPLAY,
  CONTACT_PHONE_E164,
  CONTACT_PHONE_INTERNATIONAL,
  CONTACT_PHONE_TEL,
  CONTACT_WHATSAPP_E164,
  CONTACT_WHATSAPP_HREF,
  CUSTOMER_PHONE_NATIONAL,
} from "./contactConfig";
import { BUSINESS } from "./kuryeler";

describe("müşteri hattı tek kaynak", () => {
  it("0532 474 67 45 ve wa.me/905324746745 üretir", () => {
    expect(CUSTOMER_PHONE_NATIONAL).toBe("05324746745");
    expect(CONTACT_PHONE_DISPLAY).toBe("0532 474 67 45");
    expect(CONTACT_PHONE_INTERNATIONAL).toBe("+90 532 474 67 45");
    expect(CONTACT_PHONE_E164).toBe("905324746745");
    expect(CONTACT_PHONE_TEL).toBe("tel:+905324746745");
    expect(CONTACT_WHATSAPP_E164).toBe("905324746745");
    expect(CONTACT_WHATSAPP_HREF).toBe("https://wa.me/905324746745");
    expect(BUSINESS.phone).toBe(CONTACT_PHONE_DISPLAY);
  });

  it("0553 hattını taşımaz", () => {
    const blob = [
      CUSTOMER_PHONE_NATIONAL,
      CONTACT_PHONE_DISPLAY,
      CONTACT_PHONE_INTERNATIONAL,
      CONTACT_PHONE_E164,
      CONTACT_PHONE_TEL,
      CONTACT_WHATSAPP_E164,
      CONTACT_WHATSAPP_HREF,
      BUSINESS.phone,
    ].join(" ");
    expect(blob).not.toMatch(/0553|5532556745|905532556745/);
  });
});
