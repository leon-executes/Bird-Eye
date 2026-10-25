> Historical research record from the predecessor engine. The Bird Eye distributable sample pack and current release contracts are documented in SAMPLES.md, TRAINING.md and RELEASE.md.

# Optional shallow adaptation on an 8 GB NVIDIA GPU

Status: a 96-step rank-8 adapter was trained locally on 25 October 2026 and evaluated. It was NOT promoted. The application remains usable without the training stack.

The pretrained-model comparison showed material remaining scene-identity errors, so a bounded supervised adapter was tested. Do not train merely to make captions longer or more confident, and do not distil the current models' incorrect captions into targets.

## Hardware fit

This development machine reports an RTX 5060 Laptop GPU with 8151 MiB and NVIDIA driver 573.01 / CUDA 12.8. A CUDA 12.8 PyTorch build is the compatibility target; changing the system driver is not part of this experiment. Inference fit does not imply training fit. Profile actual peak allocated/reserved VRAM in a one-step smoke test before running the full bounded job.

The initial candidate is Qwen3-VL-4B-Instruct with a 4-bit frozen base and rank-8 adapters on language attention projections. Keep the vision encoder and image projector frozen. Use batch 1, gradient accumulation 4, checkpointing, a bounded image-token budget and short answer-only supervision. It is a candidate, not a guarantee of fitting or improving. Avoid Qwen3.5 9B QLoRA for this machine: upstream Unsloth guidance discourages that model family's 4-bit training path, while its stated bf16 LoRA requirement substantially exceeds 8 GB.

A smaller Falcon/Florence satellite captioner is another potential adapter target, but its task-specific pipeline needs a separate integration. The general judge should not be taught to mimic the specialist's errors.

## Data discipline

`runtime/node.exe scripts/prepare-adaptation-data.mjs` prepares a bounded subset of public RSICD train/validation images under ignored `data/adaptation/`. Targets are existing human captions, not invented scene descriptions. It reserves every image already in the app, including private contact-sheet crops and the public test scenes. It excludes source-file matches, exact hashes and near matches using a 64-bit difference hash. All captions of an image stay together. This screens duplicates; it does not prove geographical separation.

Use the validation split to select an adapter. Before promotion, add fresh, previously unexamined test scenes from the official test split, also screened against training and validation. Keep the currently inspected hard examples as regression tests, not the sole evidence of generalization. Foundation-model training overlap with public benchmarks remains unknown.

This first adaptation pack is RGB only. It cannot demonstrate thermal improvement. Thermal adaptation would need real thermal captions/grounded annotations at a suitable spatial resolution. Human boxes support class/location/count training, but do not justify fabricated whole-scene descriptions, heat-source causes, temperatures or geothermal labels. Synthetic colorized IR cannot substitute for real thermal validation.

## Promotion gate

Compare the untouched base, adapter and current best council on identical images. Review principal scene identity, object/landform relationships, unsupported detail, critical omissions, artifact recognition and appropriate uncertainty. Report raw examples and inference cost. Validate thermal and miscellaneous controls for regressions even when training is RGB-only. Lower loss or higher caption-token overlap alone does not pass the gate. If the adapter fails, retain the original base and record the failed experiment.

## Sources

- https://huggingface.co/docs/peft/developer_guides/quantization
- https://huggingface.co/docs/transformers/en/model_doc/qwen3_vl
- https://huggingface.co/unsloth/Qwen3-VL-4B-Instruct-bnb-4bit
- https://unsloth.ai/docs/models/qwen3.5/fine-tune
- https://pytorch.org/get-started/previous-versions/
- https://github.com/TianHuiLab/Falcon

## Reproduction (Windows x64 / Python 3.12)

The optional training stack is isolated from portable inference. `node scripts/setup-training-assets-win.mjs` downloads the pinned 4-bit HF checkpoint and CUDA 12.8 Torch wheel, checks SHA-256, and resumes completed ranges. Create a separate Python 3.12 virtual environment; install `scripts/requirements-training-win.txt` there (the downloaded Torch wheel can be installed locally). The script uses native Transformers model classes, not downloaded custom Python model code.

Prepare the data, then run `python scripts/train-caption-adapter.py --model models/qwen3vl-training-base --output models/adapter-smoke --smoke`. The output must not already exist. A real pilot uses a separate output directory and at most 128 steps. Optional `--eval-manifest data/adaptation/pilot-evaluation.json` generates matched base/adapter captions from image bytes only; references remain outside the prompt. The controller blocks new managed inference while the training lock is active. A stale lock after a hard crash must be checked before another training run.

