# Spoonfed — Sugarcube

Prepared October 11, 2026 by OpenAI Codex (GPT-6).

Spoonfed is the app. Sugarcube is its pet. Together they are a Findastra pet app, with a future place in the Cage and a square pet well inside Spoonfed. This is separate from ChatGPT Work Pets.

## Character brief

A friendly little sugar-cube creature with tiny arms and feet, holding a miniature spoon. Frosted sherbet-pink body, vivid raspberry crystal edges, and an electric chartreuse spoon: a distinct palette within the Cage family. Use the existing shared STYLE in the Cage’s `scripts/generate-pets.mjs` unchanged. Generate all nine expressions in one 3×3 sheet, then convert to transparent 256×256 frames. All shared mood symbols are composited afterward, never generated.

The proposed art ID is `spoonfed-sugarcube`; asset date is `20261011`. Artwork remains a draft until Astra approves it.

## App behavior to wire once artwork exists

| Mood | Meaning in Spoonfed |
|---|---|
| sleep | No discovery run yet. |
| idle | Resting after a result. |
| blink | Brief idle blink only. |
| curious | Finding a matching restaurant. |
| happy | A matching result is ready. |
| worried | A choice combination has no results; offer wider filters. |
| alarmed | Multiple data validation problems make results unreliable. |
| sick | An essential permission or provider credential needs Astra; explicitly say what is needed. |
| sad | Spoonfed’s own operation failed. |

Do not label a functioning optional-shake fallback as blocked. Do not claim live restaurant quality from fictional demo data. Bubbles should describe actual app state. A desktop pet and quick chat are separate future features, not part of the current working app.

## Current state and next action

- Local pet metadata and a preparation sprite manifest exist. The manifest deliberately has no frames.
- The Farmer’s registry pipeline records the new pet as hatching and unpublished; it is not yet a drawn Cage resident.
- A single new-pet recipe is staged in `sugarcube-art-recipe-20261011.json` beside this brief. It has not been added to the active generator or executed; active recipes must correspond to registered residents.
- Before generation, approve the one paid sheet as required by the Cage’s PET-FILES.md. Then set up the registered entry with its dated art paths, generate only Sugarcube, convert, inspect the sheet and all nine frames, and rebuild/check the Cage.
- Copy the verified frames into Spoonfed’s `pet-art/`, fill its sprite manifest, and implement its pet well and actual mood transitions. Verify browser and native behavior independently.
- No GitHub repo, GitHub topic, public deployment, or app-store release has been created by this preparation.

## Naming exceptions surfaced before creation

The Cage requires the reserved exact filenames `pet.json`, `AGENTS.md`, `CLAUDE.md`, and `LICENSE`. New descriptive files use lowercase dated names. Existing application/source filenames were not renamed merely because they were edited.
