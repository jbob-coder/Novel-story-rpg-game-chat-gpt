"""XML and layered-geometry consistency of two editable Meridian Bay coastal sketches."""
import json
import unittest
import xml.etree.ElementTree as ET
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
BASE = ROOT / "docs" / "01_world"
SVG_NS = "{http://www.w3.org/2000/svg}"


class CoastalBlueprintXMLTests(unittest.TestCase):
    def test_both_schematics_are_parseable_xml_and_contain_authored_layers(self):
        for num in ("01", "02"):
            with self.subTest(fragment=num):
                stem = f"MERIDIAN_BAY_HARBOR_COAST_FRAGMENT_{num}_20261117"
                geo = json.loads((BASE / f"{stem}.json").read_text(encoding="utf-8"))
                svg = ET.parse(BASE / f"{stem}.svg").getroot()
                self.assertEqual(svg.tag, SVG_NS + "svg")
                self.assertEqual(len(svg.findall(SVG_NS + "polygon")),
                                 len(geo["land_use_patches"])
                                 + len(geo["building_footprints"]) + 1)
                self.assertEqual(len(svg.findall(SVG_NS + "polyline")),
                                 len(geo["street_alignments"]) + 1)
                self.assertEqual(geo["status"],
                                 "editable_fragment_draft_not_admitted_to_saved_world")
                self.assertNotIn("LOC-ELENA-SCHOOL-UNMAPPED",
                                 (BASE / f"{stem}.svg").read_text(encoding="utf-8"))

    def test_coastal_stitch_and_known_home_story_are_not_modified(self):
        a = json.loads((BASE / "MERIDIAN_BAY_HARBOR_COAST_FRAGMENT_01_20261117.json").read_text(encoding="utf-8"))
        b = json.loads((BASE / "MERIDIAN_BAY_HARBOR_COAST_FRAGMENT_02_20261117.json").read_text(encoding="utf-8"))
        self.assertEqual(a["proposed_coast"]["shoreline"][-1],
                         b["proposed_coast"]["shoreline"][0])
        self.assertEqual(b["assembly_seams"][0]["xy"], {"x": 75.1, "y": 42})
        self.assertFalse(any(x["registered_as_new_story_link"]
                             for x in b["street_alignments"]))
        self.assertEqual(
            [x["id"] for x in a["street_alignments"] if x["source"] == "preexisting_connection"],
            ["HC-A-MARKET", "HC-A-PLAZA"])

if __name__ == "__main__":
    unittest.main()
