# Draft assets

- **Spoonfed spoon icon:** original geometric vector in `assets/spoonfed.svg`, rasterized to the checked-in app icon and favicon. App icon artwork is independent of Urbanspoon.
- **Type:** DM Sans and Fraunces from the corresponding `@expo-google-fonts` packages, bundled locally. The fonts are distributed under the SIL Open Font License; retain package license notices for release.
- **Food photos:** remote images served from `images.unsplash.com`, with exact image URLs in `src/data/restaurants.ts`. These are illustrative food images paired with fictional restaurants. They are not claims about real venues or actual dishes. General usage is governed by the [Unsplash license](https://unsplash.com/license). Before production, keep provider/photographer attribution records for chosen photos or replace them with owned imagery. The draft does not redistribute a bundled photo library.
- **UI icons:** Lucide, distributed under its ISC license.
- **Scaffold:** the downloaded official Expo blank TypeScript template includes an Expo MIT license notice, preserved in `docs/expo-template-license.txt`.

Remote photos require a network connection. Local sample data and fonts are bundled; this draft does not claim a fully offline image experience.
