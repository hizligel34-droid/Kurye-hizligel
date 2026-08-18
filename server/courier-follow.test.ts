import { describe, expect, it } from "vitest";
import { followStateAfterRecenter, followStateAfterUserDrag, shouldAutoCenter } from "../client/src/lib/courierFollow";

describe("Kuryeyi Bul takip modu", () => {
  it("kullanıcı haritayı sürüklediğinde otomatik merkezlemeyi durdurur", () => {
    const state = followStateAfterUserDrag();
    expect(state).toBe("free");
    expect(shouldAutoCenter(state, true)).toBe(false);
  });

  it("Kuryeyi Bul basıldığında takip modunu yeniden açar", () => {
    const state = followStateAfterRecenter();
    expect(state).toBe("following");
    expect(shouldAutoCenter(state, true)).toBe(true);
  });

  it("konum yoksa takip modunda olsa bile merkezleme yapmaz", () => {
    expect(shouldAutoCenter("following", false)).toBe(false);
  });
});
