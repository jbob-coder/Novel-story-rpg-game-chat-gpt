# Regression tests for owner-confirmed fictional character setup.
import unittest, json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
def read(path): return json.loads((ROOT/path).read_text(encoding='utf-8'))
class CharacterProfile(unittest.TestCase):
    def setUp(self):
        self.state=read('game/STATE.json')
        self.player=self.state['player']
        self.manifest=read('game/SAVE_MANIFEST.json')
        self.events=read('chapters/CH-000.events.json')
    def test_identity_and_voice(self):
        self.assertEqual((self.player['name'],self.player['age']),('Jack Wilson',21))
        self.assertIn('TDAH',self.player['personality']['adhd_portrayal'])
        self.assertEqual(self.player['personality']['communication']['collar_device_id'],'ITEM-VOICE-COLLAR')
        self.assertEqual(self.player['personality']['communication']['phone_item_id'],'ITEM-PHONE')
        self.assertIn('no decide',self.player['personality']['communication']['speech_rule'])
    def test_finances(self):
        self.assertIn('casa',self.player['finances']['private_reserves'])
        self.assertIsNone(self.player['finances']['exact_amount'])
        self.assertIn('modesto',self.player['finances']['visible_standard_of_living'])
    def test_family_and_places(self):
        self.assertEqual(set(self.player['family_ids']),{'NPC-004','NPC-005'})
        actors=self.state['world']['actors']
        self.assertEqual(actors['NPC-004']['age'],17)
        self.assertIn('hermana menor',actors['NPC-004']['role'])
        self.assertIn('abuela',actors['NPC-005']['role'])
        for a in actors.values():
            self.assertIn(a['location_id'],self.state['world']['locations'])
        for key in ('home_location_id','workroom_location_id'):
            self.assertIn(self.player[key],self.state['world']['locations'])
    def test_equipment_status(self):
        items={item['id']:item for item in self.player['inventory']}
        self.assertGreaterEqual(len([x for x in items.values() if x['size']=='pequeño']),6)
        self.assertFalse(items['ITEM-ASTER']['carried'])
        # La descripción evoluciona con el montaje; el estado funcional es la autoridad.
        self.assertEqual(items['ITEM-ASTER']['size'],'mediano')
        self.assertEqual(items['ITEM-ASTER']['functional_state'],'incompleto')
        self.assertEqual(items['ITEM-VOICE-COLLAR']['carried'],True)
        self.assertFalse(self.player['opening_intent']['device_placed'])
    def test_legacy_xp_and_saved_story(self):
        prog=self.player['progression']
        self.assertEqual(sum(v['xp'] for v in prog['skills'].values()),48)
        self.assertEqual(prog['lifetime_skill_xp'],48)
        self.assertGreaterEqual(self.manifest['last_completed_turn'],6)
        self.assertEqual(self.manifest['last_event_sequence'],len(self.events['events']))
        self.assertTrue(all(not e['progression_awards'] for e in self.events['events'] if e['turn']>6))
        self.assertEqual(prog['powers'],[])
if __name__=='__main__':unittest.main()
