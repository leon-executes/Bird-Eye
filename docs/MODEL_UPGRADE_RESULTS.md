# Current specialist evaluation — 25 October 2026

This prototype has useful specialists but is not a validated satellite/thermal captioning system. A correct input hypothesis can still be weakened or overturned by its final reviewer. Complete JSON and claim traces do not establish visual truth.

## Matched caption comparison

Four candidates each completed the same 123-image diagnostic: Qwen3.5 9B, CapRL 4B, TerraSense 8B and MiniCPM-V 4.7 1B. The set includes 45 NWPU satellite images, additional RGB regressions, real aerial thermal frames, six ground-camera thermal stress cases, private imagery and controls. References were withheld from inference. Public foundation-training overlap is unknown; development-inspected cases are regression tests.

| Model | Coverage | Expected RGB concept mentioned, on the 45 NWPU cases |
|---|---|---:|
| EarthDial 4B RGB Q4_K_M | 69 RGB cases | 41/45 |
| CapRL 4B Q4_K_M | All 123 cases | 40/45 |
| Qwen3.5 9B Q4_K_M | All 123 cases | 29/45 |
| TerraSense 8B Q4_K_M | All 123 raw diagnostic cases; RGB-only production scope | 28/45 |
| MiniCPM-V 4.7 1B Q8 | All 123 cases | 26/45 |
| MiniCPM-V 4.7 35B/A3B IQ3_M | 12 selected hard cases; not the whole set | Not comparable |

**These are keyword/concept-mention diagnostics, not caption accuracy.** A vague, incorrect or hedged answer can mention a target word. Do not rank full-caption quality or report a success percentage from this table. Partial candidate coverage and mixed image sets also prevent direct comparison of overall median latency.

## EarthDial: promising scene witness, unproven master

The original native code path was exercised on 12 hard RGB cases using its 448-pixel single-image preprocessing and an isolated compatible environment. A matched short satellite-caption prompt in GGUF also recovered several scene classes that earlier unmatched runs missed. The expanded portable test covers 69 RGB images. Earlier results do **not** establish a defective conversion. One island/ship discrepancy remains between the tested native NF4 and Q4 paths; preprocessing and quantization are not bit-identical.

EarthDial often supplies useful short scene nouns: shrubland, sea ice, circular farmland and forest. It also makes scene errors and omits important detail. An 11-image experiment asked it to write a final caption after seeing fallible model proposals. Several correct identifications survived, but island/ship and difficult-terrain errors persisted. This experiment does not isolate prompt changes from prior-opinion influence. It does not establish claim-level adjudication, infrared competence or miscellaneous-image coverage. EarthDial is a strong RGB first-witness candidate, not an unconditional sole master.

## Council regressions

The connected EarthDial + CapRL + Qwen3.5 council completed eight hard/regression cases. Qwen's final reviewer sometimes converted a correct sea-ice interpretation into stones/pebbles and reduced shrubland to a texture inventory. The larger MiniCPM reviewer completed the same eight connected cases. It retained sea ice and gave a better arid-terrain description, but still rejected the forest identification, omitted harbor detail and missed thermal-object classes. A separate six-case compact-prompt comparison also failed to establish a dependable final reviewer. A larger model or a more elaborate review graph is not automatically better.

A higher-precision EarthDial Q8 conversion completed the same 69 RGB cases. Both Q4 and Q8 mentioned 41 of the 45 expected NWPU concepts; Q8 did not repair the island/ship failure and did not establish enough benefit to replace the smaller Q4 default. This lexical diagnostic cannot rule out other detail differences.

Each report now includes the models that actually ran, their checkpoints/adapters, roles, assets, elapsed pass time and failed attempts. Skipped experts are not represented as contributors. Same-family roles are not independent votes. Original opinions remain inspectable even when the final caption is worse.

## Training and thermal coverage

The completed CapRL 2,048-image domain pilot lowered validation loss but learned unreliable thermal counts and regressed on ground-camera imagery. It was rejected; no adapter was activated. The revised language-only, count-free-target pilot also completed 256 steps over 2,048 images and generated 61 before/after cases. It was rejected: thermal class-word mentions rose from 14/26 to 16/26, but people/aircraft and bicycle/people errors persisted and some RGB detail regressed. This diagnostic is not accuracy. Neither adapter was merged, deployed or expanded to 50,000 pairs. The revised full pool contains 50,000 distinct pairs over 25,004 unique images. See SHALLOW_ADAPTATION.md and DATASETS.md for the distinction from the earlier pool, exact recipes and promotion limits.

No broadly validated pretrained IR/geothermal caption expert has been successfully installed. IRGPT's inspected official public weight folder lacked the required shards/tokenizer; Thermo-VL did not expose a runnable checkpoint in the reviewed repository. Infrared-styled synthetic imagery is not real heat evidence. Six inspected IR-TD frames exposed unsupported caption details; raw descriptions were excluded from training. This small audit is not a dataset-wide error estimate.

The narrow HIT-UAV object detector remains useful only in declared aerial-thermal scope: 198 matched true positives, 25 false positives and 12 misses on the original 18 selected test frames at score 0.35 and class-matched IoU 0.5 (precision 0.888, recall 0.943). Those are box metrics, not general caption accuracy, verified counting, ground-camera coverage or satellite-scale thermal competence.

## Reproducibility and status

Pinned candidates and acquisition decisions are listed in specialist-candidates.json; model downloads include revision/hash metadata. `benchmark-context.mjs`, `evaluate-earthdial-native.py`, `evaluate-semantic-master.mjs`, `evaluate-connected-council.mjs` and `evaluate-compact-master.mjs` retain raw outputs under ignored `work/`. Native EarthDial uses its pinned original model implementation with isolated legacy dependencies; ordinary GGUF inference needs no Python.

The clean source export excludes downloaded imagery, private reports, model weights, Python environments, local settings and credentials. Model/data rights remain separate from application licensing. Nothing has been published to GitHub. Use a freshly built version 0.3.0 portable or source export; earlier timestamped copies are historical and do not include these upgrades.

## Additional practical checks

The existing compact thermal detector was tested on 30 additional, previously unused official test frames, including six with no target boxes. At score 0.35, NMS 0.45 and class-matched IoU 0.5 it produced 125 true positives, 25 false positives and 23 misses: precision 0.833, recall 0.845. One proposal appeared across the six negative frames. These are narrow box metrics on a stratified development subset, not caption accuracy, calibrated confidence, geographic independence or ground/orbital coverage. Its fallible object proposals are visible separately from the final VLM wording.

The actual application successfully ran EarthDial Quick caption through the CPU backend on this Windows laptop, returned a tree-covered-island caption, and recorded EarthDial as the sole model used. The workflow check restored Vulkan afterward. This validates one local CPU path, not compatibility with every computer. Forty-five source tests and data integrity checks for 102 public/control scenes and 116 assets passed. HTTP checks covered health, access guards, source privacy, asset serving, receipt module, training-progress visibility and blocking overlapping caption compute. No visual UI inspection is claimed.

The connected council also completed a four-panel private river-scene regression with a useful vegetated delta/distributary-island caption and branching-channel description. Its grayscale companions remain UNKNOWN; a successful scene caption does not establish their physical sensor modality, alignment or thermal validity. This is one development case, not a success rate.
