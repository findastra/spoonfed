import assert from 'node:assert/strict';
import test from 'node:test';
import { RESTAURANTS, cuisines, neighborhoods, prices } from '../data/restaurants';
import { DEFAULT_FILTERS, filterRestaurants, pickRestaurant } from './discovery';

test('unlocked preferences include every restaurant without mutating the input', () => {
  const source = Object.freeze([...RESTAURANTS]);
  const results = filterRestaurants(source, DEFAULT_FILTERS);
  assert.deepEqual(results, RESTAURANTS);
  assert.notEqual(results, source);
});

test('all reel locks and dietary/open preferences are applied together', () => {
  const results = filterRestaurants(RESTAURANTS, {
    neighborhood: 'LoHi',
    cuisine: 'Italian',
    price: 2,
    openNow: true,
    vegetarian: true,
  });
  assert.deepEqual(results.map((restaurant) => restaurant.id), ['sunday-table']);
});

test('impossible lock combinations stay empty rather than silently relaxing a lock', () => {
  const results = filterRestaurants(RESTAURANTS, {
    ...DEFAULT_FILTERS,
    neighborhood: 'RiNo',
    cuisine: 'Indian',
    price: 4,
  });
  assert.deepEqual(results, []);
  assert.equal(pickRestaurant(results), null);
});

test('open now excludes sample closed venues and vegetarian excludes untagged venues', () => {
  const openResults = filterRestaurants(RESTAURANTS, { ...DEFAULT_FILTERS, openNow: true });
  assert.ok(openResults.length > 0 && openResults.length < RESTAURANTS.length);
  assert.ok(openResults.every((restaurant) => restaurant.isOpen));
  const vegetarianResults = filterRestaurants(RESTAURANTS, { ...DEFAULT_FILTERS, vegetarian: true });
  assert.ok(vegetarianResults.length > 0 && vegetarianResults.length < RESTAURANTS.length);
  assert.ok(vegetarianResults.every((restaurant) => restaurant.tags.includes('Vegetarian-friendly')));
});

test('search matches name, cuisine, neighborhood, dishes and tags regardless of case', () => {
  assert.equal(filterRestaurants(RESTAURANTS, DEFAULT_FILTERS, '  SUNDAY table  ')[0]?.id, 'sunday-table');
  assert.ok(filterRestaurants(RESTAURANTS, DEFAULT_FILTERS, 'Japanese').every((r) => r.cuisine === 'Japanese'));
  assert.ok(filterRestaurants(RESTAURANTS, DEFAULT_FILTERS, 'LoHi').every((r) => r.neighborhood === 'LoHi'));
  assert.deepEqual(filterRestaurants(RESTAURANTS, DEFAULT_FILTERS, 'tagliatelle').map((r) => r.id), ['sunday-table']);
  assert.ok(filterRestaurants(RESTAURANTS, DEFAULT_FILTERS, 'Date night').length > 0);
  assert.deepEqual(filterRestaurants(RESTAURANTS, DEFAULT_FILTERS, 'unfindable-noodle'), []);
});

test('search and active filters narrow the same list', () => {
  const results = filterRestaurants(RESTAURANTS, { ...DEFAULT_FILTERS, cuisine: 'Italian' }, 'RiNo');
  assert.deepEqual(results.map((restaurant) => restaurant.id), ['little-ember']);
});

test('a single match is returned even when it was the previous result', () => {
  assert.equal(pickRestaurant([RESTAURANTS[0]], RESTAURANTS[0].id, () => 0.5), RESTAURANTS[0]);
});

test('the previous restaurant is excluded when an alternative exists', () => {
  const sample = RESTAURANTS.slice(0, 3);
  for (const value of [0, 0.1, 0.49, 0.5, 0.99, 1]) {
    assert.notEqual(pickRestaurant(sample, sample[0].id, () => value)?.id, sample[0].id);
  }
  assert.equal(pickRestaurant(sample, sample[0].id, () => 0), sample[1]);
  assert.equal(pickRestaurant(sample, sample[0].id, () => 0.999), sample[2]);
});

test('RNG boundaries always return a valid result', () => {
  const sample = RESTAURANTS.slice(0, 3);
  assert.equal(pickRestaurant(sample, undefined, () => 0), sample[0]);
  assert.equal(pickRestaurant(sample, undefined, () => 1), sample[2]);
  assert.equal(pickRestaurant(sample, undefined, () => -1), sample[0]);
  assert.equal(pickRestaurant(sample, undefined, () => 2), sample[2]);
  assert.equal(pickRestaurant(sample, undefined, () => Number.NaN), sample[0]);
  assert.equal(pickRestaurant(sample, undefined, () => Number.POSITIVE_INFINITY), sample[0]);
});

test('an empty match list never consumes randomness', () => {
  assert.equal(pickRestaurant([], undefined, () => { throw new Error('Must not run'); }), null);
});

test('sample data has unique IDs, supported reel values and explicit demo locations', () => {
  assert.equal(new Set(RESTAURANTS.map((r) => r.id)).size, RESTAURANTS.length);
  for (const restaurant of RESTAURANTS) {
    assert.ok((cuisines as readonly string[]).includes(restaurant.cuisine));
    assert.ok((neighborhoods as readonly string[]).includes(restaurant.neighborhood));
    assert.ok((prices as readonly number[]).includes(restaurant.price));
    assert.ok(restaurant.address.startsWith('Demo location'));
    assert.ok(restaurant.likedPercent >= 0 && restaurant.likedPercent <= 100);
    assert.ok(Number.isFinite(restaurant.latitude) && Number.isFinite(restaurant.longitude));
  }
});
