# Living Superhuman World (working title)

An original, choice-driven, text-first simulation RPG. The world begins **30 days before** the first superhumans. A cosmic shockwave from a distant corner of the universe reaches Earth on **Day 0**. People, animals, plants, and the environment are affected; awakenings can be immediate, delayed, or never happen.

**First playable vertical slice:** Choose a daily action, observe autonomous NPC routines and societal changes, reach Day 0, and continue watching independent lives and ecological changes. This is a design/prototype baseline, **not a finished game or a locked technology choice**.

## Run locally

Use a local web server (required for browser ES modules):

```bash
python -m http.server 8000
```

Open `http://localhost:8000/`. Data is saved in the browser's localStorage (not synced between devices). Restarting the world clears that local save. No npm packages, accounts, or internet connection are needed to run the game locally.

## Test

```bash
node --test
```

Node.js 18+ is recommended; tests use its built-in test runner. Browser presentation is not covered by these automated tests.

## Project records

- [World canon](docs/CANON.md): owner-approved truths; excludes provisional game mechanics.
- [Decision ledger](docs/DECISIONS.md): accepted decisions, proposals, and open questions.
- [Simulation design](docs/SIMULATION.md): current prototype mechanics and future scaling.
- [Project status](docs/STATUS.md): implementation and verification checkpoints.

Develop on branches and use pull requests; do not treat a public repository as permission for outsiders to modify the canonical game.
