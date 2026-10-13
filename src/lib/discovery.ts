import type { Restaurant } from '../data/restaurants';

export interface RestaurantFilters {
  neighborhood: string | null;
  cuisine: string | null;
  price: number | null;
  openNow: boolean;
  vegetarian: boolean;
}

export type DiscoveryFilters = RestaurantFilters;

export const DEFAULT_FILTERS: RestaurantFilters = {
  neighborhood: null,
  cuisine: null,
  price: null,
  openNow: false,
  vegetarian: false,
};

/** All active preferences must match. Searching never mutates the original list. */
export function filterRestaurants(
  restaurants: readonly Restaurant[],
  filters: Readonly<RestaurantFilters> = DEFAULT_FILTERS,
  query = '',
): Restaurant[] {
  const terms = query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);

  return restaurants.filter((restaurant) => {
    if (filters.neighborhood !== null && restaurant.neighborhood !== filters.neighborhood) return false;
    if (filters.cuisine !== null && restaurant.cuisine !== filters.cuisine) return false;
    if (filters.price !== null && restaurant.price !== filters.price) return false;
    if (filters.openNow && !restaurant.isOpen) return false;
    if (filters.vegetarian && !restaurant.tags.includes('Vegetarian-friendly')) return false;

    if (!terms.length) return true;
    const searchable = [
      restaurant.name,
      restaurant.cuisine,
      restaurant.neighborhood,
      restaurant.dish,
      restaurant.description,
      ...restaurant.tags,
    ].join(' ').toLocaleLowerCase();

    return terms.every((term) => searchable.includes(term));
  });
}

/**
 * Pick uniformly from matching restaurants while avoiding the last result when
 * alternatives exist. With zero matches, return null instead of breaking locks.
 * Inject an RNG for deterministic tests; clamp bad boundary values defensively.
 */
export function pickRestaurant(
  matches: readonly Restaurant[],
  previousId?: string | null,
  rng: () => number = Math.random,
): Restaurant | null {
  if (matches.length === 0) return null;
  const alternatives = matches.filter((restaurant) => restaurant.id !== previousId);
  const pool = alternatives.length ? alternatives : matches;
  const random = rng();
  const safeRandom = Number.isFinite(random) ? Math.max(0, Math.min(1, random)) : 0;
  const index = Math.min(pool.length - 1, Math.floor(safeRandom * pool.length));
  return pool[index];
}
