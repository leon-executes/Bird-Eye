# Optional external detector

Bird Eye 1.0.2 · Parham (Leon) Faraji / leon-executes

The public app contains a generic evidence client, not a detector. No detector checkpoint, Ultralytics package or detector service is installed by Setup models. An operator may separately run a compatible local provider. The personal edition supplies an independently launched example provider outside _internal.

## Personal edition

1. Extract the complete Personal-Full ZIP.
2. Double-click **Launch with detector.cmd**. It starts the separate CPU service, then Bird Eye. Closing that app stops the service started by this launcher.
3. Select HIT-UAV samples or import images as **TIR / Aerial thermal (UAV)**. Choose **Council review**.
4. Read the caption, **External detector** decisions, object overlays and **Models used**.
5. Compare without it by turning off External object evidence in Models and saving settings. Quick caption never requests the detector.

Opening Bird Eye.exe directly does not start the service. Enabled but unavailable evidence produces a visibly partial report. RGB, ground-camera, unknown-domain and satellite-scale thermal inputs are excluded from this provider's remit.

## Provider integration

The independent example is in [integrations/thermal-addon](../integrations/thermal-addon). It has its own package.json and MIT adapter licence. With Node 24 installed, run npm install there. Supply your own ONNX model and metadata as its README describes. Neither adapter nor app downloads detector weights. Copy service.example.json to service.json, replace the token with a random secret, then run node server.mjs.

In Bird Eye → Models, enable External object evidence, enter http://127.0.0.1:41731/v1/detect and the same token, then save settings. Remote addresses are refused. This protocol is deliberately narrow; other domains require separate validation.

## Contribution contract

POST /v1/detect; Authorization: Bearer TOKEN; application/json. Version 1 requests contain request_id, requested_contribution and one to four assets. Each asset has asset_id, oriented PNG base64, SHA-256 of those PNG bytes, width, height, TIR modality and aerial-thermal domain. No filesystem paths or reference labels are sent.

~~~json
{
  "schema_version": 1,
  "request_id": "echo-request-id",
  "model": {"name": "External thermal detector", "sha256": "64-hex-checkpoint-digest", "license": "provider-model-licence"},
  "results": [{
    "asset_id": "input-1", "image_sha256": "echo-image-digest", "width": 640, "height": 512,
    "proposals": [{"category": "person", "score": 0.76, "bbox_xyxy": [264, 92, 273, 107]}]
  }]
}
~~~

Replace example hashes with actual SHA-256 values. Supported classes: person, car, bicycle, other vehicle. Scores are uncalibrated model outputs. Boxes are oriented native pixel xyxy coordinates. At most 100 proposals per image; every submitted image must be accounted for. Empty results do not establish absence. Arbitrary provider prose is discarded.

## Evidence path

~~~mermaid
flowchart LR
  I[Image + hash] --> D[Separate detector]
  D --> V[Validate response]
  V --> L[Class / count / location ledger]
  V --> C[Original-pixel inspection sheet]
  C --> R[Focused morphology review]
  L --> M[Final master]
  R --> M
  A[Independent scene opinions] --> M
  M --> T[Explicit decisions + caption + findings]
~~~

The provider cannot supply the caption, temperatures, activity, intent or geothermal cause. All bounded proposals remain in the report; up to eight individual crops per image are shown alongside a context crop. Enlargements are not independent corroboration or added resolution.

Each object group gets a claim ID. Accepted or qualified groups must appear in final findings with source_claims. Missing contributions trigger repair and then incomplete status if still missing. Generic rejection lacking morphology, scale or location terms also triggers repair. This structural check cannot prove that a fluent reason is correct. A dedicated visible object-evidence section preserves proposals and decisions even when the master disputes them. No automatic count-to-caption injection occurs.

The app does not import or launch the provider. Its separate CPU session loads per request and is released afterward. The service rejects browser origins and requires a token. The client refuses redirects and validates image identity, dimensions, classes, scores and box bounds. Failures remain visible.

## Model provenance and terms

Example model: KissTheHabit/yolov8n-hituav-thermal-finetune, revision a521855673acbd56aff6eebb628e47353a208a7f, AGPL-3.0. Original checkpoint SHA-256: 168b8c0653e4ee1a39fdfc0fa809d910f63a5a2e8626380116ce2f8e5bae48d2. Local ONNX SHA-256: 41fb0506cd78d75715f7ff0206337d9a9daa74062a11359318da79b887be1759. Inference layers were fused during export; no local detector training occurred.

Process separation is an engineering boundary, not an assertion that AGPL obligations disappear. Public release assets exclude the checkpoint and service runtime. Personal archives remain separate. Model licences remain applicable.
