/** What a saved item is. Favourites hold more than scholarships since #82. */
export type FavouriteKind = "scholarship" | "programme";

/**
 * A favourite, as one string.
 *
 * Favourites used to be bare scholarship ids. With a second catalogue on the
 * same screen a bare id no longer identifies anything on its own: two
 * catalogues can carry the same id, and the list would resolve one against the
 * wrong one and show a record the reader never saved.
 */
export type FavouriteKey = `${FavouriteKind}:${string}`;

export function favouriteKey(kind: FavouriteKind, id: string): FavouriteKey {
  return `${kind}:${id}`;
}

/** `null` when the string is not a key this module wrote. */
export function parseFavouriteKey(key: string): { kind: FavouriteKind; id: string } | null {
  const separator = key.indexOf(":");
  if (separator <= 0) return null;
  const kind = key.slice(0, separator);
  const id = key.slice(separator + 1);
  if (!id) return null;
  if (kind !== "scholarship" && kind !== "programme") return null;
  return { kind, id };
}

export function isFavourite(favourites: string[], kind: FavouriteKind, id: string): boolean {
  return favourites.includes(favouriteKey(kind, id));
}

/** The saved ids of one kind, in the order they were saved. */
export function favouritesOfKind(favourites: string[], kind: FavouriteKind): string[] {
  return favourites
    .map(parseFavouriteKey)
    .filter((entry): entry is { kind: FavouriteKind; id: string } => entry?.kind === kind)
    .map((entry) => entry.id);
}

/**
 * Reads a stored bookmark into a key.
 *
 * Documents written before #82 carry a `scholarshipId` and no kind, and every
 * one of them is a scholarship — that was the only thing that could be saved.
 * They are read as such rather than migrated: there is no backup or restore
 * capability yet (#18), so a rewrite of existing rows is not a risk worth
 * taking for a field that can be inferred with certainty.
 */
export function bookmarkToKey(data: {
  itemType?: string;
  itemId?: string;
  scholarshipId?: string;
}): FavouriteKey | null {
  if (data.itemType && data.itemId) {
    const parsed = parseFavouriteKey(favouriteKey(data.itemType as FavouriteKind, data.itemId));
    return parsed ? favouriteKey(parsed.kind, parsed.id) : null;
  }
  if (data.scholarshipId) return favouriteKey("scholarship", data.scholarshipId);
  return null;
}
