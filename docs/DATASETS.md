> Historical research record from the predecessor engine. The Bird Eye distributable sample pack and current release contracts are documented in SAMPLES.md, TRAINING.md and RELEASE.md.

# Dataset provenance and test design

The pack is deliberately stratified for engineering coverage. It does not estimate general satellite or geothermal accuracy. There are 96 public/control scenes and 110 image panels. The seven user contact-sheet rows are private, unlabelled examples, not benchmark ground truth.

| Dataset | Actual downloaded subset | What can be tested |
|---|---|---|
| [EuroSAT](https://github.com/phelber/EuroSAT), mirror `timm/eurosat-rgb` | First three examples per class found in first 400 test rows; ten classes; 30 RGB 64×64 tiles | Coarse land cover and limitations at low resolution. Labels are classes, not captions. |
| [RSICD](https://github.com/201528014227051/RSICD_optimal), mirror `caglarmert/RSICD-captions` | Up to two examples per keyword stratum in first 100 test rows, capped at 30; five reference captions where present | Caption content, confusing land use and unsupported detail. This selection is not random. |
| [HIT-UAV](https://github.com/suojiashun/HIT-UAV-Infrared-Thermal-Dataset) | 18 test frames selected across filename-derived day/night, altitude and camera-angle groups | Real uncalibrated thermal morphology, objects, modality discipline. It does not establish orbital-scale thermal capability. Object boxes are references for manual review; detector metrics are not computed. |
| [Landsat C2 L2](https://planetarycomputer.microsoft.com/dataset/landsat-c2-l2) | Six 256×256 RGB/ST crops: Phoenix, Imperial Valley, Salton Sea, Yellowstone, Rotterdam, Amazon | Registered optical/thermal evidence, different environments and temperature statistics. No geothermal-cause truth labels. |
| [Sentinel-2 L2A](https://planetarycomputer.microsoft.com/dataset/sentinel-2-l2a) | Four 256×256 TCI/B08 pairs, June 2024 | Near-infrared versus heat confusion, same-acquisition spatial relationships. B08 is percentile-stretched DN, not a temperature or quantitative reflectance product. |
| [Sentinel-1 RTC](https://planetarycomputer.microsoft.com/dataset/sentinel-1-rtc) | Four 256×256 VV/VH pairs, June 2024 | Radar texture and modality discipline. 10 m grid is not a 10 m independent resolving element. |
| Project controls | Blur, 32×32 degradation enlarged to 224×224, inverted RGB, synthetic shapes/text | Robustness and out-of-domain routing. Derived controls share their parent's evaluation group. |

The Sentinel contexts are Rotterdam, Imperial Valley, Amazon and Yellowstone. Sentinel-2 selection uses lowest scene cloud metadata among the first 30 returned items; SAR uses the first suitable item. These are not co-registered multi-date truth sets. Do not treat them as observations simultaneous with the Landsat crops.

The manifest records source URLs, repository revisions where available, source IDs, selection details, split/group, per-image SHA-256, dimensions, modality and licenses. Landsat/Sentinel source STAC documents are retained. Range reads avoid downloading full satellite scenes. Re-running live mirror/STAC recipes may return different versions; preserve the downloaded manifest and hashes to identify the exact evaluated pack. Download errors are recorded; recovered initial failures are retained as download history rather than current failures.

## Landsat temperature calculation

For valid Collection-2 surface-temperature pixels:

`temperature_C = ST_DN × 0.00341802 + 149 − 273.15`

This is the product's surface-temperature scaling, not a conversion of displayed grayscale. [USGS scale-factor documentation](https://www.usgs.gov/faqs/how-do-i-use-a-scale-factor-landsat-level-2-science-products).

Mask fill, dilated cloud, cirrus, cloud, cloud shadow and snow (QA_PIXEL bits 0–5), zero ST and nonzero QA_RADSAT where available. The QA mask is not proof that all contamination is gone. Display uses 2nd–98th percentile stretching; invalid pixels are black. Raw valid temperature arrays are stored separately. ST_QA, when available, uses its product scale for uncertainty. Spatial percentile spread is not measurement uncertainty. Output grid is 30 m; native TIRS resolution is approximately 100 m. Product emissivity and atmospheric assumptions can introduce errors. A warm pixel cannot by itself establish geothermal activity.

RGB Landsat rendering uses the documented surface-reflectance scale/offset followed by an explicit display stretch and gamma. Sentinel-2 uses official TCI for RGB and a separate B08 DN stretch. No NDVI or quantitative reflectance inference is implemented for that NIR display. Sentinel-1 uses `10*log10(gamma0)` and a fixed −30 to +5 dB display stretch; raw crop backscatter arrays are retained. Its effective source resolution is about 20–22 m despite the 10 m grid. Speckle, incidence geometry, moisture and surface roughness constrain interpretation.

## Evaluation rules

- Keep `group` intact when adding train/validation/test splits. Controls and parent images are one group.
- Existing public test splits may have been seen during model training. These are engineering checks, not a contamination-free held-out benchmark.
- Compare single and council with identical selected images. Compare accuracy/usefulness per scene, not fluency or the number of claims.
- Count unsupported claims, missed important features, spatial errors and thermal errors. Record usefulness 1–5 and reviewer notes. Review against original pixels, references and metadata.
- Caption token F1 and literal class mention are transparent lexical diagnostics. They are not semantic accuracy, confidence calibration or a defensible model ranking.
- No human captions exist in this pack for the Landsat/Sentinel crop set. Radiometric consistency and visual review are the available checks.

Gaps for a serious next benchmark: true multi-date change labels, hyperspectral cubes, SWIR, orbital night thermal, adverse cloud/snow cases, calibrated LWIR camera sequences, independent geothermal ground truth, rare landforms, object localization/counting and non-English captions. Increase geographic/sensor/time diversity before publishing accuracy claims.

## Specialist and domain-adaptation data acquired on 25 October 2026

The original 96-scene pack remains the compact engineering pack. Six unlabelled IR-TD ground-camera stress images were additionally registered in the local library. They are not human caption ground truth. Downloaded training corpora are separate from that small app library.

| Corpus | Acquired | Curated training use | Held-out use |
|---|---|---|---|
| NWPU captions, pinned `caglarmert/NWPU-captions@80bbaf1ef145c7279b1e2de933689c8add174606` | 31,500 RGB images / official splits | 25,168 images after screening; eligible original human captions | Official validation/test preserved; 45 fresh test cases in matched comparison |
| HIT-UAV, pinned `669259659b21a2737ca9f5e4bc81892acbe6ecd8` | 2,029 train, 290 validation, 579 test images and human object boxes | 1,348 training images after near/exact duplicate and empty-target exclusion | 48 validation and 40 additional test examples selected; original 18-frame detector check retained |
| IR-TD early public release | 84,284 images and corresponding descriptions, five archive parts | **No raw description training**: local audit found unsupported colors, text, identities and motion | Six fixed ground-camera thermal stress cases; no claimed gold captions |

The prepared 50,000-pair pool contains **26,516 unique images**: 25,168 RGB and 1,348 aerial thermal. Alternate human NWPU captions supply additional distinct pairs; they do not create new images. There are 48,652 RGB pairs and 1,348 thermal pairs. The pool is RGB-heavy and cannot establish broad thermal competence by volume alone. Acquisition, preparation and train/held-out hashes are retained under `data/domain-adaptation/`.

The pilot contains 2,048 unique training images (1,024 RGB + 1,024 aerial thermal), 64 validation images, and 61 development evaluation cases covering official test images, private contact-sheet crops, ground thermal, radar and a miscellaneous diagram. References are withheld from inference. They are available to the training loss only in the proper training split, and to validation loss in the validation split.

Exact SHA-256 and 64-bit difference-hash distance <=4 screening reduces image duplication; it does not establish capture-sequence, geographic or pretraining independence. HIT-UAV target captions describe human-annotated object classes, counts and relative positions, not independently authored background descriptions. Empty annotations were excluded from training, so this pilot is not a test of reliable object absence.

NWPU mirror redistribution rights remain unresolved; use the corpus locally and do not publish its image bytes. IR-TD's early release is academic-research-only and remains subject to underlying dataset rights. The label audit triaged 18,394 rows by regex, but that is **not** an error-rate estimate: only six images were visually inspected for the audit. See `scripts/audit-irtd.py` and the retained local audit record. Official source: https://github.com/WheatCao/ICCV2025-IRGPT .

## Revised semantic training pool

`prepare-semantic-targets.py` creates a second, stricter pool: 50,000 distinct image/caption pairs over **25,004 unique images**, with 48,652 RGB pairs and 1,348 aerial thermal pairs. There are 23,656 unique RGB images. This supersedes the earlier 26,516-image pool for the revised training launcher; both manifests are retained separately. The 2,048-image revised pilot is balanced between RGB and thermal. Thermal labels are derived from human class/box annotations and no longer include exact counts; they are not human-authored descriptions of the full scene. RGB filtering is rule based, not a human factual review. Raw IR-TD captions remain excluded from training. The 61-case development evaluation is unchanged.

Thirty additional HIT-UAV test frames are reserved in `prospective-thermal-evaluation.json` before predictions from the revised adapter: six each with no target boxes, bicycles, mixed classes, people and vehicles. Exact-byte and dHash<=4 exclusions cover the full revised training pool, validation, previous tests and private imagery. This is a deliberately balanced stress subset, not a population sample. Empty annotations test unsupported object mentions but do not prove absence of every possible object. `evaluate-domain-candidate.py` can compare the frozen native base and adapter on this separate manifest after training has released the GPU; references never enter the prompt.
