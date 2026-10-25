> Historical research record from the predecessor engine. The Bird Eye distributable sample pack and current release contracts are documented in SAMPLES.md, TRAINING.md and RELEASE.md.

# Validation results

Development check on 2026-10-24. This validates a working prototype; it does not establish expert accuracy or superiority of the council.

**Final caption-first run:** 18 assessments completed; 0 job failures; 0 partial reports. Nine scenes were run once in single mode and once in council mode. One private contact-sheet fixture is omitted from the public case table.

**Source tests:** 15 passed. Coverage includes image/mask handling, missing-value arithmetic, prompt reference isolation, evidence IDs, temperature and modality guards, cancellation, local model path confinement and the endpoint wire format. Seven live HTTP checks passed: health, asset serving, cross-origin rejection, token requirement, traversal rejection, private-settings exclusion and key masking. These are targeted checks, not a penetration test.

**Corpus verification:** all 96 scenes / 110 public/control panels passed file hash and dimension checks; all calibrated crops supplied valid statistics. Seven user rows / 28 private panels are additional inputs.

**Runtime:** Windows x64, RTX 5060 Laptop 8 GB; Ryzen AI 7 350; 32 GB RAM. GPU inference used Vulkan. A CPU-only miscellaneous-image smoke test also completed in 33.17 seconds (earlier prompt revision; backend compatibility check). A spot reading during a GPU run showed 4673 MiB total GPU memory used; this is not a measured model-only peak.

**Launch:** the packaged CMD was launched through the Windows shell, the server health endpoint responded, and the default browser opened the workbench. No installation or script-policy change was required. CPU and GPU workers released after their jobs. Other machines and operating systems were not tested.

| Public case | Single (s) | Council (s) | Council status |
|---|---:|---:|---|
| eurosat-000 | 2.36 | 6.69 | complete |
| rsicd-000 | 1.86 | 5.5 | complete |
| hituav-000 | 4.46 | 13.48 | complete |
| landsat-000 | 4.8 | 19.45 | complete |
| control-low-resolution | 3.38 | 10.14 | complete |
| control-misc | 2.15 | 6.05 | complete |
| s2-000 | 5.49 | 19.79 | complete |
| s1-000 | 6.77 | 27.55 | complete |

Timings include each report’s preprocessing and model calls. The first report of the batch also bears cold model startup; subsequent reports use a warm worker. These are single observations, not controlled repeated latency estimates. Roles share one model. Do not infer an accuracy improvement from successful completion or longer runtime.

## Caption examples from public scenes

- **rsicd-000:** An aerial view of a rectangular green soccer field with white markings, surrounded by paved areas and buildings on the left and right sides.
- **hituav-000:** An aerial view of a multi-lane road with vehicles and traffic signals, flanked by tree-lined medians and sidewalks, showing distinct shadows cast across the pavement.
- **control-misc:** A dark blue background displays a solid yellow circle on the left and a solid teal rectangle to its right, with the text 'NOT A SATELLITE IMAGE' in white at the top center.

## Qualitative audit and remaining limits

Assistant spot-checks found broadly useful coarse descriptions of a football pitch, roads, built-up land and the diagram control. This is not independent human review. Detailed object identity, land-use labels and physical causes can still be wrong. One concrete remaining error: the Landsat caption called small bright areas yellow markers, although the rendering pipeline added no markers. The test therefore does not pass a factual-perfection criterion. The application includes a human-review form; no unsupported human accuracy score is reported.

Earlier development runs exposed malformed JSON, false denials of known TIR modality, misuse of display entropy/intensity as physical evidence, and captions dominated by sensor metadata. Fixes add constrained output, modality checks, separation of display diagnostics from model evidence, and explicit human-facing caption instructions. Historical development reports are retained privately under work/development-reports when archived. These targeted improvements do not eliminate hallucinations.

On unverified grayscale panels, morphology can be described but sensor type, actual heat and generated provenance remain unknown. A thermal-looking rendering is insufficient evidence for geothermal claims. On paired calibrated inputs, consult the deterministic measurement panel even when prose contradicts it; the guardrails do not catch every possible wording of a physical error.

Do not publish a percentage-accuracy claim from this pack. Obtain independent, blinded human scoring and a contamination-aware geographic/sensor/time holdout before ranking models. Real EarthDial/SkySense integration, separately trained thermal specialists, broad OS/hardware tests and calibrated geothermal ground truth remain future validation work.
## Full-pack operational check

All 96 public/control scenes completed a single-pass captioning run with the 4B model: eight in the comparison set and the remaining 88 in the corpus sweep. No job failures were recorded. This is an execution-completeness result, not a caption-accuracy score. The 88 additional job records remain in work/corpus-validation.json and their reports remain in reports/.

The optional 8B upgrade was not fully downloaded or evaluated before computer use was stopped. The installed, tested default remains 4B. Setup quality model.cmd can resume the optional download; do not treat the quality option as validated yet. Final native UI interaction was interrupted, so the last browser-level check predates the final review/edit additions. Source tests passed after those changes.

## Semantic-caption correction

See CAPTION_STANDARD.md for revision 2026-10-24.6-semantic-scene. It changes scene-identification instructions, interleaves explicit labels with images and adds independent per-image opinions when no declared RGB anchor is available. Six supplied scenes were exercised; three also received a higher visual-token-budget experiment. Dune and striped/clouded-scene recognition remain unreliable with the bundled 4B model. The prior 96-scene run is an older-revision execution check, not proof of semantic accuracy. There are now 16 passing source regression tests.

## Superseding upgrade status — 25 October 2026

The earlier 4B/optional-8B status above is historical. Qwen3.5 9B, Gemma 4 E4B and a local EarthDial RGB conversion have since been compared; compact scene-ranking and thermal-detection witnesses were added. The default is now the 9B general reasoner, with the 4B baseline retained. See MODEL_UPGRADE_RESULTS.md for counts, failures and the precise limits of the detector metrics. The latest source suite has 33 tests; this remains separate from recognition evaluation.
