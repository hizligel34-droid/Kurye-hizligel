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
  it("0553 255 67 45 ve wa.me/905532556745 üretir", () => {
    expect(CUSTOMER_PHONE_NATIONAL).toBe("05532556745");
    expect(CONTACT_PHONE_DISPLAY).toBe("0553 255 67 45");
    expect(CONTACT_PHONE_INTERNATIONAL).toBe("+90 553 255 67 45");
    expect(CONTACT_PHONE_E164).toBe("905532556745");
    expect(CONTACT_PHONE_TEL).toBe("tel:+905532556745");
    expect(CONTACT_WHATSAPP_E164).toBe("905532556745");
    expect(CONTACT_WHATSAPP_HREF).toBe("https://wa.me/905532556745");
    expect(BUSINESS.phone).toBe(CONTACT_PHONE_DISPLAY);
  });

  it("eski müşteri hattını taşımaz", () => {
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
    expect(blob).not.toMatch(/0532|5324746745|905324746745/);
  });
});
