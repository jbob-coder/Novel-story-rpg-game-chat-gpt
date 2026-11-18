"""Independent, read-only audit of dated repository checkpoint and source links.

This does not create a story turn or modify canon. Historical audit metadata is
immutable, while the active SAVE_MANIFEST may legitimately move after play.
"""
import hashlib
import json
import re
import subprocess
import unittest
from pathlib import Path
from urllib.parse import unquote, urlsplit

ROOT = Path(__file__).resolve().parents[1]
SOURCE_COMMIT = "ff2fc65d3359830729a97a440a4ec9b341815ec2"
SOURCE_TREE = "d1c349959e58858e11383543ab2278ba16ad275b"
AUDIT_PREFIX = "docs/00_start/"
SNAPSHOT_PATH = AUDIT_PREFIX + "REPOSITORY_FILE_SNAPSHOT_2026-11-17.json"
AREA_PATH = AUDIT_PREFIX + "AREA_STATUS_AND_TASKS_2026-11-17.md"
REPORT_PATH = AUDIT_PREFIX + "REPOSITORY_CHECKPOINT_2026-11-17.md"
BRANCH_PATH = AUDIT_PREFIX + "BRANCH_AND_MAP_WORKSTACK_2026-11-17.md"
LINK_RE = re.compile(r"!?\[[^\]\n]*\]\(([^)\n]+)\)")


def read_json(path):
    return json.loads((ROOT / path).read_text(encoding="utf-8"))


def git_files():
    try:
        raw = subprocess.check_output(
            ["git", "ls-files", "--cached", "-z"], cwd=ROOT, stderr=subprocess.DEVNULL
        )
        return sorted(filter(None, raw.decode("utf-8").split("\0")))
    except (OSError, subprocess.CalledProcessError):
        return sorted(
            str(p.relative_to(ROOT).as_posix())
            for p in ROOT.rglob("*")
            if p.is_file() and ".git" not in p.relative_to(ROOT).parts
            and "__pycache__" not in p.parts and ".pytest_cache" not in p.parts
        )


def git_blob_digest(data):
    return hashlib.sha1(f"blob {len(data)}\0".encode("ascii") + data).hexdigest()


def prose_without_fenced_code(data):
    lines, inside, marker = [], False, ""
    for line in data.splitlines():
        fence = re.match(r"^\s*(\x60{3,}|~{3,})", line)
        if fence:
            lead = fence.group(1)
            if not inside:
                inside, marker = True, lead[0]
            elif lead[0] == marker:
                inside, marker = False, ""
            continue
        if not inside:
            lines.append(line)
    return re.sub(r"\x60[^\x60\n]+\x60", "", "\n".join(lines))


