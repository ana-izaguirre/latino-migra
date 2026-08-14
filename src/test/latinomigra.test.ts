import { describe, it, expect } from "vitest";
import { TRANSLATIONS } from "../lib/i18n";
import { SCHOLARSHIPS_DATA } from "../data/scholarships";
import { MIGRATION_GUIDES_DATA } from "../data/migrationGuides";

describe("LatinoMigra - Core Unit Tests", () => {
  describe("i18n Translations", () => {
    it("has Spanish and English translations for all navigation and UI keys", () => {
      const keys = Object.keys(TRANSLATIONS);
      expect(keys.length).toBeGreaterThan(15);

      for (const key of keys) {
        expect(TRANSLATIONS[key].es).toBeTruthy();
        expect(TRANSLATIONS[key].en).toBeTruthy();
        expect(typeof TRANSLATIONS[key].es).toBe("string");
        expect(typeof TRANSLATIONS[key].en).toBe("string");
      }
    });
  });

  describe("Scholarships Dataset", () => {
    it("contains valid scholarships with required metadata", () => {
      expect(SCHOLARSHIPS_DATA.length).toBeGreaterThan(0);

      SCHOLARSHIPS_DATA.forEach((beca) => {
        expect(beca.id).toBeDefined();
        expect(beca.title).toBeTruthy();
        expect(beca.country).toBeTruthy();
        expect(beca.area).toBeTruthy();
        expect(beca.supportType).toBeTruthy();
        expect(Array.isArray(beca.requirements)).toBe(true);
      });
    });

    it("can filter scholarships by destination country", () => {
      const spainScholarships = SCHOLARSHIPS_DATA.filter((s) => s.country.includes("España"));
      expect(spainScholarships.length).toBeGreaterThan(0);
    });
  });

  describe("Migration Guides Dataset", () => {
    it("contains official step-by-step guides for primary destinations", () => {
      const guideKeys = Object.keys(MIGRATION_GUIDES_DATA);
      expect(guideKeys).toContain("ES");
      expect(guideKeys).toContain("DE");
      expect(guideKeys).toContain("CA");

      guideKeys.forEach((key) => {
        const guide = MIGRATION_GUIDES_DATA[key];
        expect(guide.country).toBeTruthy();
        expect(guide.flag).toBeTruthy();
        expect(guide.visas).toBeDefined();
        expect(guide.visas.length).toBeGreaterThan(0);
      });
    });
  });
});
