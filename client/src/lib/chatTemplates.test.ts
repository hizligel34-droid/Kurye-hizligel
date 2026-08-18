import { describe, expect, it } from "vitest";
import { getChatTemplate, getChatTemplates } from "./chatTemplates";

describe("chat message templates", () => {
  it("returns localized customer templates for every supported language", () => {
    for (const language of ["tr", "en", "ar", "ru", "el", "it", "de", "fr"] as const) {
      const templates = getChatTemplates("customer", language);
      expect(templates).toHaveLength(4);
      expect(templates.map(template => template.id)).toEqual(["coming", "at_address", "at_door", "share_location"]);
      expect(templates.every(template => template.label.length > 0 && template.content.length > 0)).toBe(true);
    }
  });

  it("keeps courier templates distinct from customer templates", () => {
    const courier = getChatTemplates("courier", "tr");
    const customer = getChatTemplates("customer", "tr");
    expect(courier.map(template => template.id)).toEqual(["picked_up", "on_the_way", "arrived", "ready_to_deliver"]);
    expect(courier.map(template => template.id)).not.toEqual(customer.map(template => template.id));
  });

  it("returns a safe undefined result for an unknown template id", () => {
    expect(getChatTemplate("courier", "en", "unknown")).toBeUndefined();
    expect(getChatTemplate("customer", "en", "at_door")?.content).toContain("door");
  });
});
