"""Regression checks for the literal game archive's Python validator."""
import json
import shutil
import tempfile
import unittest
from pathlib import Path
from tools.validate_state import validate

ROOT=Path(__file__).resolve().parents[1]
class LiteralArchiveValidator(unittest.TestCase):
    def run_modified(self,mutator):
        with tempfile.TemporaryDirectory() as tmp:
            destination=Path(tmp)/'repo'
            shutil.copytree(ROOT,destination,ignore=shutil.ignore_patterns('.git','__pycache__'))
            target=destination/'chapters/CH-000.transcript.json'
            data=json.loads(target.read_text(encoding='utf-8'))
            mutator(data)
            target.write_text(json.dumps(data,ensure_ascii=False,indent=2),encoding='utf-8')
            return validate(destination)
    def test_initial_checkpoint_passes(self):
        self.assertEqual(validate(ROOT),[])
    def test_missing_transcript_entries_detected(self):
        issues=self.run_modified(lambda x:x.update(last_entry_sequence=5))
        self.assertTrue(any('transcript' in x for x in issues),issues)
    def test_transcript_role_error_detected(self):
        def corrupt(x):
            x['entries'].append(dict(id='TXT-000001',chapter_id='CH-000',turn=0,role='player',kind='player_action',text='Fake',event_ids=[]))
            x['last_entry_sequence']=1
        issues=self.run_modified(corrupt)
        self.assertTrue(any('transcript' in x for x in issues),issues)
    def test_unlinked_transcript_detected(self):
        def corrupt(x):
            x['entries'].append(dict(id='TXT-000001',chapter_id='CH-000',turn=0,role='assistant',kind='scene',source_key='scene-error-001',text='Fake',event_ids=['EV-999999']))
            x['last_entry_sequence']=1
        issues=self.run_modified(corrupt)
        self.assertTrue(any('transcript' in x for x in issues),issues)
if __name__=='__main__': unittest.main()
