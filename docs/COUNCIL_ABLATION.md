# Bird Eye council contribution screen — 25 October 2026

Author: Parham (Leon) Faraji · [leon-executes](https://github.com/leon-executes)

This is a small local diagnostic screen, not a general accuracy certification. The AGPL thermal detector is removed from application routing, setup and new release packages. Other expert choices and generation settings are unchanged. No training was performed. Two permissively licensed detector candidates were tested; neither was promoted.

## Findings and member value

**EarthDial is the RGB scene-identification MVP in this screen.** It correctly named all three NWPU scene types in its independent captions, whereas the complete council retained two of three. Keep the fast specialist caption prominent. It still failed several tiny EuroSAT patches, so this is not universal satellite competence.

| Member | Evidence from this screen | Practical assessment |
|---|---|---|
| EarthDial 4B RGB | 3/3 NWPU independent scene identities; removal lost sea-ice identity; 5/10 coarse class-compatible EuroSAT captions | Primary RGB caption contributor; fastest direct path |
| Qwen3.5 9B | Useful Earthrise and paired urban RGB/TIR descriptions; 4/10 coarse class-compatible EuroSAT captions; overrode correct farmland specialists | Necessary current structured reviewer, but an unreliable final authority. Fix evidence arbitration before adding more members |
| CapRL 4B | Correct junction/field hypotheses and some extra layout; asteroidal-debris interpretation on sea ice; 4/10 coarse class-compatible EuroSAT captions | Auxiliary detail challenger; no demonstrated net scene-identity gain in the three council removals |
| RemoteCLIP | About one second per council; correct ice/junction top labels but tanks for fields; 2/10 coarse class-compatible EuroSAT top labels | Cheap auxiliary hypotheses, weak at this resolution. Do not treat similarity or specialist branding as authority |
| Qwen critic role | Removing it preserved the same two-of-three broad identities; two of three claim records became incomplete | Protocol support rather than demonstrated scene-recognition improvement on this subset |

These are configured-application comparisons, not model leaderboards: prompts, context and visual-token budgets differ by production profile. The Qwen independent pass both helped ice and harmed farmland. The right next target is how the final reviewer weighs contradictory evidence, not unconditional removal of that pass. No expert besides the AGPL detector has been disabled in this change.

## Protocol

- Same source pixels and declared modalities across each scene's variants. Existing 1.0.0 generation profiles and production claim-ledger protocol; Vulkan inference on the local machine. Dataset classes, captions and object boxes are withheld from inference.
- Three fixed NWPU test scenes: sea ice (`nwpu-test-000`), road junction (`nwpu-test-003`), center-pivot fields (`nwpu-test-007`). Full council versus no EarthDial, no CapRL, no RemoteCLIP, no independent Qwen observation, and no critic. Removing EarthDial uses the application's normal Qwen-first fallback, so that variant also changes Qwen's role prompt.
- Exact-request SHA-256 caching reuses identical independent model outputs; changed critic/judge prompts run again. This makes observation differences controlled and saves compute. Cached-variant wall times are **not** honest estimates of end-user speedup. Fresh full-council and standalone pass times are retained separately.
- Two HIT-UAV scenes: six annotated people (`hituav-003`) and fourteen annotated cars (`hituav-008`). Compare legacy proposals, no detector, and the RGB RT-DETR candidate. Also check a paired Landsat RGB/TIR input and the NASA Earthrise MISC control.
- Ten EuroSAT RGB patches, one per reference class, compare the three VLMs independently. RemoteCLIP is additionally ranked on all 30 bundled EuroSAT patches. Tiny 64-pixel images are a deliberate resolution stress test, not a representative test of all satellite imagery.
- Three object detectors are evaluated on the same 18 HIT-UAV images: 210 retained named-class boxes, confidence threshold 0.35, class-sensitive greedy matching at IoU ≥0.5. DontCare annotations are excluded. These are previously selected development examples; training overlap and correlated video frames limit generalization.
- Scene quality is reviewed against the input pixels and source labels by the coding assistant. This is not a blinded independent human panel. Exact land-cover subtype, broader useful scene identity, invented detail and protocol completeness are distinguished. No word-overlap score is labelled caption accuracy.


## Standalone low-resolution stress screen

Ten 64×64 EuroSAT patches, one per supplied class. The following assistant-reviewed grades measure whether the caption identifies a compatible **broad** scene class. They do not certify all details or exact annual/permanent crop type. C = compatible broad identity; P = partial or unresolved identity; — = target identity missing, wrong or only a texture description.

| Input / reference | EarthDial | CapRL | Qwen | RemoteCLIP top label |
|---|---|---|---|---|
| 000 Industrial | P | C | C | — |
| 001 Highway | P | C | P | — |
| 003 Residential | C | P | — | — |
| 004 Herbaceous vegetation | — | — | — | — |
| 006 Sea/lake | C | — | — | C |
| 008 Annual crop | — | — | P | — |
| 010 River | C | C | C | — |
| 013 Forest | — | — | — | — |
| 015 Pasture | C | — | C | C |
| 017 Permanent crop | C | C | C | — |

Median standalone wall times across these ten cases were EarthDial **0.42 s**, CapRL **1.14 s**, Qwen **7.77 s**. Each set includes a cold first load; medians mostly reflect an already-loaded model. These tiny images and short EarthDial captions are not representative of arbitrary imagery latency. Some CPU helper checks overlapped portions of the earlier GPU council tests, so timings are indicative.

RemoteCLIP was also screened on all 30 bundled EuroSAT patches. On three surprising failures, the original PyTorch model reproduced the ONNX top hypotheses: harbor for industrial, basketball courts for residential, and sea ice for forest. This excludes a simple ONNX-export explanation for those cases.

## RGB council ablation

The three scene identities are sea ice, an urban road junction and circular center-pivot fields. A broadly correct noun is required; a texture-only description fails even when its color/shape inventory is accurate.

| Variant | Sea ice | Road junction | Circular fields | Correct broad identity |
|---|---|---|---|---:|
| Full council | Correct | Correct; red lane misplaced in detail | Fails: textured surface | 2/3 |
| Without EarthDial | Fails: unidentified debris | Correct | Fails: paved surface | 1/3 |
| Without CapRL | Qualified ice/rock ambiguity | Correct | Fails: textured surface | 2/3, one ambiguous |
| Without RemoteCLIP | Correct | Correct | Fails: textured surface | 2/3 |
| Without independent Qwen observation | Fails: debris/close-up | Correct | Correct circular plots | 2/3 |
| Without critic | Correct, incomplete claim review | Correct, incomplete claim review | Fails: textured surface | 2/3 |

EarthDial alone identified all three scenes correctly. Its farmland caption was “There are some bare circle farmland and green circle farmland.” The full council replaced that with “A textured surface displays a grid of circular objects…” Removing Qwen's independent observation restored circular plots to the final caption. On sea ice the same removal harmed the caption, so this is not evidence for globally disabling the independent review. It demonstrates a self-anchoring failure in the current adjudication design.

CapRL identified the junction and fields but described the ice as possible asteroidal/crystalline debris. Its detailed intersection caption contained both useful layout and a wrong red-car location. RemoteCLIP's leading hypotheses were correct for ice and junction but storage tanks for the fields. Neither auxiliary model reliably overruled a mistaken judge.

Fresh complete councils took 85.67, 70.78 and 76.05 seconds (median 76.05 s) on these three inputs, including model loading. Within those runs EarthDial's independent pass took 6.71–15.28 s, CapRL 9.68–10.35 s, RemoteCLIP 0.98–1.11 s, Qwen independent review 22.64–27.63 s, critic 8.79–10.31 s, and final judgment 19.05–23.67 s. These are machine-specific pass costs, not warm-only throughput.

## Replacement screen

| Candidate | Licence | Correct boxes | False detections | Misses | Precision | Recall |
|---|---|---:|---:|---:|---:|---:|
| Retired HIT-UAV YOLOv8n | AGPL-3.0 | 198 | 25 | 12 | 88.8% | 94.3% |
| RT-DETRv2 R18, RGB COCO | Apache-2.0 | 16 | 128 | 194 | 11.1% | 7.6% |
| RT-DETR R18, HIT-UAV fine-tune | Apache-2.0 | 18 | 0 | 192 | 100% on 18 returned matches | 8.6% |

The RGB detector is unsuitable as a thermal replacement. A COCO sanity image correctly produced two cats, remotes and a sofa, but the same model called Earth in the Earthrise control a frisbee with a 0.946 score. This demonstrates that an out-of-domain detector's high score is not semantic confidence.

The HIT-UAV candidate loaded with no missing, unexpected or mismatched weights. Its supplied processor was used without custom normalization. A post-hoc threshold sensitivity diagnostic found 80.6% precision / 23.8% recall at 0.25, and 51.0% / 34.8% at 0.20. Reducing the threshold did not produce a comparable replacement. These thresholds were explored on the same development set and are not validated operating points.

Sources and pinned revisions:

- [Retired detector](https://huggingface.co/KissTheHabit/yolov8n-hituav-thermal-finetune), legacy local ONNX hash retained in raw results.
- [RT-DETRv2 ONNX](https://huggingface.co/onnx-community/rtdetr_v2_r18vd-ONNX), `936f90b6a476c6da4dfe053fc521af55285976ba`; original [PekingU model](https://huggingface.co/PekingU/rtdetr_v2_r18vd). FP32 ONNX SHA-256 `583a236ac21c95a7fd94f284fc21485e42355bfef82c27011ba78fbc09ee87e2`.
- [HIT-UAV RT-DETR fine-tune](https://huggingface.co/whate/rt-detr-r18-thermal-detection), `554a712647672818c81d46870480e46adfe83141`, model SHA-256 `4a8980111e7d5fe6cf8d3d7359afd3e427b7e4a7bf805fd6996682de756c09f8`. Its repository includes an Apache-2.0 licence; no claim of independently verified training provenance.


## Effect of removing the detector

On the six-person HIT-UAV frame, the old detector found all six annotated people without a false positive, yet the final council caption and findings still failed to identify people. Without the detector the caption also omitted people and committed to an unverified pit/excavation interpretation. With the RGB RT-DETR candidate it instead committed to a water-reservoir interpretation. None is a satisfactory people-aware caption.

On the fourteen-car frame, the old detector found all fourteen annotated cars without a false positive. The final caption with and without its proposals was exactly identical and correctly described a row of parked vehicles. Neither final caption supplied the detector count. Both runs had incomplete claim-review records despite their useful broad scene identification.

Removing the detector therefore definitely removes useful object localization/count proposals, but on these two cases did not change whether the final caption mentioned the annotated object class: people were missed in both, vehicles identified in both. This is a two-case caption diagnostic, not proof that removal is harmless. Existing adjudication failed to make full use of a strong narrow detector.

The paired Landsat RGB/TIR check completed with a concrete urban street-grid caption. The old aerial detector was never eligible for coarse satellite thermal imagery, so its removal does not remove a Landsat temperature interpreter.

The NASA Earthrise MISC control completed with a recognizable Earth-over-lunar-horizon caption. Across all 26 council configurations there were no crashed configurations and four partial claim-review records. The 30 standalone configurations completed. Exact-request caching reused 41 calls; 76 fresh council calls, including repairs, were executed.

## Files and release verification

Raw comparisons, model receipts, cached requests, detector predictions and input references are retained locally under `work/council-ablation/`. Restricted NWPU image bytes and reference captions are not included in release ZIPs. Public sample images retain their original terms. Historical AGPL weights are quarantined outside active models and releases after baseline testing.

The regression suite checks that stale settings cannot reactivate the removed detector. All 63 bundled scenes / 77 panels pass their existing hash and measurement checks. The server smoke check verifies detector availability is false and its UI card is absent.
