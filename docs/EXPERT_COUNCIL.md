## Update: detector retirement and ablation

The AGPL detector described in the historical research below is retired in 1.0.1. See [the current evaluation](COUNCIL_ABLATION.md). Neither tested RT-DETR challenger is activated automatically.

# Expert selection and evidence council

This is an evidence-weighted review, not a vote. A trained specialist contributes a hypothesis in its supported domain. It does not gain authority to invent features. A stronger general VLM can adjudicate remote-sensing evidence without being represented as satellite-trained.

## Candidate assessment (updated 25 October 2026)

| Candidate | Useful remit | Why considered | Constraint / current qualification |
|---|---|---|---|
| EarthDial 4B RGB | First independent satellite scene interpretation | Actual remote-sensing instruction tuning; compact Phi-3/InternVL architecture | Original-code native check on 12 cases, matched GGUF spot-check and 69 RGB captions now completed. A short matched satellite prompt substantially improved recognition. Selected as first RGB witness, not sole adjudicator; 11 final-writer trials still contain scene errors. RGB checkpoint has no explicit license metadata on its model page. |
| Qwen3.5 9B | Independent visual reasoning, challenging interpretations, satellite final judgment; general/MISC fallback | Newer general multimodal model; portable quantized runtime | General VLM, not trained or validated as a geothermal specialist. Installed/tested; selected as default general reasoner, with documented remaining errors. |
| EarthDial 4B MS | SAR/NIR/multispectral interpretation | Domain-specific checkpoint and modality-aware upstream pipeline | Must preserve upstream band handling. Feeding arbitrary grayscale JPEGs is not equivalent to multispectral support. Not installed in this iteration. |
| EarthDial Methane/UHI | Narrow gas/urban heat tasks | Task-specific checkpoint | Not a general geothermal diagnosis model; requires compatible products. Not installed. |
| Falcon Single-Instruction Large (0.7B) | Cheap independent RGB caption/classification or task-specific grounding | Florence-based remote-sensing specialist with official weights | Author checkpoint access was restricted in acquisition attempts; no weights installed. Custom Python/task-token pipeline, not a deliberative judge. Multi-Instruction version is labelled unstable upstream. |
| RemoteCLIP ViT-B/32 | Rank competing scene descriptions / retrieve similar labelled examples | Small satellite image-text encoder, useful diversity against generative VLMs | Similarity is relative to candidate labels; softmax is not probability. Cannot itself produce a trustworthy caption or establish absence. Exported to CPU ONNX and connected as a fallible scene-ranking witness. |
| EagleVision | Resolved aerial objects and attributes | Domain-trained oriented detector plus language model | Object-oriented, heavier MMDetection/CUDA dependencies; narrow labels and scale must match. Not a portable general scene judge. |
| GeoChat 7B | RGB region captioning / grounding challenger | Released remote-sensing VLM | Older Vicuna/LLaVA stack; not automatically better than newer generalists. Higher integration burden than selected compact specialist. |
| Thermo-VL | Thermal-only / aligned RGB–thermal semantics | Thermal encoder and fusion with Molmo-7B | Research candidate. Project page describes results but did not expose usable code/checkpoint links in this review; deployment not verified. Not installed or claimed available. |
| Gemma 4 E4B / Qwen3.5 27B | Alternative family / larger-machine challenger | Portable multimodal candidates | Require our satellite/IR benchmark before promotion. Parameter size alone cannot select a winner. |

A HIT-UAV YOLOv8n checkpoint is also connected as a narrow aerial-thermal object witness. Local testing on 18 selected official test scenes produced 198 true positives, 25 false positives and 12 misses at score 0.35 / matching IoU 0.5 (precision 0.888, recall 0.943). This is detector performance, not caption accuracy or geothermal competence.

## Execution contract

