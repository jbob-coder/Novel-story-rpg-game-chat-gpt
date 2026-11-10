import unittest,json
from pathlib import Path
R=Path(__file__).resolve().parents[1]
def load(p):return json.loads((R/p).read_text(encoding='utf-8'))
class BackstoryAster(unittest.TestCase):
 def setUp(self):
  self.s=load('game/STATE.json');self.p=self.s['player'];self.m=load('game/SAVE_MANIFEST.json')
 def test_sister(self):
  sister=self.s['world']['actors']['NPC-004'];self.assertEqual((sister['age'],self.p['age']-sister['age']),(17,4));self.assertIn('menor',sister['role'])
 def test_fire_background_not_event(self):
  self.assertEqual(self.p['personal_history']['fire_incident']['player_age_approx'],12)
  self.assertIn('incendio',self.p['personality']['communication']['medical_cause_of_speech_difficulty'])
  self.assertEqual(load('chapters/CH-000.events.json')['events'],[])
 def test_hacking_moral(self):
  self.assertIn('hacking',self.p['finances']['origin'])
  self.assertEqual(self.p['progression']['attributes']['willpower'],5)
 def test_aster(self):
  a=next(x for x in self.p['inventory'] if x['id']=='ITEM-ASTER')
  self.assertEqual((a['size'],a['functional_state']),('mediano','incompleto'))
  spec=(R/'game/ASTER_SPEC.md').read_text(encoding='utf-8').lower()
  for token in ['jetpack','14k','ump','abort','visión nocturna','calor','cabina']:
   self.assertIn(token,spec)
 def test_real_save_still_zero(self):
  self.assertEqual((self.m['last_completed_turn'],self.m['last_event_sequence'],self.s['save']['last_verified_turn']),(0,0,0))
if __name__=='__main__':unittest.main()
