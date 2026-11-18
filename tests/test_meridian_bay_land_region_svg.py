"""Source/illustration consistency for Meridian Bay inland regional fragment 03."""
import json
from pathlib import Path
import unittest
import xml.etree.ElementTree as ET

BASE=Path(__file__).resolve().parent.parent/"docs"/"01_world"
NAME="MERIDIAN_BAY_MARKET_CROSSWATER_LAND_FRAGMENT_03_20261117"
SVG="{http://www.w3.org/2000/svg}"

class LandFragment3XMLTests(unittest.TestCase):
 def test_urban_svg_is_valid_and_has_all_physical_layers(self):
  geo=json.loads((BASE/(NAME+".json")).read_text(encoding="utf-8"))
  svg=ET.parse(BASE/(NAME+".svg")).getroot()
  self.assertEqual(svg.tag,SVG+"svg")
  self.assertEqual(len(svg.findall(SVG+"polygon")),len(geo["land_use_patches"])+len(geo["building_footprints"]))
  self.assertEqual(len(svg.findall(SVG+"polyline")),len(geo["street_alignments"]))
  self.assertEqual(len(geo["source_existing_places"]),3)
  self.assertEqual(geo["region_type"],"land_only_no_water_or_new_shoreline")
 def test_no_false_travel_authority(self):
  geo=json.loads((BASE/(NAME+".json")).read_text(encoding="utf-8"))
  self.assertTrue(all(not road["registered_as_new_story_link"] for road in geo["street_alignments"]))
  self.assertTrue(all(not road["traversable_in_saved_story"] for road in geo["street_alignments"]))
  self.assertTrue(all(road["verified_travel_minutes"] is None for road in geo["street_alignments"]))

if __name__=="__main__":
 unittest.main()
