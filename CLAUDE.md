# another_transformer

Mobile app to transform audio and text into each other. First and only current
feature: audio to text (record, save, play back, transcribe, export). iOS-first,
built with Expo and TypeScript.

## How to work in this repo

This project follows the Ken SDLC toolkit, which is copied into this repo under
`standards/` and `prompts/`. Read the rules from those source files each time;
this file never summarizes, compacts, or copies their content, so nothing gets
lost.

- Flow to follow: `prompts/prompts.md`, then `prompts/full.md` (Full track).
- Always mandatory: `standards/base-sdlc.md`.
- Stack rules: read `standards/react-native.md` before working on any app phase.
- Read the exact versioned Expo docs at https://docs.expo.dev/versions/v57.0.0/
  before writing code (see `AGENTS.md`).

## Where things live

- Plan and ticket status: `docs/PROJECT_PLAN.md`.
- App code and layer boundaries follow `standards/react-native.md`
  (`app/` screens, `components/`, `hooks/`, `lib/domain`, `lib/adapters`,
  `lib/utils`).
