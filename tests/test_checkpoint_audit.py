"""Independent, read-only audit of dated repository checkpoint and source links.

This does not create a story turn or modify canon. Historical audit metadata is
immutable, while the active SAVE_MANIFEST may legitimately move after play.
"""
import copy
import hashlib
import json
import re
import subprocess
import unittest
from unittest.mock import patch
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


def original_turn_nine_state_bytes(data):
    """Remove only the validated independent admission delta for this audit.

    The dated source remains immutable. Worldbuilding may add the reviewed
    catalog while turn nine is still current; it may not hide any other change
    to that source behind an admission marker. The caller still compares the
    reconstructed original with its pinned Git blob hash and byte count.
    """
    state = json.loads(data)
    world = state["world"]
    if "prebuilt_design_id" not in world:
        return data
    catalog = read_json("docs/01_world/MERIDIAN_BAY_PREBUILT_DESIGN.json")
    review = world.get("prebuilt_design_review", {})

    def require(ok, message):
        if not ok:
            raise AssertionError(message)

    require(world["prebuilt_design_id"] == catalog["world_design_id"],
            "Unexpected admitted catalog")
    require(set(review) == {"reviewed", "design_id", "source_commit", "reason",
                            "effective_from_turn", "operation"}
            and review["reviewed"] is True
            and review["design_id"] == catalog["world_design_id"]
            and review["operation"] == "world_admission"
            and type(review["effective_from_turn"]) is int
            and review["effective_from_turn"] == 9
            and isinstance(review["source_commit"], str)
            and re.fullmatch(r"[0-9a-f]{40}", review["source_commit"])
            and isinstance(review["reason"], str)
            and len(review["reason"].strip()) >= 16,
            "Invalid independent admission evidence")
    require(len(catalog["places"]) == 6, "Expected six reviewed establishments")
    for place in catalog["places"]:
        require(world["locations"].get(place["id"]) == place,
                "Admitted place differs from the reviewed catalog")
        links = world["locations"][place["parent_id"]]["connected_ids"]
        require(links.count(place["id"]) == 1,
                "Missing or duplicated admission district link")
        links.remove(place["id"])
        del world["locations"][place["id"]]
    del world["prebuilt_design_id"]
    del world["prebuilt_design_review"]
    return (json.dumps(state, ensure_ascii=False, indent=2) + "\n").encode("utf-8")


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
            len(inventory["repository_checkpoints"]) >= 4, True,
            "Dated checkpoints can be added without breaking the historical audit"
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
        # Future CH-001+ is legitimate: the active manifest then points to
        # that chapter, while CH-000 is an immutable archived opener.
        if manifest["chapter_id"] == "CH-000":
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
            # A separately journaled catalog admission does not consume turn
            # ten. Validate its exact delta before checking original geography.
            original_state = json.loads(original_turn_nine_state_bytes(
                (json.dumps(state, ensure_ascii=False, indent=2) + "\n").encode("utf-8")))
            self.assertEqual(len(original_state["world"]["locations"]), 9)
            self.assertFalse(state["world"]["shockwave_arrived"])
            self.assertEqual(state["history"]["completed_chapters"], [])

    def test_future_chapter_does_not_invalidate_immutable_opening_night(self):
        # A later CH-001 manifest must not be compared with the old CH-000
        # event/transcript tail. The original opening remains historical truth.
        original_read = read_json
        state = copy.deepcopy(original_read("game/STATE.json"))
        manifest = copy.deepcopy(original_read("game/SAVE_MANIFEST.json"))
        state["chapter"]["id"] = "CH-001"
        manifest["chapter_id"] = "CH-001"
        manifest["last_completed_turn"] = 10
        manifest["last_event_id"] = "EV-000030"
        manifest["last_transcript_id"] = "TXT-000022"
        overrides = {
            "game/STATE.json": state,
            "game/SAVE_MANIFEST.json": manifest,
        }
        with patch(__name__ + ".read_json",
                   side_effect=lambda path: overrides.get(path, original_read(path))):
            self.test_opening_night_and_current_morning_are_distinct()

    def test_original_story_blobs_match_source_snapshot_when_still_turn_nine(self):
        manifest = read_json("game/SAVE_MANIFEST.json")
        if (manifest["chapter_id"] != "CH-000" or manifest["last_completed_turn"] != 9
                or manifest.get("story_revision", 0) != 2):
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
                if path == "game/STATE.json":
                    original = original_turn_nine_state_bytes(original)
                self.assertEqual(git_blob_digest(original), by_name[path]["blob_sha"])
                self.assertEqual(len(original), by_name[path]["size_bytes"])

    def synthetic_admitted_state(self):
        # Work with a detached original baseline even after real admission.
        manifest = read_json("game/SAVE_MANIFEST.json")
        if (manifest["chapter_id"] != "CH-000" or manifest["last_completed_turn"] != 9
                or manifest.get("story_revision", 0) != 2):
            self.skipTest("Admission audit fixture is the historical turn-nine checkpoint")
        state = json.loads(original_turn_nine_state_bytes(
            (ROOT / "game/STATE.json").read_bytes()))
        catalog = read_json("docs/01_world/MERIDIAN_BAY_PREBUILT_DESIGN.json")
        world = state["world"]
        for place in catalog["places"]:
            world["locations"][place["id"]] = copy.deepcopy(place)
            world["locations"][place["parent_id"]]["connected_ids"].append(place["id"])
        world["prebuilt_design_id"] = catalog["world_design_id"]
        world["prebuilt_design_review"] = {
            "reviewed": True, "design_id": catalog["world_design_id"],
            "source_commit": "a" * 40, "reason": "SYNTHETIC reviewed catalog admission.",
            "effective_from_turn": 9, "operation": "world_admission",
        }
        return state

    def assert_original_state_hash(self, state):
        by_name = {r["path"]: r for r in read_json(SNAPSHOT_PATH)["git_blobs"]}
        original = original_turn_nine_state_bytes(json.dumps(state).encode("utf-8"))
        self.assertEqual(git_blob_digest(original), by_name["game/STATE.json"]["blob_sha"])
        self.assertEqual(len(original), by_name["game/STATE.json"]["size_bytes"])

    def test_independent_admission_keeps_original_checkpoint_auditable(self):
        self.assert_original_state_hash(self.synthetic_admitted_state())

    def test_admission_marker_cannot_hide_state_or_catalog_corruption(self):
        mutations = {
            "actor": lambda s: s["player"].update(location_id="LOC-CAFE-BRUMA"),
            "time": lambda s: s["time"].update(day=-28),
            "unrelated": lambda s: s["world"].update(unrelated_fact="SYNTHETIC forged fact"),
            "place": lambda s: s["world"]["locations"]["LOC-MARKET-NOAH-REPAIR"].update(
                description="SYNTHETIC changed catalog"),
            "link": lambda s: s["world"]["locations"]["LOC-COMMERCIAL-DISTRICT"][
                "connected_ids"].remove("LOC-MARKET-NOAH-REPAIR"),
            "evidence": lambda s: s["world"]["prebuilt_design_review"].update(reviewed=False),
        }
        for name, mutate in mutations.items():
            with self.subTest(name=name):
                state = self.synthetic_admitted_state()
                mutate(state)
                with self.assertRaises(AssertionError):
                    self.assert_original_state_hash(state)


if __name__ == "__main__":
    unittest.main()
