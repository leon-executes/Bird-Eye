# Third-party notices

Original Bird Eye application code is PolyForm Noncommercial 1.0.0. This does not relicense its data, models, runtimes or dependencies.

- Qwen3-VL-4B-Instruct GGUF and projector: official Qwen distribution, Apache 2.0; pinned revision in `models/manifest.json`. Preserve the model license when redistributing weights.
- llama.cpp b11867: MIT. Native binaries include their own dependency obligations; retain accompanying files when copying `runtime/`.
- Node.js v24.19.0: Node license includes bundled third-party notices, retained under `docs/licenses/`.
- npm packages: versions/licenses are inventoried in `docs/dependency-licenses.json`; copied available license/notice texts are in `docs/licenses/`. Original package files remain in node_modules. This inventory is not a legal audit.
- EuroSAT: upstream/mirror license and citation retained in the dataset manifest; mirror declares MIT. Cite the original EuroSAT work.
- RSICD: mirror lacks a clear redistribution license. Downloaded imagery is local evaluation material and is excluded from the source ZIP. Check original imagery/provider rights before redistribution.
- HIT-UAV: current upstream repository indicates CC BY 4.0; retain author/source attribution. Earlier publication statements can differ; use the current source terms and verify before distributing a derived release.
- Landsat: USGS imagery is public-domain US Government data; retain product/source attribution and calibration provenance.
- Sentinel: contains modified Copernicus Sentinel data (2024), accessed via Microsoft Planetary Computer. Preserve Copernicus attribution and consult the collection's linked license/terms before redistributing crops.
- User imagery: no rights inferred; excluded from source exports.

The public source archive includes only the cited sample pack and recorded public examples. It excludes model/runtime binaries, personal imports and live reports. The public desktop archive also includes runtime binaries and their notices, but no model weights. Model parts redistribute the reviewed council roster separately with upstream terms. The personal archive additionally contains the optional AGPL thermal weights and is excluded from public uploads.

- Qwen3.5-9B and Gemma 4 E4B: upstream model cards declare Apache 2.0. Quantized files are from Unsloth; pinned revisions and SHA-256 digests are retained locally and in download scripts. Preserve upstream notices if redistributing.
- EarthDial 4B RGB: official project MIT licence applied to its linked weights under the release owner's reviewed distribution decision. Preserve upstream notices and identify the local GGUF conversion.

- ONNX Runtime Node 1.30.0: MIT; dependency notices refreshed after installation.
- RemoteCLIP: official project Apache-2.0 licence applied to its linked weights under the release owner's reviewed distribution decision. Preserve notices and identify the local ONNX conversion.
- HIT-UAV YOLOv8n: no checkpoint or detector runtime in public app/model parts. The personal 1.0.2 package includes a separate ONNX provider and AGPL-3.0 weights. Public source includes original MIT adapter code only. No Ultralytics runtime is bundled. See EXTERNAL_DETECTOR.md. HIT-UAV sample images remain CC BY 4.0.
- Optional adapter training uses separate PyTorch/Transformers/PEFT/bitsandbytes tooling; its environment, data, base weights and adapter artifacts are excluded from source export.

- CapRL Qwen3VL 4B: official InternLM native and GGUF repositories declare Apache 2.0. Exact pinned revisions and per-file hashes are in `scripts/model-downloads.json`. Caption RL training does not establish remote-sensing or thermal validation.
- MiniCPM-V 4.7 1B and 35B/A3B: official OpenBMB repositories declare Apache 2.0. Use their model-specific projector and retain notices. The large IQ3_M file is an official quantization; it still requires substantially more system RAM than a 3B dense model.
- TerraSense: official CASM checkpoint metadata declares Apache 2.0; the tested Q4_K_M artifact is a third-party mradermacher conversion. Preserve upstream and converter provenance. Self-reported training claims are separate from local validation.
- NWPU captions: downloaded mirror did not establish redistribution permission. Local corpus and adapted weights are excluded from the source export. Establish original imagery and derived-weight release rights separately before publishing those assets.
- IR-TD early public release: academic research use only, with underlying dataset terms. Downloaded raw labels were rejected for training after audit. No redistribution permission is inferred from public download availability.

- Electron 45.0.0: MIT with Chromium and bundled component notices. The full LICENSE.electron and LICENSES.chromium.html are retained in the desktop package. Official release digest in desktop/runtime-lock.json.
- Earthrise photograph: NASA / Apollo 8; original source and usage links in NOTICE. Background crop only. Original Bird Eye SVG/ICO is independently created artwork.

## Interface fonts

Manrope and Source Sans 3 are bundled under the SIL Open Font License 1.1. Upstream: https://github.com/google/fonts/tree/main/ofl/manrope and https://github.com/google/fonts/tree/main/ofl/sourcesans3. Original font files are unmodified; notices are in docs/licenses/Manrope-OFL.txt and SourceSans3-OFL.txt.
