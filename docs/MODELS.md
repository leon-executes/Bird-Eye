# Models and setup

The public desktop archive ships no model weights. It can browse samples and the recorded assessment immediately.
The personal full archive is a personal copy of the existing active weights and helpers.

## Public installation

Close Bird Eye. Run **Setup models.cmd** beside Bird Eye.exe. Setup restores all four council members: Qwen3.5, CapRL, EarthDial and RemoteCLIP. It uses twelve verified Zstandard parts (12.78 GB compressed; 13.56 GB restored). Put the parts beside the executable for offline setup, or download them from the configured GitHub release after it is published. Restart Bird Eye and inspect Models.

The language weights and matching vision projectors remain separate files. The installer verifies every compressed part and every restored model by SHA-256. The personal full ZIP already includes these files. It additionally provides a separate optional thermal detector; use **Launch with detector.cmd** to start that service and the app together.

## Active local configuration

| Role | Profile | Pinned checkpoint family |
|---|---|---|
| Satellite first witness | EarthDial 4B RGB Q4_K_M | akshaydudhane/EarthDial_4B_RGB |
| Additional RGB witness | CapRL Qwen3VL 4B Q4_K_M | internlm/CapRL-Qwen3VL-4B-GGUF |
| General lead / challenge / final | Qwen3.5 9B Q4_K_M | unsloth/Qwen3.5-9B-GGUF |
| RGB scene alternatives | RemoteCLIP ONNX | Optional, CPU |
| Aerial thermal candidate boxes | External HIT-UAV YOLOv8n ONNX provider | Personal add-on only, CPU |

Exact revisions, sampling and modality limits are in desktop/default-settings.json.
CapRL download hashes are in scripts/model-downloads.json; reasoning-model hashes are embedded in
scripts/setup-reasoner.mjs. Engine receipts identify the actual files and adapter when used.

## EarthDial and optional helpers

Distribution basis: the release owner accepts the official EarthDial project MIT licence as covering its linked checkpoint. Preserve the upstream copyright and licence.
The model parts contain the tested GGUF conversion and its matching projector; end users do not need to convert it.
The prior setup/conversion scripts are retained as research tooling; they are not a one-click public
installation guarantee. Do not replace the projector with an unrelated model's file.

RemoteCLIP distribution uses the official project Apache-2.0 licence as the basis for its linked checkpoint.
The AGPL HIT-UAV detector is excluded from the public app and model parts. A separately started provider is included only in the personal full ZIP and connects through the optional evidence gateway.
The public lightweight package still excludes all weights. See COUNCIL_ABLATION.md for replacement tests.

The tested local default uses no LoRA. Two adaptation pilots were rejected. Bigger checkpoints and
specialist branding did not consistently improve the measured cases. See TRAINING.md and
MODEL_UPGRADE_RESULTS.md rather than inferring competence from a profile's role label.

## Endpoints

Models can connect to a vision Chat Completions endpoint. Enter the exact served model ID, URL and
supported modalities in the model configuration. A nonlocal host requires HTTPS and allowRemote=true.
That option sends the selected images to the configured service. Local endpoint processes and their
memory are managed by the operator, not by Bird Eye.

Remote access is not necessary for the local-full installation. API keys are stored only in local-settings.json,
which is excluded from public archives. Do not commit that file.