1. **Input contract:** asset IDs, declared modality, original hashes, effective resolution, calibration and pairing status. UNKNOWN means unknown sensor, not unknowable geography. Never infer temperature from grayscale or colorized JPEGs. Generated views cannot corroborate the original observation.
2. **Satellite first opinion:** when configured and appropriate, the RGB-trained specialist sees RGB only and supplies a concise independent scene hypothesis. Unsupported modalities route to the general visual lead. Simple specialist caption interfaces are permitted; do not force an older model to act as a JSON adjudicator.
3. **Independent second opinion:** the stronger general VLM sees original input before seeing the specialist's answer. This avoids copying its first guess. Unknown multi-image inputs can receive isolated opinions before fusion.
4. **Conditional reviews:** thermal review only when TIR is declared; spectral/radar review only for NIR/SAR. Thermal and spectral reviewers initially see only their respective sensor inputs; the critic and master receive all selected images for fusion. This prevents an RGB caption from being copied as an alleged thermal observation. A thermal physics remit distinguishes objects, relative patterns and causal interpretation. Solar loading, moisture, emissivity, terrain, clouds and processing are competing explanations for heat patterns. A temperature anomaly does not establish a geothermal source. No imaginary specialized model is substituted when a trained one is absent.
5. **Claim ledger:** each independent scene hypothesis and feature has a stable ID, source model/family, asset IDs and stated scope. Critic repetition does not create fresh evidence. Multiple quantizations/roles from one family are not independent expert votes.
6. **Critic:** compares ledger hypotheses with the pixels, searches for incompatible interpretations, and asks which visible feature discriminates them. It cannot add observations to the independent evidence pool.
7. **Satellite master judgment:** sees original pixels, measurements, hypotheses and criticisms. Each initial claim receives accepted / qualified / rejected / unresolved with a reason. The caption and final findings cite accepted or qualified claim IDs. Local structured decoding requires each ledger ID as a decision-map key. Qualified sources cap CLEAR to LIKELY. Unsupported or missing links trigger one bounded repair; unresolved protocol failures mark the report partial. A failed master falls back to an independent scene opinion, never a critic masquerading as the final judge.
8. **Human result:** one or two sentences identifying the place/objects and spatial arrangement. Evidence, uncertainty and the decision trace are expandable. No percentages presented as calibrated confidence. Audit traces document the model's reasoning summary; they do not prove visual truth or caption entailment.

Managed GGUF workers run sequentially. Switching waits for the previous worker to exit before loading another. External endpoints remain their owner's memory responsibility. Images stay local unless a user explicitly configures and enables a remote endpoint. A finite review graph and one repair bound cost; there are no recursive agent debates.

## Promotion rule

A candidate must load correctly, produce usable image-conditioned output, and be compared on the same images and prompt settings. Review semantic identity, spatial relationships, unsupported detail, omissions and thermal errors separately. Include your difficult crops, unseen RGB scenes, real aerial thermal, calibrated satellite temperature products and non-geographic controls. Do not use lexical overlap or role agreement as accuracy. Training overlap with public benchmarks is unknown. Keep baseline outputs and failures. Do not replace unavailable expertise with a specialist-sounding persona.

## Primary sources

- EarthDial: https://github.com/hiyamdebary/EarthDial and https://huggingface.co/akshaydudhane/EarthDial_4B_RGB
- Qwen3.5: https://huggingface.co/Qwen/Qwen3.5-9B ; selected quantization: https://huggingface.co/unsloth/Qwen3.5-9B-GGUF
- Falcon: https://github.com/TianHuiLab/Falcon
- RemoteCLIP: https://github.com/ChenDelong1999/RemoteCLIP
- EagleVision: https://github.com/XiangTodayEatsWhat/EagleVision
- GeoChat: https://github.com/mbzuai-oryx/GeoChat
- Thermo-VL: https://rusiru.us/Thermo-VL/
- Portable runtime: https://github.com/ggml-org/llama.cpp/blob/master/docs/multimodal.md

Published capabilities are upstream claims; local results must be reported separately. Installation and testing status will be recorded in the accompanying model-upgrade results.

## Further infrared screening

IRGPT is a stronger match to real infrared semantics than an RGB-to-thermal generator: its authors describe a real-infrared training corpus and a released model. However, the official repository says its Google Drive weights link is unavailable and points to Baidu Netdisk; no Hugging Face checkpoint was found in this review. It remains an acquisition/integration candidate, not a connected expert. Source: https://github.com/WheatCao/ICCV2025-IRGPT

Infrared-LLaVA provides dataset and benchmark links in the official repository, but no directly usable model checkpoint was found there or in the Hugging Face model search. Its synthetic training images cannot establish measured physical temperatures. Source: https://github.com/threegold116/Infrared-LLaVA

AnyThermal has available compact thermal encoder weights (86.6M parameters). It produces features, not captions; adding a validated task head would be necessary before using it as an object or segmentation witness. Attaching its embeddings to an unrelated VLM without alignment training would not make that VLM thermal-aware. Source: https://huggingface.co/theairlabcmu/AnyThermal

MonoIR-RS is relevant to IR remote-sensing caption adaptation, but the paper's synthetic-IR training and lexical IR-cue measures do not demonstrate accurate physical heat interpretation. It is a research/data candidate, not a deployment recommendation based on those metrics. Source: https://arxiv.org/html/2607.06552v1

