#!/usr/bin/env python3
"""Validate a ChatGPT-run RPG checkpoint without third-party dependencies.

Usage: python tools/validate_state.py [--root PATH]
This checks structural continuity, NOT the creative truth of narrative prose.
"""
import argparse
import json
import re
from pathlib import Path

SKILLS = {"strength", "agility", "endurance", "intellect", "perception", "willpower", "presence"}
EVENT_ID = re.compile(r"^EV-(\d{6})$")


def validate(root: Path) -> list[str]:
    problems = []

    def expect(condition, message):
        if not condition:
            problems.append(message)

    def read_json(relative):
        path = root / relative
        try:
            return json.loads(path.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError) as exc:
            problems.append(f"{relative}: cannot read JSON: {exc}")
            return None

    for required in (
        "AGENTS.md", "docs/CANON.md", "docs/DECISIONS.md",
        "docs/NARRATOR_RULES.md", "docs/CHAPTER_PROTOCOL.md",
        "docs/PROGRESSION.md", "docs/STATE_SCHEMA.md",
        "docs/RECOVERY.md", "docs/NPC_RULES.md",
        "docs/IMPLEMENTATION_PLAN.md", "docs/HANDOFF.md",
    ):
        expect((root / required).is_file(), f"{required}: missing")

    state = read_json("game/STATE.json")
    manifest = read_json("game/SAVE_MANIFEST.json")
    if not isinstance(state, dict) or not isinstance(manifest, dict):
        return problems

    expect(state.get("schema_version") == 2, "STATE: expected schema_version 2")
    expect(manifest.get("manifest_version") == 1, "manifest version must be 1")
    expect(manifest.get("state_schema_version") == state.get("schema_version"), "manifest/state schema mismatch")
    expect(manifest.get("game_id") == state.get("game_id"), "game IDs differ")

    chapter = state.get("chapter", {})
    chapter_id = chapter.get("id") if isinstance(chapter, dict) else None
    expect(isinstance(chapter_id, str) and re.fullmatch(r"CH-\d{3}", chapter_id) is not None,
           "invalid chapter ID")
    expect(manifest.get("chapter_id") == chapter_id, "manifest chapter ID mismatch")
    if chapter_id:
        expect((root / "chapters" / f"{chapter_id}.md").is_file(), "current chapter prose missing")

    hist = state.get("history", {})
    save = state.get("save", {})
    expect(isinstance(hist, dict) and isinstance(save, dict), "history/save must be objects")
    if not isinstance(hist, dict) or not isinstance(save, dict):
        return problems

    expect(type(hist.get("last_event_sequence")) is int and hist["last_event_sequence"] >= 0,
           "history sequence must be nonnegative integer")
    expect(type(save.get("last_verified_turn")) is int and save["last_verified_turn"] >= 0,
           "saved turn must be nonnegative integer")
    expect(hist.get("last_event_sequence") == manifest.get("last_event_sequence"), "event sequence differs from manifest")
    expect(save.get("last_verified_turn") == manifest.get("last_completed_turn"), "turn differs from manifest")
    expect(chapter.get("last_resolved_event_id") == manifest.get("last_event_id"), "chapter last event differs from manifest")

    time = state.get("time", {})
    day = time.get("day") if isinstance(time, dict) else None
    expect(type(day) is int and day >= -30, "in-world day must be an integer >= -30")
    world = state.get("world", {})
    player = state.get("player", {})
    expect(isinstance(world, dict) and isinstance(player, dict), "player/world must be objects")
    if not isinstance(world, dict) or not isinstance(player, dict):
        return problems

    progress = player.get("progression")
    expect(isinstance(progress, dict), "player progression object missing")
    if isinstance(progress, dict):
        attr = progress.get("attributes")
        expect(attr is None or (
            isinstance(attr, dict) and set(attr) == SKILLS and
            all(type(v) is int and 1 <= v <= 5 for v in attr.values())
        ), "attributes must be null or seven complete 1-5 integer attributes")
        skill_entries = progress.get("skills")
        expect(isinstance(skill_entries, dict), "skills must be an object")
        if isinstance(skill_entries, dict):
            total = 0
            for key, record in skill_entries.items():
                expect(isinstance(key, str) and bool(key), "skill ID must be nonempty")
                expect(isinstance(record, dict), f"skill {key}: expected object")
                if not isinstance(record, dict):
                    continue
                xp = record.get("xp")
                expect(type(xp) is int and xp >= 0, f"skill {key}: XP must be >=0 integer")
                if type(xp) is int and xp >= 0:
                    total += xp
                event = record.get("last_progress_event_id")
                expect(event is None or (isinstance(event, str) and EVENT_ID.fullmatch(event) is not None),
                       f"skill {key}: invalid last_progress_event_id")
            expect(progress.get("lifetime_skill_xp") == total, "total player skill XP does not match skill entries")
        expect(isinstance(progress.get("powers"), list), "powers must be a list")
        expect(isinstance(progress.get("milestones"), list), "milestones must be a list")
        if player.get("initialized") is False:
            expect(attr is None and not skill_entries and not progress.get("powers") and progress.get("lifetime_skill_xp") == 0,
                   "uninitialized player must have no assigned stats or powers")
    if type(day) is int and day < 0:
        for flag in ("shockwave_arrived", "humans_with_powers_observed",
                     "animals_affected", "plants_affected", "environment_affected"):
            expect(world.get(flag) is False, f"{flag}: not permitted before Day 0")
        if isinstance(progress, dict):
            expect(not progress.get("powers"), "player cannot have powers before Day 0")
        for actor_id, actor in world.get("actors", {}).items():
            if isinstance(actor, dict):
                actor_progress = actor.get("progression", {})
                if isinstance(actor_progress, dict):
                    expect(not actor_progress.get("powers"), f"actor {actor_id} has pre-Day-0 powers")

    logs = sorted((root / "chapters").glob("CH-*.events.json"))
    expect(bool(logs), "no chapter event logs found")
    ids = []
    turns = []
    days = []
    for path in logs:
        record = read_json(str(path.relative_to(root)))
        if not isinstance(record, dict):
            continue
        cid = path.name.replace(".events.json", "")
        expect(record.get("chapter_id") == cid, f"{path.name}: chapter ID mismatch")
        expect((path.parent / (cid + ".md")).is_file(), f"{path.name}: missing prose")
        events = record.get("events")
        expect(isinstance(events, list), f"{path.name}: events must be list")
        if not isinstance(events, list):
            continue
        for e in events:
            if not isinstance(e, dict):
                problems.append(f"{path.name}: non-object event")
                continue
            eid = e.get("id")
            match = EVENT_ID.fullmatch(eid) if isinstance(eid, str) else None
            expect(match is not None, f"{path.name}: invalid event ID {eid!r}")
            if match:
                ids.append((int(match.group(1)), eid))
            expect(e.get("chapter_id") == cid, f"{eid}: chapter mismatch")
            turn = e.get("turn")
            eday = e.get("day")
            expect(type(turn) is int and turn >= 1, f"{eid}: invalid turn")
            expect(type(eday) is int and eday >= -30, f"{eid}: invalid day")
            if type(turn) is int:
                turns.append(turn)
            if type(eday) is int:
                days.append(eday)
            expect(isinstance(e.get("actor_ids"), list), f"{eid}: actor_ids must be list")
            expect(isinstance(e.get("outcome"), str), f"{eid}: outcome required")
            expect(isinstance(e.get("state_changes"), list), f"{eid}: state_changes must be list")
            expect(isinstance(e.get("progression_awards"), list), f"{eid}: progression_awards must be list")

    expect([seq for seq, _ in ids] == list(range(1, len(ids) + 1)),
           "event IDs must form unique, gap-free, increasing sequence")
    last_id = ids[-1][1] if ids else None
    expect(hist.get("last_event_sequence") == len(ids), "event count differs from state")
    expect(manifest.get("last_event_id") == last_id, "manifest last event ID differs from event history")
    expect(not turns or max(turns) <= save.get("last_verified_turn", -1), "event turn is later than checkpoint")
    expect(not days or (type(day) is int and max(days) <= day), "event day after checkpoint")
    expect(not days or days == sorted(days), "events reverse in-world chronology")
    if isinstance(progress, dict) and isinstance(progress.get("skills"), dict):
        for key, record in progress["skills"].items():
            if isinstance(record, dict) and record.get("last_progress_event_id") is not None:
                expect(record["last_progress_event_id"] in {eid for _, eid in ids},
                       f"skill {key}: progression event not in history")
    return problems


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", type=Path, default=Path(__file__).resolve().parents[1])
    args = parser.parse_args()
    problems = validate(args.root)
    if problems:
        print(f"FAIL: {len(problems)} checkpoint consistency issue(s)")
        for msg in problems:
            print(f"- {msg}")
        return 1
    print("PASS: checkpoint, chapter/event history, chronology and progression are structurally consistent")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
