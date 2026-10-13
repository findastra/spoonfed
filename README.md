# Spoonfed

*A pet app by Astra.* Its pet is **Sugarcube**, currently hatching. See [Sugarcube’s preparation brief](docs/sugarcube-hatching-20261011.md).

**A little less deciding. A lot more eating.** A working first app draft inspired by Urbanspoon's neighborhood/cuisine/price spinner, built with Expo and React Native for iOS, Android, and web.

## How to run it

Use Node.js 24 LTS and pnpm. From this directory:

```sh
pnpm install --frozen-lockfile
pnpm web
```

For a production web preview:

```sh
pnpm build:web
pnpm preview
```

Open **http://127.0.0.1:4173** after the preview server starts. The local preview is available only on the computer running it. For native development, run `pnpm start` and use a compatible Expo Go or development build. Windows cannot run the iOS Simulator; use a physical iPhone or the documented native build path.

## What's in this draft

- Three animated reels: area, cuisine, price. Pick a value to lock it; unlock to restore surprise.
- A **Feed me** button that respects every lock and active filter. Empty matches are explained; immediate repeats are avoided when alternatives exist.
- Optional shake control with permission/availability checks, foreground-only listeners, and a button fallback; native haptic feedback.
- Explore with name, cuisine, dish, and neighborhood search; cuisine chips.
- Restaurant details and clearly labeled neighborhood map links.
- Saved restaurants persisted on the current device, without an account.
- Responsive layouts, accessible names, reduced-motion support, and an original Spoonfed identity.

The seed collection contains **18 fictional Denver restaurants**. Ratings, votes, opening state, hours, and distances are illustrative. Photos are generic food imagery, not venue photography. No geolocation is collected; there is no live restaurant feed, account backend, reservation system, or public-review system. Opening a map sends only the displayed demo neighborhood to Google Maps.

## Validation

```sh
pnpm typecheck
pnpm test
pnpm build:all
```

See [validation notes](docs/validation.md) for completed checks and the remaining native-device limits. A JavaScript/native bundle export is not a signed app binary, store submission, or live release. This draft has **not** been published to an app store.

## Project map

- `App.tsx`: universal app UI and device interactions.
- `src/data/restaurants.ts`: replaceable fictional dataset.
- `src/lib/discovery.ts`: filtering and selection; independent of the UI or any provider.
- `src/lib/discovery.test.ts`: selection, lock, search, empty-state, and dataset tests.
- `app.json`, `eas.json`: app configuration and initial native build profiles. Store identifiers, credentials, and an EAS project still need configuration.
- [Urbanspoon research](docs/urbanspoon-research.md): historical behavior and direct sources.
- [Platform roadmap](docs/platform-roadmap.md): live data, accounts, device testing, and app-store release work.
- [Asset notes](docs/assets.md): imagery and typefaces.

## Next iteration

Choose a real launch region and a restaurant data provider, then add a server-side adapter with usage controls, verified venue details, required attribution, and clear failure states. Preserve source ratings as their actual rating type. Add real location discovery with permission and a manual city fallback. Test physical phones before preparing TestFlight and Google Play builds.

Spoonfed is an independent project and is not affiliated with Urbanspoon or Zomato. See the parent workspace publication policy and the platform roadmap before any release.

## Limits

Sugarcube’s metadata and Cage pipeline entry are prepared; its paid nine-mood artwork awaits approval. The sprite manifest has no frames yet, and no animated pet well or desktop pet is installed. Restaurant data remains fictional. Native device validation and store distribution remain unfinished.
