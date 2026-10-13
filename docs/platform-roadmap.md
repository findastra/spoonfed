# Spoonfed platform roadmap

Planning date: October 8, 2026.

Spoonfed's first draft uses Expo SDK 57 and React Native with a shared iOS, Android, and web codebase. This identifies the local `package.json` dependency family (`expo: ~57.0.27`); it is not a claim that this is the latest SDK. The lockfile captures reproducible dependency versions.

The draft contains fictional Denver restaurant data and local interactions. It has no live restaurant provider or account backend. Web export and browser checks are separate evidence from a signed native build, real-device testing, store submission, or public availability.

## Intended platforms

| Destination | Path from the draft |
| --- | --- |
| Apple App Store: iPhone and iPad | Configure the app identity, signing, developer account, and native builds; test through TestFlight; complete store metadata and App Review. |
| Google Play: Android phones and tablets | Configure Android identity and signing; create an Android App Bundle; test through Play Console and satisfy applicable account/testing requirements before rollout. |
| Other Android stores | Optional later expansion using separately validated Android packages and each store's current submission requirements. |
| Desktop and mobile browsers | Export and host the web app, then verify the published URL independently. This covers browser access on Windows, macOS, and other desktop systems; dedicated desktop binaries are outside the first draft. |

Expo supports producing store builds and uploading signed iOS/Android binaries. EAS Submit can run from Windows, including iOS submissions. An iOS upload becomes a TestFlight build after processing and still needs an explicit App Store review/release step. [Expo build guide](https://docs.expo.dev/deploy/build-project/), [submission guide](https://docs.expo.dev/deploy/submit-to-app-stores/), [web deployment guide](https://docs.expo.dev/deploy/web/)

## Next: a useful live-data pilot

1. Select an authorized restaurant provider, such as Google Places or an equivalent licensed source, and a first real launch area. Add a server-side provider adapter, restricted credentials, usage limits, and error handling. Verify venue identifiers, addresses, coordinates, and links before enabling real directions.
2. Preserve the provider's attribution, photo/review credits, display rules, and caching limits. For example, Places has specific restrictions on storing content, map display, and third-party attribution; do not treat its response as an unrestricted database. [Google Places policies](https://developers.google.com/maps/documentation/places/web-service/policies)
3. Ask for location permission when the user selects nearby discovery; provide a manual city fallback and clear denial handling. Declare only permissions actually used. Location is not inferred from the fictional Denver seed data. [Expo permissions](https://docs.expo.dev/guides/permissions/)
4. Add accounts only when cross-device saves or contributions require them. If public reviews/photos are added, implement reporting, moderation, abuse prevention, and deletion flows before release.
5. Replace sample ratings with sourced ratings or authentic Spoonfed votes, clearly labeled by origin. Do not convert a third-party star score into a claimed Spoonfed approval percentage.

## Next: native validation and store preparation

- Choose final iOS bundle identifier and Android package name, confirm product naming, configure ownership and EAS project settings, and create signing credentials. The initial config does not establish a registered store identity.
- Enroll or use authorized Apple Developer Program and Google Play Console accounts. EAS requires an Expo account if chosen for cloud builds. No external account or paid service is added by this draft. [Apple enrollment](https://developer.apple.com/programs/enroll/), [Play Console setup](https://support.google.com/googleplay/android-developer/answer/6112435), [Expo build requirements](https://docs.expo.dev/deploy/build-project/)
- Validate actual iOS and Android installations: small/large phones, tablets, navigation, safe areas, persisted saves, offline/error states, accessibility, shake sensitivity, motion permissions, haptics, and external links. Passing a web build cannot validate those native behaviors. [Expo store preparation](https://docs.expo.dev/distribution/app-stores/)
- Prepare final icons, screenshots, support contact, privacy policy, store privacy/data disclosures, and release metadata based on the implemented app and SDKs. Recheck store rules before submission.
- For personal Google Play accounts created after November 13, 2023, the current published rule requires at least 12 opted-in testers continuously for 14 days before applying for production access. Confirm the account's applicable requirements in Play Console at release time. [Google's testing requirements](https://support.google.com/googleplay/android-developer/answer/14151465)

## Source and publication policy

Follow the parent workspace `AGENTS.md` publication policy before any public web, beta, or store publication:

1. Keep Spoonfed in a clearly named private GitHub repository under `findastra`, unless the user chooses another owner or authorizes public source.
2. Commit and push the exact source and locked dependencies, then create a unique release tag. Never move or reuse a published tag.
3. Put the version and exact tag/commit link in the product's About or description metadata. Private links are visible only to repository collaborators.
4. Record date, commit, tag, destination URL, and platform version in `docs/publications.md`, distinguishing **built**, **uploaded**, and **verified live**.
5. Create a GitHub Release covering changes, validation, limitations, and the publication link. Preserve rollback information and keep credentials/caches out of Git.

This roadmap does not claim that a repository has been pushed, a native binary has been signed, or Spoonfed has been published. Each status requires its own recorded evidence.
