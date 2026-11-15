// One-time, read-only GitHub smoke for the context loader.
// QA ONLY: no story commits, no journal writes, no narration.
import assert from 'node:assert/strict';
import {createGitHubSaveAdapter} from './github_save_adapter.mjs';
import {createGitHubSaveJournal} from './github_save_journal.mjs';
import {loadVerifiedContextPacket} from './verified_context_loader.mjs';

const repository='jbob-coder/Novel-story-rpg-game-chat-gpt';
const storyBranch='work/chat-narrative-foundation';
const token=process.env.GITHUB_TOKEN;
assert.equal(process.env.GITHUB_REPOSITORY,repository);
assert.equal(process.env.GITHUB_REF,'refs/heads/qa/trigger-live-context-read-20261115');
assert.match(token??'',/^\S+$/,'A temporary GitHub Actions read token is required');

const remote=createGitHubSaveAdapter({repository,token});
const journal=createGitHubSaveJournal({
 repository,token,journalBranch:'journal/living-world-save-attempts'
});
const narrator=await loadVerifiedContextPacket({
 remote,journal,branch:storyBranch,query:'Aster brazo taller',
 maxReferences:12,maxPreviewCharacters:600
});
assert.equal(narrator.loadStatus,'verified_read_only');
assert.equal(narrator.sourceCommitStatus,'verified_immutable_remote_readback');
assert.equal(narrator.mayAdvanceStory,false);
assert.equal(narrator.checkpoint.chapterId,'CH-000');
assert.equal(narrator.checkpoint.turn,9);
assert.equal(narrator.checkpoint.day,-29);
assert.equal(narrator.checkpoint.lastEventId,'EV-000029');
assert.equal(narrator.checkpoint.lastTranscriptId,'TXT-000020');
assert.ok(narrator.references.some(r=>r.id==='game/ASTER_SPEC.md'));
assert.ok(narrator.references.some(r=>r.id==='EV-000029'));
const reader=await loadVerifiedContextPacket({
 remote,journal,branch:storyBranch,audience:'reader_visible',
 query:'Rosa reloj taller',maxReferences:12,maxPreviewCharacters:2000
});
assert.equal(reader.sourceCommit,narrator.sourceCommit,'Context HEAD changed during QA run');
assert.equal(reader.mayAdvanceStory,false);
assert.equal(reader.summary,null);
assert.equal(reader.requiredReads.length,0);
assert.ok(reader.references.every(r=>r.kind==='transcript'&&!('preview' in r)));
const manifestFile=await remote.readFiles(narrator.sourceCommit,['game/SAVE_MANIFEST.json']);
const manifest=JSON.parse(manifestFile['game/SAVE_MANIFEST.json']);
assert.equal(manifest.last_completed_turn,9);
assert.equal(manifest.last_event_id,'EV-000029');
assert.equal(manifest.last_transcript_id,'TXT-000020');
console.log(JSON.stringify({
 status:'PASS',mode:'READ_ONLY',sourceCommit:narrator.sourceCommit,
 journalGate:narrator.journalGate,chapter:narrator.checkpoint.chapterId,
 turn:narrator.checkpoint.turn,privatePacketVerified:true,
 readerProjectionNoPrivatePreview:true,canonicalWrites:0
}));
