import { LOCALSTORAGE_KEYS } from "../constants";
import type { CardItem, CardType, Snippet } from "../types/marketplace-types";
import { favouriteEntrySchema } from "./Schemas";
import { marketplaceStorage } from "./Storage";

export type FavouriteEntry = {
  // The card's storage key, see generateKey()
  key: string;
  type: CardType;
  item: CardItem | Snippet;
};

/**
 * Parse the stored favourites, dropping anything malformed
 * (e.g. hand-edited or imported backups) instead of failing the whole list.
 */
export function parseFavourites(value: string | null | undefined): FavouriteEntry[] {
  if (!value) return [];

  let parsed: unknown;
  try {
    parsed = JSON.parse(value);
  } catch {
    return [];
  }
  if (!Array.isArray(parsed)) return [];

  const entries: FavouriteEntry[] = [];
  const seen = new Set<string>();
  for (const candidate of parsed) {
    const entry = favouriteEntrySchema.safeParse(candidate);
    if (!entry.success || seen.has(entry.data.key)) continue;

    seen.add(entry.data.key);
    entries.push(entry.data as FavouriteEntry);
  }
  return entries;
}

export function getFavourites(): FavouriteEntry[] {
  return parseFavourites(marketplaceStorage.getItem(LOCALSTORAGE_KEYS.favourites));
}

export function isFavourite(key: string): boolean {
  return getFavourites().some((entry) => entry.key === key);
}

/**
 * Add or remove a favourite. The whole list is rewritten inside one storage
 * mutation so quick successive toggles on different cards can't overwrite each other.
 */
export async function setFavourite(entry: FavouriteEntry, favourite: boolean) {
  await marketplaceStorage.mutateAsync((storage) => {
    const others = parseFavourites(storage.get(LOCALSTORAGE_KEYS.favourites)).filter(({ key }) => key !== entry.key);
    storage.set(LOCALSTORAGE_KEYS.favourites, JSON.stringify(favourite ? [...others, entry] : others));
  });
}
