# D-058 supplement — ChatGPT GitHub connector transport QA (2026-11-17)

## Result: PASS for connector transport only

This is a verified, noncanonical no-op exercise of the **already connected
ChatGPT GitHub plugin**. No Codex, custom MCP server, externally supplied
token, paid hosting, or background process was used.

- Authorized narrative branch stayed at ba19db963162e5c5f4ce4ad2e8d6a71cc9dff57e.
- QA-only story branch: qa/chatgpt-native-journal-transport-20261117.
- Source HEAD: ba19db963162e5c5f4ce4ad2e8d6a71cc9dff57e.
- Detached QA commit: 124a8114c9cbd121adc1aea9c89f0cf1698c5d81.
- QA journal stored on journal/living-world-save-attempts at:
  .narrative-save-attempts/cWEvY2hhdGdwdC1uYXRpdmUtam91cm5hbC10cmFuc3BvcnQtMjAyNjExMTc.json
- QA journal final marker: qa_transport_verified. It is deliberately *not*
  a recognized production save status.
- Canonical journal for work/chat-narrative-foundation stayed at ready.

## Observed steps and evidence

1. Created QA branch from verified narrative HEAD; no original work deleted.
2. Wrote and reread QA blocked journal before any QA commit.
3. Built a Git tree explicitly listing the five canonical story paths,
   referencing exact existing file blobs. It matched the source tree SHA:
   918674e9a2155e822e68982e983c9a55445ee0ff.
4. Created detached QA-only commit parented to source HEAD.
5. Persisted and reread detached commit SHA in the blocked QA journal before
   updating the QA branch. The tool execution was interrupted between steps:
   later calls used only the persisted detached SHA and observed source HEAD.
6. Used the connector's non-force expected-SHA ref update to move QA HEAD.
7. Reread all five files from the detached commit and verified identical Git
   blob hashes; reread QA HEAD and journal marker.
8. Reread the authorized story HEAD and original canonical journal: both
   unchanged, story still CH-000 turn 9, EV-000029, TXT-000020.

Expected and actual five-file blob hashes:
- transcript: 1350916ead7fb1f2f15fdd635dda42e69a0a3fed
- events: 1f40c724e44f70c9b45814dc11ff1f73262c5a5f
- chapter prose: e4c11953eae355c2e06b0a1c7aa01ade3d28e4d4
- state: 0320a93ebf4a944da97b65dffa6d281acce46d94
- manifest: 897ec2e77ece4f8edf506c7058552a5dd3cdb320

## Limits and next safe task

This was a **no-op transport test**. It does not exercise authoring a
narrative turn, the actual Node save coordinator inside ChatGPT, production
journal status verified, checkpoint validation after a real new turn,
recovery of genuinely changed story bytes, nor proof that generated narration
reached the reader. There is no automatic background save loop.

The next launch gate is a fully reviewed owner-authored action, or an
isolated *valid synthetic new turn* with the existing engine and a real
connector-native journaled five-file save, complete readback and recovery.
No QA outcome becomes canon. Do not initiate CH-000 turn 10 without the user's
actual in-story action and guaranteed save-before-delivery.

Code/tests for the ready baseline were integrated in PR #71; its CI run
44228320512 passed. Documentation and fast-resume handoff were integrated
in PR #72; CI 44228840078 passed. These are independent from the connector
transport proof recorded above.
