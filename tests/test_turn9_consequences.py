import json
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


class TurnNineCausalRegression(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.events = json.loads((ROOT / "chapters/CH-000.events.json").read_text(encoding="utf-8"))["events"]
        cls.transcript = json.loads((ROOT / "chapters/CH-000.transcript.json").read_text(encoding="utf-8"))["entries"]

    def event(self, event_id):
        return next(e for e in self.events if e["id"] == event_id)

    def test_original_player_action_and_narration_saved(self):
        msg = next(x for x in self.transcript if x["id"] == "TXT-000019")
        scene = next(x for x in self.transcript if x["id"] == "TXT-000020")
        self.assertEqual(msg["role"], "player")
        self.assertIn("arregla el reloj", msg["text"])
        self.assertIn("el primer brazo de Aster", scene["text"])
        self.assertIn("no se encendió", scene["text"])

    def test_aster_mechanically_mounted_but_not_powered(self):
        player = self.event("EV-000027")
        arm = next(change for change in player["state_changes"]
                   if change["field"] == "inventory_item" and change["item_id"] == "ITEM-ASTER")
        state = arm["after"]
        self.assertEqual(state["functional_state"], "incompleto")
        self.assertTrue(state["assembly_progress"]["first_arm"]["mounted_to_torso"])
        self.assertEqual(state["assembly_progress"]["first_arm"]["actuator_wiring"], "sin conectar")
        self.assertEqual(state["assembly_progress"]["first_arm"]["powered_motion"], "sin probar")

    def test_clock_repair_is_a_recorded_resource_change(self):
        rosa = self.event("EV-000029")
        change = next(x for x in rosa["state_changes"] if x["field"] == "resources")
        self.assertIn("no resuelto", change["before"]["current_repair"])
        self.assertIn("reparado", change["after"]["current_repair"])
        self.assertEqual(change["after"]["last_repair_event_id"], "EV-000029")

    def test_schoolbag_transferred_without_losing_usb(self):
        player = self.event("EV-000027")
        elena = self.event("EV-000028")
        transfers = [c for c in player["state_changes"]
                     if c["field"] == "inventory_item" and c["item_id"] == "ITEM-ELENA-BACKPACK-001"]
        self.assertEqual(len(transfers), 2)
        self.assertIsNone(transfers[0]["before"])
        self.assertIsNone(transfers[-1]["after"])
        self.assertTrue(any(c["field"] == "inventory_item" and
                            c["item_id"] == "ITEM-USB-SPARE-001" and c.get("automatic_carry")
                            for c in elena["state_changes"]))
        self.assertTrue(any(c["field"] == "location_id" and
                            c["after"] == "LOC-RAILGARDEN-RESIDENTIAL"
                            for c in elena["state_changes"]))


if __name__ == "__main__":
    unittest.main()
