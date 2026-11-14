"""Synthetic chapter rollover fixtures in temporary directories, never story data."""
import copy
import hashlib
import json
import shutil
import tempfile
import unittest
from pathlib import Path

from tools.validate_state import validate

ROOT = Path(__file__).resolve().parents[1]


class MultiChapterValidator(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory()
        self.root = Path(self.temporary.name)
        for directory in ("game", "chapters", "docs"):
            shutil.copytree(ROOT / directory, self.root / directory)
        shutil.copyfile(ROOT / "AGENTS.md", self.root / "AGENTS.md")
        self.state = self.read("game/STATE.json")
        self.manifest = self.read("game/SAVE_MANIFEST.json")
        self.original_state = copy.deepcopy(self.state)
        self.original_chapter = {
            path: (self.root / path).read_bytes() for path in self.paths("CH-000")
        }
        self.close_and_open()

    def tearDown(self):
        self.temporary.cleanup()

    @staticmethod
    def paths(chapter_id):
        return [f"chapters/{chapter_id}{suffix}" for suffix in
                (".md", ".events.json", ".transcript.json")]

    def read(self, path):
        return json.loads((self.root / path).read_text(encoding="utf-8"))

    def write(self, path, value):
        (self.root / path).write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n",
                                      encoding="utf-8")

    def flush_state(self):
        self.write("game/STATE.json", self.state)
        self.write("game/SAVE_MANIFEST.json", self.manifest)

    def close_and_open(self):
        old = self.manifest["chapter_id"]
        destination = f"CH-{int(old[3:]) + 1:03d}"
        events = self.read(f"chapters/{old}.events.json")["events"]
        entries = self.read(f"chapters/{old}.transcript.json")["entries"]
        descriptor = {
            "id": old,
            "first_turn": events[0]["turn"],
            "last_turn": events[-1]["turn"],
            "first_event_sequence": int(events[0]["id"][3:]),
            "last_event_sequence": int(events[-1]["id"][3:]),
            "first_transcript_sequence": int(entries[0]["id"][4:]),
            "last_transcript_sequence": int(entries[-1]["id"][4:]),
            "file_hashes": {path: hashlib.sha256((self.root / path).read_bytes()).hexdigest()
                            for path in self.paths(old)},
            "closed_from_commit": "a" * 40,
            "closure_reason": "Synthetic chapter boundary for isolated validator QA.",
        }
        self.state["history"]["completed_chapters"].append(descriptor)
        self.state["chapter"]["id"] = destination
        self.state["chapter"]["status"] = "opening"
        self.manifest["chapter_id"] = destination
        (self.root / f"chapters/{destination}.md").write_text("", encoding="utf-8")
        self.write(f"chapters/{destination}.events.json", {
            "schema_version": 1, "chapter_id": destination, "events": [],
        })
        self.write(f"chapters/{destination}.transcript.json", {
            "schema_version": 1, "chapter_id": destination,
            "last_entry_sequence": self.manifest["last_transcript_sequence"], "entries": [],
        })
        self.flush_state()

    def append_turn(self):
        cid = self.manifest["chapter_id"]
        turn = self.manifest["last_completed_turn"] + 1
        event_sequence = self.manifest["last_event_sequence"] + 1
        transcript_sequence = self.manifest["last_transcript_sequence"]
        event_id = f"EV-{event_sequence:06d}"
        events = self.read(f"chapters/{cid}.events.json")
        events["events"].append({
            "id": event_id, "chapter_id": cid, "turn": turn, "day": self.state["time"]["day"],
            "actor_ids": ["PLAYER-001"], "kind": "player_action", "intent": "SYNTHETIC QA INPUT",
            "outcome": "Synthetic stationary observation.", "known_to": ["PLAYER-001"],
            "caused_by": [], "state_changes": [], "progression_awards": [],
        })
        archive = self.read(f"chapters/{cid}.transcript.json")
        for offset, role, kind, text in (
            (1, "player", "player_action", "SYNTHETIC QA INPUT"),
            (2, "assistant", "resolution", "SYNTHETIC QA — Quiet observation.\n\nNo new decision."),
        ):
            archive["entries"].append({
                "id": f"TXT-{transcript_sequence + offset:06d}", "chapter_id": cid,
                "turn": turn, "role": role, "kind": kind, "text": text, "event_ids": [event_id],
            })
        archive["last_entry_sequence"] = transcript_sequence + 2
        self.state["chapter"]["last_resolved_event_id"] = event_id
        self.state["history"]["last_event_sequence"] = event_sequence
        self.state["history"]["last_transcript_sequence"] = transcript_sequence + 2
        self.state["history"]["completed_turn_keys"].append(f"synthetic-validator-turn-{turn}")
        self.state["save"]["last_verified_turn"] = turn
        self.manifest.update(last_completed_turn=turn, last_event_sequence=event_sequence,
                             last_event_id=event_id, last_transcript_sequence=transcript_sequence + 2,
                             last_transcript_id=f"TXT-{transcript_sequence + 2:06d}")
        self.write(f"chapters/{cid}.events.json", events)
        self.write(f"chapters/{cid}.transcript.json", archive)
        with (self.root / f"chapters/{cid}.md").open("a", encoding="utf-8") as chapter:
            chapter.write(archive["entries"][-1]["text"] + "\n")
        self.flush_state()

    def assert_invalid(self, fragment):
        issues = validate(self.root)
        self.assertTrue(any(fragment in issue for issue in issues), issues)

    def test_empty_next_chapter_preserves_global_cursors_and_original_bytes(self):
        self.assertEqual(validate(self.root), [])
        self.assertEqual(self.manifest["last_completed_turn"], 9)
        self.assertEqual(self.manifest["last_event_id"], "EV-000029")
        self.assertEqual(self.manifest["last_transcript_id"], "TXT-000020")
        for path, content in self.original_chapter.items():
            self.assertEqual((self.root / path).read_bytes(), content)
        for field in ("time", "player", "world", "narrative_threads"):
            self.assertEqual(self.state[field], self.original_state[field])

    def test_next_turn_uses_global_ids_and_reloads_literal_messages(self):
        self.append_turn()
        self.assertEqual(validate(self.root), [])
        archive = self.read("chapters/CH-001.transcript.json")
        self.assertEqual([entry["id"] for entry in archive["entries"]], ["TXT-000021", "TXT-000022"])
        self.assertEqual(archive["entries"][-1]["text"], "SYNTHETIC QA — Quiet observation.\n\nNo new decision.")
        self.assertEqual(self.read("chapters/CH-001.events.json")["events"][0]["id"], "EV-000030")

    def test_two_closed_chapters_remain_valid_with_an_empty_third(self):
        self.append_turn()
        self.close_and_open()
        self.assertEqual(validate(self.root), [])
        self.assertEqual(self.manifest["chapter_id"], "CH-002")
        self.append_turn()
        self.assertEqual(validate(self.root), [])
        self.assertEqual(self.manifest["last_event_id"], "EV-000031")
        self.assertEqual(self.manifest["last_transcript_id"], "TXT-000024")

    def test_missing_closed_file_blocks_recovery(self):
        for path, original in self.original_chapter.items():
            with self.subTest(path=path):
                (self.root / path).unlink()
                self.assert_invalid("closed chapter file missing")
                (self.root / path).write_bytes(original)

    def test_changed_closed_bytes_rejected_even_when_json_is_unchanged(self):
        for path, original in self.original_chapter.items():
            with self.subTest(path=path):
                (self.root / path).write_bytes(original + b"\n")
                self.assert_invalid("closed chapter hash mismatch")
                (self.root / path).write_bytes(original)

    def test_invalid_utf8_is_reported_without_crashing_validator(self):
        (self.root / "chapters/CH-000.events.json").write_bytes(b"\xff")
        self.assert_invalid("cannot read JSON")

    def test_global_event_and_transcript_sequences_cannot_restart(self):
        self.append_turn()
        for path, collection, bad_id, error in (
            ("chapters/CH-001.events.json", "events", "EV-000001", "gap-free"),
            ("chapters/CH-001.transcript.json", "entries", "TXT-000001", "invalid or duplicate ID"),
        ):
            with self.subTest(path=path):
                original = self.read(path)
                changed = copy.deepcopy(original)
                changed[collection][0]["id"] = bad_id
                self.write(path, changed)
                self.assert_invalid(error)
                self.write(path, original)

    def test_transcript_cannot_link_an_action_from_another_chapter(self):
        self.append_turn()
        archive = self.read("chapters/CH-001.transcript.json")
        archive["entries"][0]["event_ids"] = ["EV-000001"]
        self.write("chapters/CH-001.transcript.json", archive)
        self.assert_invalid("broken event links or different chapter")

    def test_latest_turn_requires_both_original_input_and_resolution(self):
        self.append_turn()
        archive = self.read("chapters/CH-001.transcript.json")
        archive["entries"].pop()
        self.write("chapters/CH-001.transcript.json", archive)
        self.assert_invalid("missing full exchange")

    def test_complete_exchanges_cannot_be_reordered_across_turns(self):
        self.append_turn()
        self.append_turn()
        archive = self.read("chapters/CH-001.transcript.json")
        archive["entries"] = archive["entries"][2:] + archive["entries"][:2]
        for index, entry in enumerate(archive["entries"], start=21):
            entry["id"] = f"TXT-{index:06d}"
        self.write("chapters/CH-001.transcript.json", archive)
        self.assert_invalid("turns reverse chronology")

    def test_closed_descriptor_bounds_and_hash_coverage_are_checked(self):
        original = copy.deepcopy(self.state["history"]["completed_chapters"][0])
        for key, value, fragment in (
            ("last_event_sequence", 99, "last_event_sequence mismatch"),
            ("first_turn", 0, "first_turn mismatch"),
            ("file_hashes", {}, "cover exactly three files"),
        ):
            with self.subTest(key=key):
                self.state["history"]["completed_chapters"][0] = dict(original, **{key: value})
                self.flush_state()
                self.assert_invalid(fragment)

    def test_duplicate_or_undeclared_chapters_are_rejected(self):
        self.state["history"]["completed_chapters"].append(copy.deepcopy(
            self.state["history"]["completed_chapters"][0]))
        self.flush_state()
        self.assert_invalid("duplicate closed chapter")
        self.state["history"]["completed_chapters"].pop()
        self.flush_state()
        (self.root / "chapters/CH-002.md").write_text("UNDECLARED SYNTHETIC CHAPTER", encoding="utf-8")
        self.assert_invalid("undeclared chapter file")

    def test_turn_keys_must_match_the_global_turn_count(self):
        self.state["history"]["completed_turn_keys"].pop()
        self.flush_state()
        self.assert_invalid("completed turn keys")


if __name__ == "__main__":
    unittest.main()
