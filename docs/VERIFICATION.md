# Verification record — 25 October 2026

This record separates application engineering checks from model-quality claims.

## Automated checks

- 50 Node tests passed, including the original 45 engine tests and five desktop/import contract tests.
- Nine frozen engine-related source files match the predecessor SHA-256 baseline.
- HTTP checks cover origin rejection, missing mutation token, private settings exclusion, asset/artwork
  traversal, invalid/empty/oversized bulk requests and five-image single-task rejection.
- All 77 public sample panels were served with image MIME types.
- Official Electron, Node and llama.cpp download archives were checked against upstream SHA-256 digests.
- rcedit build-tool package was checked against its npm SHA-512 integrity value.
- Public source/desktop archives use sample and source allowlists; live imports/settings/reports are excluded.

## Native Windows checks

The dedicated Electron window was launched on Windows 11 x64 through desktop controls.
Single/Bulk menu navigation, the Earthrise theme, sample library, recorded assessment, native folder
selection, per-panel modality controls, grouped imports and local inference were exercised.

A selected parent containing two sample directories produced two tasks: one TIR panel and one RGB+TIR
pair. Explicit per-panel modalities survived import. The real Quick-caption batch completed 2/2 tasks
without task errors in approximately 46 seconds. Receipts identified Qwen3.5 for the standalone TIR task
and EarthDial for the RGB-first paired task. This verifies execution and provenance, not factual accuracy.

The standalone TIR output described a roadway intersection and surrounding greenery. The generic model
can still overinterpret thermal imagery. The paired Quick caption described many buildings and some green
farmlands; it did not establish the semantics of the thermal companion.

An additional public NASA Earthrise MISC task completed in 15.22 seconds through Qwen3.5:
“A cratered lunar surface rises in the foreground against black space, with a spherical Earth visible
above the horizon line.” Its exact report is included as a recorded example.

The saved Phoenix council assessment is an earlier real 91.48-second engine run; it is explicitly labelled
as recorded in the UI. The original caption is preserved, including uncertainty. It is not a new reference label.

## Previews and scope

README previews are captured from the running Windows application using its window-preview export.
The capture omits the pointer. They are actual UI and outputs, not illustrative mockups.
The desktop was also checked at reduced UI zoom; View offers zoom controls.

These checks were performed on one development laptop (RTX 5060 Laptop, approximately 31 GB RAM).
They do not certify all Windows versions, GPU drivers, remote endpoints, datasets or thermal use cases.
The model-quality findings and rejected training pilots are documented separately.


Native folder selection was additionally exercised through the final opaque-handle IPC path; two folders yielded two tasks and three file handles.