No adapter is selected automatically, and a successful GPU step is not a quality result.

## Completed pilot result

384 RGB training images and 48 separate validation images were prepared. Validation loss was measured on a fixed 24-image validation subset. A separate comparison used 12 fresh official test-split images (one selected per caption-keyword stratum) plus five previously inspected development regressions. Exact/source-name/near-duplicate screening was applied; geographic and foundation-pretraining independence are not guaranteed.

The pilot trained 983,040 parameters (about 0.022% of the full model), rank 8 / alpha 16, last 12 text-layer q/v projections, batch 1 accumulated over 4 examples, learning rate 2e-5, one 384-image pass over 96 optimizer steps. The vision encoder/projector remained frozen. Optimization took 103.3 seconds. Peak tensor allocation was 3,608 MiB; peak reserved memory was 6,004 MiB. The 159.7-second recorded post-baseline phase also includes validation and adapter caption generation; it excludes loading and baseline generation.

Validation loss fell from 6.9624 to 4.1331. Assistant visual/reference review found the principal scene class broadly correct on 11 of 12 fresh RGB cases for BOTH the base and adapter. This small, non-blinded review is not a general accuracy estimate. The forest image remained a stucco-wall interpretation. Private arid/striped-scene failures persisted, and added chimney/building details were not convincingly supported. The thermal hard case became slightly more tentative about possible people, but the training set contains no thermal images and this does not establish IR improvement.

Decision: retain the 3.94 MB adapter and full logs under ignored models/adapter-pilot-20261025b for research; do not enable it in the council or include it in the portable model roster. There was no GGUF adapter conversion or deployment because the semantic promotion gate was not met. A prior partial baseline-generation attempt was interrupted to repair training-lock integration before optimization; the completed run is the b-suffixed directory.

## Domain pilot and 50,000-pair pipeline (25 October 2026)

The newer pipeline is `scripts/train-domain-adapter.py`. It starts from the official **CapRL-Qwen3VL-4B** caption-RL checkpoint, not the earlier generic 4B baseline. The complete pinned native base and verified GGUF candidate are acquired separately; see `scripts/model-downloads.json`.

Training uses NF4 double quantization, bf16 computation, answer-only loss, gradient checkpointing and a frozen visual encoder. Rank-8 adapters cover language attention/MLP projections **and visual merger/deepstack merger projections** (16,990,208 trainable parameters). The effective batch is eight images; maximum pixels are 448². The pilot uses microbatch four. The optional larger run uses microbatch two to reduce peak memory. Native PyTorch/CUDA works on the development Windows RTX 5060 laptop; no WSL or flash-attention is required.

The pilot is 2,048 unique images, evenly split between original human NWPU captions and captions derived from human HIT-UAV boxes. It validates on 32 RGB + 32 thermal images and generates before/after captions on 61 separate development cases. The separate 50,000-pair manifest contains 26,516 unique images and is RGB-heavy. Raw IR-TD descriptions were excluded after audit. No data-volume claim substitutes for quality or generalization.

From this prepared development folder:

```powershell
# Start or resume the exact pilot; opens the app for progress and safe pause.
.\runtime\node.exe scripts/run-domain-training.mjs pilot
# Optional larger candidate run; never automatically activates a model.
.\runtime\node.exe scripts/run-domain-training.mjs full
# Generate a local, private before/after HTML review.
.\runtime\node.exe scripts/report-domain-adaptation.mjs models/caprl-domain-pilot-20261025
```

Double-click equivalents are `Resume domain pilot.cmd` and `Train 50k candidate.cmd`. Training is optional and its Python environment/data are excluded from the lean portable copy. A fresh source checkout needs Python 3.12 plus the pinned `scripts/requirements-training-win.txt`, the official native model, and the curated manifests. The old `setup-training-assets-win.mjs` downloads the earlier generic baseline; it is not the CapRL installer. For CapRL use `runtime/node.exe scripts/setup-specialists.mjs caprl-training-base`. Acquire/prepare data with `download-nwpu.mjs`, `download-hituav-training.mjs`, `prepare-domain-rgb.py`, `prepare-domain-hituav.py`, `prepare-domain-pilot.py`, and `prepare-human-50k.py`, preserving the prerequisite evaluation manifests described in their source. This is a development pipeline, not an unattended one-command dataset reconstruction promise.

