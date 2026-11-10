import unittest
import json
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
class InitialCheckpoint(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.state = json.loads((ROOT/'game/STATE.json').read_text(encoding='utf-8'))
        cls.manifest = json.loads((ROOT/'game/SAVE_MANIFEST.json').read_text(encoding='utf-8'))
        cls.events = json.loads((ROOT/'chapters/CH-000.events.json').read_text(encoding='utf-8'))
    def test_character_persisted(self):
        p=self.state['player']
        self.assertTrue(p['initialized'])
        self.assertEqual((p['name'],p['age'],p['role']),('Jack Wilson',21,'gray-hat hacker'))
        self.assertEqual(p['location_id'],'LOC-CROSSWATER-PLAZA')
    def test_no_outcome_invented(self):
        self.assertEqual(self.state['player']['opening_intent']['status'],'declared_unresolved')
        self.assertFalse(self.state['player']['opening_intent']['device_placed'])
        self.assertFalse(self.state['player']['opening_intent']['information_acquired'])
        self.assertEqual(self.events['events'],[])
        self.assertEqual(self.manifest['last_completed_turn'],0)
        self.assertEqual(self.manifest['last_event_sequence'],0)
    def test_world_links(self):
        places=self.state['world']['locations']
        self.assertIn(self.state['player']['location_id'],places)
        for npc in self.state['world']['actors'].values():
            self.assertIn(npc['location_id'],places)
            self.assertEqual(npc['progression']['powers'],[])
    def test_provisional_progress(self):
        skills=self.state['player']['progression']['skills']
        self.assertEqual(sum(x['xp'] for x in skills.values()),self.state['player']['progression']['lifetime_skill_xp'])
        self.assertTrue(all(x['last_progress_event_id'] is None for x in skills.values()))
    def test_pre_shockwave(self):
        self.assertEqual(self.state['time']['day'],-30)
        self.assertFalse(self.state['world']['shockwave_arrived'])
        self.assertEqual(self.state['player']['progression']['powers'],[])
if __name__=='__main__':
    unittest.main()
