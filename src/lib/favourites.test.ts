import { describe, it, expect } from "vitest";

import {
  bookmarkToKey,
  favouriteKey,
  favouritesOfKind,
  isFavourite,
  parseFavouriteKey,
} from "./favourites";

describe("favourite keys", () => {
  it("round-trips a kind and an id", () => {
    expect(parseFavouriteKey(favouriteKey("programme", "fp-espana-todofp"))).toEqual({
      kind: "programme",
      id: "fp-espana-todofp",
    });
  });

  it("keeps an id containing a colon intact", () => {
    // Only the first colon separates the kind, so an id is never truncated.
    expect(parseFavouriteKey("scholarship:beca:2026")).toEqual({
      kind: "scholarship",
      id: "beca:2026",
    });
  });

  it("rejects anything it did not write", () => {
    expect(parseFavouriteKey("beca-carolina-2026")).toBeNull();
    expect(parseFavouriteKey("visa:student")).toBeNull();
    expect(parseFavouriteKey("scholarship:")).toBeNull();
    expect(parseFavouriteKey(":beca")).toBeNull();
  });

  it("does not confuse the same id in two catalogues", () => {
    const favourites = [favouriteKey("scholarship", "shared-id")];
    expect(isFavourite(favourites, "scholarship", "shared-id")).toBe(true);
    expect(isFavourite(favourites, "programme", "shared-id")).toBe(false);
  });

  it("splits a mixed list by kind", () => {
    const favourites = [
      favouriteKey("scholarship", "a"),
      favouriteKey("programme", "b"),
      favouriteKey("scholarship", "c"),
    ];
    expect(favouritesOfKind(favourites, "scholarship")).toEqual(["a", "c"]);
    expect(favouritesOfKind(favourites, "programme")).toEqual(["b"]);
  });
});

describe("bookmarkToKey", () => {
  it("reads a bookmark written before #82 as a scholarship", () => {
    expect(bookmarkToKey({ scholarshipId: "beca-carolina-2026" })).toBe(
      "scholarship:beca-carolina-2026"
    );
  });

  it("reads a typed bookmark", () => {
    expect(bookmarkToKey({ itemType: "programme", itemId: "fp-espana-todofp" })).toBe(
      "programme:fp-espana-todofp"
    );
  });

  it("prefers the typed fields when both are present", () => {
    expect(bookmarkToKey({ itemType: "programme", itemId: "x", scholarshipId: "y" })).toBe(
      "programme:x"
    );
  });

  it("returns null rather than guessing at a document it cannot read", () => {
    expect(bookmarkToKey({})).toBeNull();
    expect(bookmarkToKey({ itemType: "visa", itemId: "x" })).toBeNull();
  });
});