class RepositoryCheckpointAudit(unittest.TestCase):
    def test_inventory_exhaustive_and_unique(self):
        inventory = read_json("docs/FILE_INVENTORY.json")
        paths = [
            *inventory["entrypoints"],
            *inventory["indexes"],
            *(p for category in inventory["canonical"].values() for p in category),
            *(p for category in inventory.get("supplemental", {}).values() for p in category),
            *inventory.get("repository_checkpoints", []),
        ]
        self.assertEqual(set(paths), set(git_files()), "Unlisted or nonexistent Git-tracked path")
        self.assertTrue(
            all(len(path) > 0 and ".." not in Path(path).parts for path in paths),
            "Unsafe or empty inventory paths",
        )
        self.assertEqual(
            len(inventory["repository_checkpoints"]), 4, "The checkpoint has four files"
        )
        self.assertEqual(inventory["repository_scan"]["source_commit"], SOURCE_COMMIT)
        self.assertEqual(inventory["repository_scan"]["source_file_count"], 129)

    def test_snapshot_matches_immutable_metadata(self):
        snap = read_json(SNAPSHOT_PATH)
        self.assertEqual(snap["immutable_source_commit"], SOURCE_COMMIT)
        self.assertEqual(snap["immutable_source_tree"], SOURCE_TREE)
        self.assertEqual(snap["file_count"], 129)
        rows = snap["git_blobs"]
        self.assertEqual(len(rows), 129)
        names = [row["path"] for row in rows]
        self.assertEqual(len(set(names)), 129)
        totals = {}
        for row in rows:
            self.assertRegex(row["blob_sha"], r"^[0-9a-f]{40}$")
            self.assertGreaterEqual(row["size_bytes"], 0)
            self.assertTrue(row["path"])
            totals[row["area"]] = totals.get(row["area"], 0) + 1
        self.assertEqual(totals, snap["counts_by_area"])
        self.assertEqual(sum(totals.values()), snap["file_count"])
        self.assertNotIn(SNAPSHOT_PATH, names, "Avoid self-referential checksums")

    def test_all_json_files_parse(self):
        for path in git_files():
            if path.endswith(".json"):
                with self.subTest(path=path):
                    read_json(path)

    def test_all_repository_markdown_links_exist(self):
        broken = []
        files = set(git_files())
        for path in sorted(p for p in files if p.endswith(".md")):
            text = prose_without_fenced_code((ROOT / path).read_text(encoding="utf-8"))
            for value in LINK_RE.findall(text):
                target = value.strip().strip("<>")
                if not target or target.startswith("#"):
                    continue
                target = re.split(r'\s+"', target, maxsplit=1)[0]
                parsed = urlsplit(target)
                if parsed.scheme or parsed.netloc or target.startswith("//"):
                    continue
                destination = unquote(parsed.path)
                if not destination:
                    continue
                if destination.startswith("/"):
                    candidate = (ROOT / destination.lstrip("/")).resolve()
                else:
                    candidate = (ROOT / path).parent.joinpath(destination).resolve()
                if not candidate.is_relative_to(ROOT) or not candidate.exists():
                    broken.append(f"{path}: {value!r}")
        self.assertEqual(broken, [], "Broken local Markdown links")

    def test_area_register_is_complete_and_stable(self):
        areas = (ROOT / AREA_PATH).read_text(encoding="utf-8")
        ids = re.findall(r"(?m)^## (A\d{2})\s+[—-]", areas)
        self.assertEqual(ids, [f"A{i:02d}" for i in range(18)])
        for p in (REPORT_PATH, AREA_PATH, BRANCH_PATH):
            document = (ROOT / p).read_text(encoding="utf-8")
            self.assertIn(SOURCE_COMMIT, document)
        self.assertIn("8/13", (ROOT / BRANCH_PATH).read_text(encoding="utf-8"))

    def test_opening_night_and_current_morning_are_distinct(self):
        state, manifest = read_json("game/STATE.json"), read_json("game/SAVE_MANIFEST.json")
        transcript = read_json("chapters/CH-000.transcript.json")
        events = read_json("chapters/CH-000.events.json")
        self.assertIn("Día −30, noche", transcript["entries"][0]["text"])
        self.assertEqual(events["events"][0]["day"], -30)
        self.assertEqual(manifest["chapter_id"], state["chapter"]["id"])
        self.assertEqual(manifest["last_event_id"], events["events"][-1]["id"])
        self.assertEqual(manifest["last_transcript_id"], transcript["entries"][-1]["id"])
        if manifest["chapter_id"] == "CH-000" and manifest["last_completed_turn"] == 9:
            self.assertEqual(events["events"][-1]["day"], -29)
            self.assertEqual(state["time"]["day"], -29)
            self.assertEqual(state["time"]["time_of_day"], "morning")
            self.assertIn("media mañana", state["pending"]["message"])
            self.assertEqual(state["player"]["location_id"], "LOC-WILSON-WORKSHOP")
            self.assertEqual(manifest["last_event_id"], "EV-000029")
            self.assertEqual(manifest["last_transcript_id"], "TXT-000020")
            self.assertEqual(len(state["world"]["actors"]), 7)
            self.assertEqual(len(state["world"]["factions"]), 1)
            self.assertEqual(len(state["world"]["locations"]), 9)
            self.assertFalse(state["world"]["shockwave_arrived"])
            self.assertEqual(state["history"]["completed_chapters"], [])

    def test_original_story_blobs_match_source_snapshot_when_still_turn_nine(self):
        manifest = read_json("game/SAVE_MANIFEST.json")
        if manifest["chapter_id"] != "CH-000" or manifest["last_completed_turn"] != 9:
            self.skipTest("Historical source snapshot must not freeze future player turns")
        by_name = {r["path"]: r for r in read_json(SNAPSHOT_PATH)["git_blobs"]}
        paths = [
            "game/STATE.json",
            "game/SAVE_MANIFEST.json",
            "chapters/CH-000.md",
            "chapters/CH-000.events.json",
            "chapters/CH-000.transcript.json",
        ]
        for path in paths:
            with self.subTest(path=path):
                original = (ROOT / path).read_bytes()
                self.assertEqual(git_blob_digest(original), by_name[path]["blob_sha"])
                self.assertEqual(len(original), by_name[path]["size_bytes"])


if __name__ == "__main__":
    unittest.main()
