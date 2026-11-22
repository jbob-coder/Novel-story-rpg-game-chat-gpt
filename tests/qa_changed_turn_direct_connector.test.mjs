// QA ONLY: validate a changed-byte synthetic checkpoint without altering canon.
// Deliberately excludes turn-9 fixed-fixture regression tests. Do not merge.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {decodeFiveFiles,encodeFiveFiles,savePaths} from '../tools/save_transaction.mjs';
import {verifyNarrativeSnapshot} from '../tools/turn_engine.mjs';
import {checkFullNarration} from '../tools/narrative_archive.mjs';
import {verifyChapterHistory} from '../tools/chapter_history.mjs';
import {verifyStateChanges} from '../tools/state_changes.mjs';
import {verifyTravelHistory} from '../tools/living_world_travel.mjs';

const paths=savePaths('CH-000');
const sourceFiles=Object.fromEntries(paths.map(path=>[
 path,readFileSync(new URL('../'+path,import.meta.url),'utf8')
]));
const label='[SYNTHETIC QA ONLY';
const snapshot=()=>decodeFiveFiles(sourceFiles,'CH-000');

test('synthetic changed-byte five-file checkpoint decodes and passes full JS snapshot gate',()=>{
 const s=snapshot();
 assert.equal(verifyNarrativeSnapshot(s),true);
 assert.equal(checkFullNarration(s),true);
 assert.equal(verifyChapterHistory(s),true);
 assert.equal(verifyStateChanges(s),true);
 assert.equal(verifyTravelHistory(s),true);
});

test('all five QA checkpoint files round-trip to identical literal bytes',()=>{
 const encoded=encodeFiveFiles(snapshot());
 assert.deepEqual(Object.keys(encoded).sort(),[...paths].sort());
 for(const path of paths)assert.equal(encoded[path],sourceFiles[path],path);
});

test('synthetic turn ten contains one actor-owned event and literal narration pair',()=>{
 const {state,manifest,events,transcript,chapter}=snapshot();
 assert.equal(manifest.last_completed_turn,10);
 assert.equal(manifest.last_event_sequence,30);
 assert.equal(manifest.last_event_id,'EV-000030');
 assert.equal(manifest.last_transcript_sequence,22);
 assert.equal(manifest.last_transcript_id,'TXT-000022');
 assert.equal(events.events.length,30);
 assert.equal(transcript.entries.length,22);
 const e=events.events.at(-1);
 assert.equal(e.id,'EV-000030');
 assert.equal(e.turn,10);
 assert.equal(e.day,-29);
 assert.equal(e.kind,'player_action');
 assert.deepEqual(e.actor_ids,['PLAYER-001']);
 assert.deepEqual(e.state_changes,[]);
 assert.deepEqual(e.progression_awards,[]);
 const p=transcript.entries.at(-2),n=transcript.entries.at(-1);
 assert.equal(p.id,'TXT-000021');
 assert.equal(n.id,'TXT-000022');
 assert.equal(p.role,'player');
 assert.equal(n.role,'assistant');
 assert.ok(p.text.startsWith(label));
 assert.ok(n.text.startsWith(label));
 assert.ok(chapter.includes(n.text));
 assert.equal(state.save.last_verified_turn,10);
 assert.equal(state.history.completed_turn_keys.length,10);
 assert.equal(state.history.last_event_sequence,30);
 assert.equal(state.history.last_transcript_sequence,22);
});

test('QA changes retain the original world, player, day and existing actor roster',()=>{
 const {state}=snapshot();
 assert.equal(state.time.day,-29);
 assert.equal(state.time.time_of_day,'morning');
 assert.equal(state.time.elapsed_minutes_since_opening_approx,894);
 assert.equal(state.player.location_id,'LOC-WILSON-WORKSHOP');
 assert.equal(Object.keys(state.world.actors).length,7);
 assert.equal(Object.keys(state.world.locations).length,15);
 assert.equal(state.world.shockwave_arrived,false);
 for(const actor of Object.values(state.world.actors))
  assert.deepEqual(actor.progression.powers,[]);
});

test('synthetic QA story is visibly noncanonical and awaiting real player decision',()=>{
 const {state,manifest,events,transcript,chapter}=snapshot();
 assert.ok(manifest.notes.startsWith(label));
 assert.ok(state.save.notes.startsWith(label));
 assert.ok(state.pending.message.startsWith(label));
 assert.ok(chapter.includes('[SYNTHETIC QA ONLY'));
 assert.ok(events.events.at(-1).outcome.includes('SYNTHETIC QA'));
 assert.ok(transcript.entries.at(-1).text.startsWith(label));
 assert.equal(state.pending.type,'await_player_action');
});
