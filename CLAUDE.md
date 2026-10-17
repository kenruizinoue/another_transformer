# another_transformer

Mobile app that turns audio into text. The user records (recording keeps
running while the iPhone is locked), saves and lists recordings, plays them
back, transcribes with one of three engines (Apple Speech, Whisper on device,
OpenAI cloud) in English, Spanish or Japanese, then copies the text or exports
it to PDF. iOS-first, built with Expo and TypeScript.

## How to work in this repo

The engineering rules this app follows are copied into `standards/`. Read them
from the source files each time; this file never summarizes or copies their
content, so nothing gets lost.

- Always mandatory: `standards/base-sdlc.md`.
- Stack rules: read `standards/react-native.md` before working on any app phase.
- Read the exact versioned Expo docs at https://docs.expo.dev/versions/v57.0.0/
  before writing code (see `AGENTS.md`).
- Plan and ticket status: `docs/PROJECT_PLAN.md`. Work is delivered as numbered
  tickets, each ending with the verification commands in `README.md` and an
  update to the plan's status table.

## Where things live

- App code and layer boundaries follow `standards/react-native.md`
  (`app/` screens, `components/`, `hooks/`, `lib/domain`, `lib/adapters`,
  `lib/utils`, `lib/transcription` for the engines).
- Benchmark protocol and word error rate tool: `bench/`.
