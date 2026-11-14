#!/usr/bin/env python3
"""Validate a ChatGPT-run interactive-novel checkpoint without third-party dependencies.

Usage: python tools/validate_state.py [--root PATH]
Legacy RPG data is archived, not active gameplay. This checks structural continuity only.
"""
import argparse
import hashlib
import json
import re
from pathlib import Path

SKILLS = {"strength", "agility", "endurance", "intellect", "perception", "willpower", "presence"}
EVENT_ID = re.compile(r"^EV-(\d{6})$")


LEGACY_RPG_LAST_TURN = 6  # D-036 was adopted after turn 6.


def validate(root: Path) -> list[str]:
    problems = []

    def expect(condition, message):
        if not condition:
            problems.append(message)

    def read_json(relative):
        path = root / relative
        try:
            return json.loads(path.read_text(encoding="utf-8"))
        except (OSError, UnicodeError, json.JSONDecodeError) as exc:
            problems.append(f"{relative}: cannot read JSON: {exc}")
            return None

    for required in (
        "AGENTS.md", "docs/CANON.md", "docs/DECISIONS.md",
        "docs/NARRATIVE_CONTRACT.md", "docs/NARRATOR_RULES.md", "docs/CHAPTER_PROTOCOL.md",
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
    if not isinstance(chapter, dict):
        problems.append("chapter must be an object")
        return problems
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
    saved_turn = save.get("last_verified_turn")
    if type(saved_turn) is not int or saved_turn < 0:
        return problems
    turn_keys = hist.get("completed_turn_keys")
    expect(isinstance(turn_keys, list) and all(isinstance(key, str) and key for key in turn_keys)
           and len(turn_keys) == len(set(turn_keys)) == saved_turn,
           "completed turn keys must be unique and match the global turn count")
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

    # Chapter files remain local to their chapter; IDs and counters are global.
    closed = hist.get("completed_chapters", [])
    expect(isinstance(closed, list), "completed_chapters must be a list")
    if not isinstance(closed, list):
        closed = []
    descriptors = {}
    chapter_ids = []
    for index, descriptor in enumerate(closed):
        expect(isinstance(descriptor, dict), "closed chapter descriptor must be an object")
        if not isinstance(descriptor, dict):
            continue
        cid = descriptor.get("id")
        expect(cid == f"CH-{index:03d}", "closed chapter IDs must be ordered and contiguous")
        if not isinstance(cid, str) or re.fullmatch(r"CH-\d{3}", cid) is None:
            continue
        expect(cid not in descriptors, "duplicate closed chapter descriptor")
        descriptors[cid] = descriptor
        chapter_ids.append(cid)
        expect(isinstance(descriptor.get("closed_from_commit"), str) and
               re.fullmatch(r"[0-9a-f]{40}", descriptor["closed_from_commit"]) is not None,
               f"{cid}: invalid closing commit")
        expect(isinstance(descriptor.get("closure_reason"), str) and
               bool(descriptor["closure_reason"].strip()), f"{cid}: missing closure reason")
    expect(chapter_id == f"CH-{len(closed):03d}", "active chapter must follow closed chapters")
    if isinstance(chapter_id, str) and re.fullmatch(r"CH-\d{3}", chapter_id):
        expect(chapter_id not in descriptors, "active chapter is also closed")
        chapter_ids.append(chapter_id)
    else:
        return problems
    declared_chapters = set(chapter_ids)
    for path in (root / "chapters").glob("CH-*"):
        match = re.fullmatch(r"(CH-\d{3})(?:\.md|\.events\.json|\.transcript\.json)", path.name)
        if match:
            expect(match.group(1) in declared_chapters,
                   f"{path.name}: undeclared chapter file")

    ids, turns, days = [], [], []
    entries_all, event_records = [], []
    by_turn, scene_keys = {}, set()
    last_closed_turn = 0
    last_transcript_turn = 0
    for cid in chapter_ids:
        before_events, before_transcript = len(ids), len(entries_all)
        paths = [f"chapters/{cid}.md", f"chapters/{cid}.events.json",
                 f"chapters/{cid}.transcript.json"]
        expect((root / paths[0]).is_file(), f"{cid}: missing prose")
        descriptor = descriptors.get(cid)
        if descriptor:
            hashes = descriptor.get("file_hashes")
            expect(isinstance(hashes, dict) and set(hashes) == set(paths),
                   f"{cid}: closed chapter hashes must cover exactly three files")
            if isinstance(hashes, dict):
                for path in paths:
                    digest = hashes.get(path)
                    expect(isinstance(digest, str) and re.fullmatch(r"[0-9a-f]{64}", digest) is not None,
                           f"{cid}: invalid archive hash for {path}")
                    try:
                        actual = hashlib.sha256((root / path).read_bytes()).hexdigest()
                        expect(actual == digest, f"{path}: closed chapter hash mismatch")
                    except OSError:
                        problems.append(f"{path}: closed chapter file missing")

        record = read_json(paths[1])
        events = record.get("events") if isinstance(record, dict) else None
        expect(isinstance(record, dict) and record.get("chapter_id") == cid,
               f"{cid}.events.json: chapter ID mismatch")
        expect(isinstance(events, list), f"{cid}.events.json: events must be list")
        chapter_turns = []
        chapter_events = set()
        for event in events if isinstance(events, list) else []:
            if not isinstance(event, dict):
                problems.append(f"{cid}: non-object event")
                continue
            event_records.append(event)
            eid = event.get("id")
            match = EVENT_ID.fullmatch(eid) if isinstance(eid, str) else None
            expect(match is not None, f"{cid}: invalid event ID {eid!r}")
            if match:
                ids.append((int(match.group(1)), eid))
                chapter_events.add(eid)
            expect(event.get("chapter_id") == cid, f"{eid}: chapter mismatch")
            turn, event_day = event.get("turn"), event.get("day")
            expect(type(turn) is int and turn >= 1, f"{eid}: invalid turn")
            expect(type(event_day) is int and event_day >= -30, f"{eid}: invalid day")
            if type(turn) is int:
                turns.append(turn)
                chapter_turns.append(turn)
                expect(turn > last_closed_turn, f"{eid}: turn belongs to a closed chapter")
            if type(event_day) is int:
                days.append(event_day)
            expect(isinstance(event.get("actor_ids"), list), f"{eid}: actor_ids must be list")
            expect(isinstance(event.get("outcome"), str), f"{eid}: outcome required")
            expect(isinstance(event.get("state_changes"), list), f"{eid}: state_changes must be list")
            expect(isinstance(event.get("progression_awards"), list), f"{eid}: progression_awards must be list")
            if type(turn) is int and turn > LEGACY_RPG_LAST_TURN:
                expect(event.get("progression_awards") == [],
                       f"{eid}: RPG XP awards forbidden after novel conversion (D-036)")
        archive = read_json(paths[2])
        entries = archive.get("entries") if isinstance(archive, dict) else None
        expect(isinstance(archive, dict) and archive.get("schema_version") == 1,
               f"{cid} transcript: expected schema version 1")
        expect(isinstance(archive, dict) and archive.get("chapter_id") == cid,
               f"{cid} transcript: wrong chapter")
        expect(isinstance(entries, list), f"{cid} transcript: entries must be list")
        for entry in entries if isinstance(entries, list) else []:
            entries_all.append(entry)
            if not isinstance(entry, dict):
                problems.append(f"{cid} transcript: non-object entry")
                continue
            eid = entry.get("id")
            expect(eid == f"TXT-{len(entries_all):06d}",
                   f"transcript: invalid or duplicate ID {eid!r}")
            expect(entry.get("chapter_id") == cid, f"transcript {eid}: wrong chapter")
            turn, role, kind = entry.get("turn"), entry.get("role"), entry.get("kind")
            expect(type(turn) is int and 0 <= turn <= save.get("last_verified_turn", -1),
                   f"transcript {eid}: invalid turn")
            expect((role == "player" and kind == "player_action") or
                   (role == "assistant" and kind in {"scene", "resolution"}),
                   f"transcript {eid}: invalid role/kind")
            txt, links = entry.get("text"), entry.get("event_ids")
            expect(isinstance(txt, str) and bool(txt.strip()), f"transcript {eid}: full text missing")
            expect(isinstance(links, list) and all(isinstance(x, str) and x in chapter_events for x in links),
                   f"transcript {eid}: broken event links or different chapter")
            if kind == "scene":
                key = entry.get("source_key")
                expect(isinstance(key, str) and len(key) >= 6 and key not in scene_keys,
                       f"transcript {eid}: invalid/duplicate scene key")
                if isinstance(key, str):
                    scene_keys.add(key)
            if turn == 0:
                expect(kind == "scene", f"transcript {eid}: gameplay in turn zero")
            if type(turn) is int:
                expect(turn >= last_transcript_turn, f"transcript {eid}: turns reverse chronology")
                last_transcript_turn = turn
                if kind != "scene":
                    expect(turn > last_closed_turn, f"transcript {eid}: turn belongs to a closed chapter")
                by_turn.setdefault(turn, []).append(entry)
        if isinstance(archive, dict):
            expect(archive.get("last_entry_sequence") == len(entries_all),
                   f"{cid} transcript: archive global cursor mismatch")

        if descriptor:
            expect(bool(chapter_turns), f"{cid}: closed chapter has no completed turn")
            first_turn = chapter_turns[0] if chapter_turns else last_closed_turn + 1
            last_turn = chapter_turns[-1] if chapter_turns else last_closed_turn
            expected_bounds = {
                "first_turn": first_turn, "last_turn": last_turn,
                "first_event_sequence": before_events + 1, "last_event_sequence": len(ids),
                "first_transcript_sequence": before_transcript + 1,
                "last_transcript_sequence": len(entries_all),
            }
            for key, value in expected_bounds.items():
                expect(type(descriptor.get(key)) is int and descriptor.get(key) == value,
                       f"{cid}: closed chapter {key} mismatch")
            expect(first_turn == last_closed_turn + 1, f"{cid}: gap in closed chapter turns")
            last_closed_turn = last_turn

    expect([seq for seq, _ in ids] == list(range(1, len(ids) + 1)),
           "event IDs must form unique, gap-free, increasing sequence")
    last_id = ids[-1][1] if ids else None
    expect(hist.get("last_event_sequence") == len(ids), "event count differs from state")
    expect(manifest.get("last_event_id") == last_id, "manifest last event ID differs from event history")
    expect(not turns or max(turns) <= save.get("last_verified_turn", -1), "event turn is later than checkpoint")
    expect(not turns or turns == sorted(turns), "event turns reverse chronology")
    expect(not days or (type(day) is int and max(days) <= day), "event day after checkpoint")
    expect(not days or days == sorted(days), "events reverse in-world chronology")
    if isinstance(progress, dict) and isinstance(progress.get("skills"), dict):
        for key, record in progress["skills"].items():
            if isinstance(record, dict) and record.get("last_progress_event_id") is not None:
                expect(record["last_progress_event_id"] in {eid for _, eid in ids},
                       f"skill {key}: progression event not in history")

    expect(hist.get("last_transcript_sequence") == len(entries_all), "transcript: state entry count mismatch")
    expect(manifest.get("last_transcript_sequence") == len(entries_all), "transcript: manifest entry count mismatch")
    latest = entries_all[-1].get("id") if entries_all and isinstance(entries_all[-1], dict) else None
    expect(manifest.get("last_transcript_id") == latest, "transcript: last ID mismatch")
    for turn in range(1, saved_turn + 1):
        xs = by_turn.get(turn, [])
        player_inputs = [x for x in xs if x.get("role") == "player"]
        narrator_outputs = [x for x in xs if x.get("kind") == "resolution"]
        actions = [e for e in event_records if e.get("turn") == turn and e.get("kind") == "player_action"]
        expect(len(player_inputs) == 1 and len(narrator_outputs) >= 1,
               f"transcript: completed turn {turn} missing full exchange")
        expect(len(actions) == 1, f"turn {turn}: requires exactly one player action event")
        if player_inputs and narrator_outputs:
            expect(xs.index(player_inputs[0]) < xs.index(narrator_outputs[0]),
                   f"transcript: turn {turn} out of order")
            expect(all(x.get("chapter_id") == player_inputs[0].get("chapter_id") for x in narrator_outputs),
                   f"transcript: turn {turn} crosses chapter boundary")
        if len(actions) == 1 and len(player_inputs) == 1:
            expect(actions[0].get("id") in (player_inputs[0].get("event_ids") or []) and
                   actions[0].get("chapter_id") == player_inputs[0].get("chapter_id"),
                   f"transcript: turn {turn} player action link mismatch")

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
    print("PASS: checkpoint, chapter/event history, chronology and frozen legacy records are structurally consistent")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
