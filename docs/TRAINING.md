# Training and promotion gates

No training is started by the desktop application. No LoRA is active in the default roster.
The desktop redesign does not change prompts, sampling, model routing or inference guards.

Two earlier CapRL 2,048-image adaptation pilots completed and were rejected. The revised pilot froze
vision/merger components and trained 16,515,072 language parameters with rank 8, alpha 16, learning rate
5e-6, microbatch 2/effective batch 8, and 448 × 448 inputs. Recorded optimization time was 1,017.9 seconds;
training peak allocation was approximately 6,070 MiB on the RTX 5060 laptop.

Loss reduction was not sufficient evidence of improvement. The adapter still confused people with
aircraft and bicycles with people, and regressed on RGB examples. A small thermal word-mention
diagnostic increased from 14/26 to 16/26, but this was not a semantic accuracy measure. No merge,
GGUF promotion or full 50,000-pair continuation was approved by the recorded quality gate.

The revised prepared pool comprised 50,000 instruction pairs over 25,004 unique images:
23,656 RGB and 1,348 thermal images. Multiple instruction pairs reuse images. Caption-source rights,
image duplication, geographic/capture overlap and public pretraining leakage remain separate concerns.
Research corpora, training environments and failed adapter weights are not in the public desktop ZIP.

A future candidate should enter through a new frozen evaluation gate:
- Keep satellite RGB, aerial thermal, ground thermal and miscellaneous inputs distinct.
- Audit labels for object identity, unsupported activity and thermal-cause claims.
- Include no-object negatives and localized object evidence.
- Separate training/validation/test by capture or geography where metadata permits, not just file hash.
- Compare base versus adapter on the same unseen inputs, including protected RGB regression cases.
- Measure human-reviewed factual usefulness, omissions, hallucinations and localization/count errors.
- Promote only if the intended domain improves without unacceptable regressions and deployment conversion
  preserves behavior; record exact checkpoint, adapter, quantization and runtime hashes.

The earlier prospective detector check used 30 additional HIT-UAV frames, with exact-byte/perceptual
exclusions against used material. At score threshold 0.35, NMS 0.45 and class-matched IoU 0.5 it recorded
125 TP, 25 FP and 23 FN (precision 0.833, recall 0.845). This evaluates boxes on a narrow aerial dataset,
not VLM caption quality, geothermal causes, human intent or universal thermal understanding.

Earlier research implementation notes remain in SHALLOW_ADAPTATION.md and MODEL_UPGRADE_RESULTS.md.
They describe the previous experiments, not a training capability bundled into the desktop UI.