ThermEval is a useful next evaluation source because it tests modality, colormap sensitivity, counting and temperature reasoning separately. Its final project page reports persistent limitations and only marginal gains from prompting/fine-tuning; an older repository summary makes stronger SFT claims. Prefer the final paper/project results and test locally. Source: https://sustainability-lab.github.io/thermeval/

## Reproducing the selected model downloads/conversion

The pinned GGUF reasoner download is `runtime/node.exe scripts/setup-experts.mjs --reasoner-only`. It verifies upstream SHA-256 before publishing a final file and reuses completed segments on resume. `--earthdial-only` fetches the official satellite checkpoint and metadata; no flag fetches both. This script downloads models, not inference runtimes; the ordinary bootstrap supplies the runtime.

EarthDial conversion uses the official llama.cpp b11867 source (commit `f3269ef96aee8c9ec8a3a89a14025e33641827e3`), its `convert_hf_to_gguf.py`, matching `gguf-py`/`conversion` modules and converter requirements. The prototype's conversion environment is isolated under `work/`; inference uses the resulting GGUF files and needs no Python. The PowerShell helper `scripts/convert-earthdial.ps1 -Python <converter-python> -ConverterRoot <llama.cpp-source>` creates the model-specific projector and Q4_K_M weights. Conversion is not fine-tuning. Preserve source revision, quantization and checksums alongside any validation results. Do not redistribute weights without establishing their upstream terms.

A model card's similarly named benchmark can be misleading: Qwen's TIR-Bench appears under tool calling, and is not evidence of thermal-infrared competence. Thermal claims require a thermal evaluation, not a name match. Likewise, a model calling its own object count a measurement does not make it tool-measured: numerical generated claims remain provisional; actual product statistics stay in the deterministic measurement panel.

To reproduce the public diagnostic comparison after installing models and the test pack:

```
runtime/node.exe scripts/evaluate-experts.mjs baseline single
runtime/node.exe scripts/evaluate-experts.mjs qwen35 single
runtime/node.exe scripts/evaluate-experts.mjs earthdial single
runtime/node.exe scripts/evaluate-experts.mjs qwen35 council
```

Results are retained under `work/upgrade-<model>-<mode>.json`; completed scene IDs are skipped on resume. Use a different output path or move an existing run aside to intentionally rerun changed settings. Optional positional scene IDs replace the default public subset. Single passes use RGB when available; council runs keep all selected scene companions, so sensor-fusion council results are not a controlled same-input comparison with RGB-only singles. Keep that distinction in reported results. Models never receive dataset labels, captions or object-box references.

## Additional portable challenger

Gemma 4 E4B is being tested as a different-family general visual reasoner, not described as satellite-trained. The selected Unsloth Q4_K_M checkpoint and matching F16 projector are pinned in `scripts/setup-gemma.mjs`. Google recommends placing images before the task text and using temperature 1, top-p 0.95, top-k 64; the adapter supports that ordering while preserving explicit asset bindings. Its 1120 visual-token budget is separate from Qwen's image budget. Source: https://huggingface.co/google/gemma-4-E4B-it

MiniCPM-V 4.7 1B was installed and evaluated on 123 matched cases; the local scene-recognition diagnostic did not justify promotion over CapRL/EarthDial. Its language backbone is Qwen3.5-derived, so it must not automatically be counted as wholly independent from Qwen. The 35B-A3B version was also installed (official IQ3_M, roughly 15.4 GB decoder plus projector) and tested on a smaller hard subset and structured councils. It uses CPU expert offload on the 32 GiB laptop and has not shown a universal win. Low activated compute still requires storage/RAM for total weights. Source: https://openbmb.cn/docs/en/guides/minicpm-v/minicpm-v-4.7

Qwen3.5 decoding is also profile-specific: its official card recommends sampled decoding and a presence penalty, with different settings for thinking and non-thinking modes. Greedy baseline and detail/thinking diagnostics are retained separately from the later recommended-settings tests; they must not be merged into a single accuracy claim. Source: https://huggingface.co/Qwen/Qwen3.5-9B

## Current deployment discipline

Read MODEL_UPGRADE_RESULTS.md and specialist-candidates.json for the latest tested coverage. Quick caption exposes the first applicable scene interpretation directly. Council review retains that specialist reading visibly alongside the final result and records every actual model contribution. A later general model is not automatically authoritative: tests have shown it discarding correct EarthDial scene labels. The final-review prompt/architecture remains under evaluation. No trained adapter is activated solely because its loss fell.