The app displays training phase and step count. **Pause training safely** writes a stop request; the trainer saves at the next optimizer boundary, then releases GPU resources. Evaluation can stop between samples. Checkpoints retain optimizer and RNG state; explicit resume checks trainer hash, prompts and manifests. A completed run remains a candidate until semantic review and deployment checks. Checkpoint source/manifests must not be edited during an active run.

For a reviewed candidate, merge into a new copy of the original bf16 base using `merge-domain-adapter.py`, then use `export-domain-gguf.ps1` to export both the decoder and adapted vision projector. Exporting only the decoder would lose the learned visual merger. Run `benchmark-domain-export.mjs` against both base and candidate with the training-compatible 64–196 image-token budget. Native and llama.cpp image preprocessing differ, so nominal budget matching is not a claim of bit-identical inputs or outputs. No export helper changes the active app roster.

Evaluate actual subject identification, invented objects, counts and spatial relationships, plus out-of-domain regressions. A lower loss, valid JSON, longer caption, expected-word hit, or complete claim trace is insufficient for promotion. Aerial thermal training must not be represented as validated ground-camera, orbital thermal, geothermal or radiometric expertise. Model/data rights remain separate from the PolyForm Noncommercial application source.
## Revised semantic adaptation (25 October, after the completed domain pilot)

The 2,048-image CapRL domain pilot completed all 256 optimizer steps and its 61-image before/after evaluation. **It was rejected for deployment.** Lower validation loss did not translate into reliable captions: it repeated wrong thermal counts, achieved complete annotated class/count-set agreement on only 2 of 20 selected aerial thermal cases, and invented objects on ground-camera thermal controls. The adapter is retained for research and is not active. These are development observations, not a general accuracy estimate. The precise trainer used is retained locally as `work/train-domain-adapter-v1-used.py`; later lock-safety maintenance changes that file's current source hash.

The revised recipe is `scripts/train-semantic-adapter.py`: rank-8 language-only LoRA, frozen visual encoder **and all visual mergers**, learning rate 5e-6, microbatch two, effective batch eight, maximum 448² pixels. Thermal targets retain human-box object classes and coarse positions but omit exact counts. RGB targets receive a stricter rule-based language/content filter; this is not a full human factual audit. Original held-out evaluation images are unchanged. The revised 50,000-pair pool has **25,004 unique images** (23,656 RGB plus 1,348 thermal); it is a different manifest from the earlier 26,516-image pool. Fifty thousand pairs must never be reported as fifty thousand independent images.

`Train revised pilot.cmd` starts/resumes the new 2,048-image candidate. `Train 50k candidate.cmd` now uses this revised recipe and dataset, **not the rejected first recipe**. Each full-run invocation is bounded to 1,250 additional optimizer steps (up to 10,000 pairs), saves a checkpoint, then evaluates; a later invocation resumes. Both require the prepared development assets and isolated training environment. Neither activates an adapter. Completed baseline captions may be reused only when base path, prompts, pixel budget, image identities and evaluation-manifest hash match; validation loss is recomputed on the current validation targets.

The revised recipe is a testable hypothesis, not a promised improvement. Inspect scene identity, false objects, spatial relations, unsupported counts and out-of-domain regressions before any merge/export or additional training block. Training progress and safe pause appear in the app. Existing compute locks are treated as active even if Windows process enumeration hides the worker; a crash lock requires verification before manual recovery.

## Revised pilot result

The revised pilot completed all 256 steps over 2,048 images. Language-only LoRA trained 16,515,072 parameters. Optimization took 1,017.9 seconds; peak reserved training memory was 6,070 MiB, and the full run including generation peaked at 6,108 MiB. RGB validation loss fell 6.510 to 2.365 and thermal loss 7.361 to 1.406. Expected thermal class mentions changed from 14/26 to 16/26; this is a word diagnostic, not caption accuracy.

**The revised adapter was also rejected for deployment.** Shorter captions did not fix people/aircraft and bicycle/people confusions, and some useful RGB content was lost. Two thermal failure frames were visually inspected against their human object annotations; the broader review of 61 outputs was non-blinded development analysis, not an accuracy study. The checkpoint, raw before/after outputs and `promotion-review.json` are retained under `models/caprl-semantic-v2-pilot-20261025`. No merge, GGUF conversion, full 50,000-pair continuation or app activation was performed. A third run should change the supervision/visual task materially rather than repeat the same recipe at larger scale. The full-run launcher remains an explicit research tool, not a recommended next click or automatic upgrade.
