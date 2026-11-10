import unittest
import json
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
class CurrentCheckpoint(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.state = json.loads((ROOT/'game/STATE.json').read_text(encoding='utf-8'))
        cls.manifest = json.loads((ROOT/'game/SAVE_MANIFEST.json').read_text(encoding='utf-8'))
        cls.events = json.loads((ROOT/'chapters/CH-000.events.json').read_text(encoding='utf-8'))
    def test_character_persisted(self):
        p=self.state['player']
        self.assertTrue(p['initialized'])
        self.assertEqual((p['name'],p['age'],p['role']),('Jack Wilson',21,'gray-hat hacker'))
        self.assertIn(p['location_id'],self.state['world']['locations'])
    def test_saved_story_not_reset_to_turn_zero(self):
        self.assertGreaterEqual(self.manifest['last_completed_turn'],6)
        self.assertGreaterEqual(self.manifest['last_event_sequence'],21)
        self.assertEqual(self.manifest['last_event_sequence'],len(self.events['events']))
        self.assertEqual(self.manifest['last_event_id'],self.events['events'][-1]['id'])
        self.assertEqual(self.state['save']['last_verified_turn'],self.manifest['last_completed_turn'])
        self.assertEqual(self.state['chapter']['last_resolved_event_id'],self.manifest['last_event_id'])
        self.assertEqual(len(self.state['history']['completed_turn_keys']),self.manifest['last_completed_turn'])
        self.assertFalse(self.state['player']['opening_intent']['device_placed'])
    def test_world_links(self):
        places=self.state['world']['locations']
        self.assertIn(self.state['player']['location_id'],places)
        for npc in self.state['world']['actors'].values():
            self.assertIn(npc['location_id'],places)
            self.assertEqual(npc['progression']['powers'],[])
    def test_historical_xp_is_frozen(self):
        archive=self.state['player']['progression']
        self.assertEqual(sum(x['xp'] for x in archive['skills'].values()),48)
        self.assertEqual(archive['lifetime_skill_xp'],48)
        self.assertTrue(all(not e['progression_awards'] for e in self.events['events'] if e['turn']>6))
    def test_pre_shockwave(self):
        self.assertEqual(self.state['time']['day'],-30)
        self.assertFalse(self.state['world']['shockwave_arrived'])
        self.assertEqual(self.state['player']['progression']['powers'],[])
if __name__=='__main__':
    unittest.main()
