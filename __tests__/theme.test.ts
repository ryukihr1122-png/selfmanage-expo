/**
 * テーマ定義のテスト
 */
import { LightColors, DarkColors, FontSize, Spacing, BorderRadius } from "../constants/theme";

describe("theme constants", () => {
  it("LightColors has all required keys", () => {
    const requiredKeys = ["bg", "card", "text", "gold", "green", "red", "white"];
    for (const key of requiredKeys) {
      expect(LightColors).toHaveProperty(key);
    }
  });

  it("DarkColors has all required keys", () => {
    const requiredKeys = ["bg", "card", "text", "gold", "green", "red", "white"];
    for (const key of requiredKeys) {
      expect(DarkColors).toHaveProperty(key);
    }
  });

  it("DarkColors bg is darker than LightColors bg", () => {
    // Simple check: dark bg starts with lower hex values
    expect(DarkColors.bg).not.toBe(LightColors.bg);
    // Dark bg should be a dark color (starts with #1 or #2)
    expect(DarkColors.bg.charAt(1)).toMatch(/[0-3]/);
  });

  it("FontSize values are positive numbers", () => {
    for (const val of Object.values(FontSize)) {
      expect(typeof val).toBe("number");
      expect(val).toBeGreaterThan(0);
    }
  });

  it("Spacing values are positive numbers", () => {
    for (const val of Object.values(Spacing)) {
      expect(typeof val).toBe("number");
      expect(val).toBeGreaterThan(0);
    }
  });

  it("BorderRadius values are non-negative", () => {
    for (const val of Object.values(BorderRadius)) {
      expect(typeof val).toBe("number");
      expect(val).toBeGreaterThanOrEqual(0);
    }
  });
});
