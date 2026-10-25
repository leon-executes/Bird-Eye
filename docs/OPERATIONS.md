# Bird Eye operating guide

1. Extract the complete Windows x64 ZIP to a writable local folder.
2. Open **Bird Eye.exe**. Keep the executable, runtime files and _internal folder together.
3. Choose a built-in sample, or use **Single → Import 1–4 related images**.
4. Declare RGB, TIR, NIR, SAR, MISC or UNKNOWN for each panel. Set domain and thermal polarity only when known.
5. Select **Quick caption** or **Council review**, then **Caption image**.
6. Read the caption, the competing specialist reading when present, and **Models used**.
7. Expand observations, measured evidence and the review trail as needed. Export Markdown or JSON.

The public desktop ZIP opens without a model download. It includes a clearly marked recorded example.
New inference requires local model files or a configured endpoint. The local-only full ZIP already contains
the active local models. It is not a cleared public distribution of those weights.

## Bulk

**Individual images** creates one caption task per image, including images found recursively under a chosen folder.

**Grouped folders** creates one task for each directory that directly contains supported images.
For example, trip/site-a/RGB.png and trip/site-a/TIR.png form one task; trip/site-b/image.png forms another.
A nested folder remains a separate task. Images in the selected parent are their own group.
Folders with more than four supported images reject the import plan. Nothing is silently split or dropped.

Choose files or a folder. Review every group. Set the default modality, then override individual panels
when a group mixes RGB and IR. Domain and polarity are common import defaults; use separate imports
for different known domains or polarities. UNKNOWN is preferable to guessing.

Click **Import tasks**, then **Run imported tasks**. Import is sequential and can stop between tasks.
An interrupted in-session import can retry remaining groups without duplicating successful groups.
After a full app restart, imported scenes remain in the library; the unsubmitted file selection does not.

Caption batches save their task list before starting and checkpoint after each task. **Cancel** stops
the active computation and retains completed reports. **Resume unfinished** skips tasks with recorded
reports and retries failures or remaining tasks. A crash during an individual task may require rerunning
that task. Configuration is read at execution time; a resumed batch can use a changed model setup,
which is recorded in each resulting receipt.

**Export JSON** in Batch history includes the job record and completed reports. Per-scene Markdown
and JSON remain available from Single and Evaluation. **File → Open reports folder** opens the files.

## Input limits

PNG, JPEG, WebP and TIFF. One to four panels per task. Ten MB per file, 40 million decoded pixels.
Bulk selection is limited to 1,000 files. TIFF orientation is normalized for display; the simple importer
does not preserve geospatial calibration as an inference product. The original bytes and SHA-256 are kept.
Use the documented manifest and sidecar format for calibrated temperature or radar products.

A visible four-panel contact sheet is one image unless you split it yourself. The app does not infer panel
boundaries or fabricate registration. Thermal-looking or generated views should be declared accurately.

## Controls

| Control | Action |
|---|---|
| Ctrl+1 | Single workspace |
| Ctrl+2 | Bulk workspace |
| Ctrl+O | Import related images |
| Ctrl+Enter | Run the selected single task |
| Ctrl+Shift+P | Save a cursor-free native window preview |
| View menu | Zoom, full screen, models, evaluation and sources |
| File → Exit / window close | Stop local work and close the owned engine |

## Models and memory

Use Models to inspect profiles, roles and the local backend. Vulkan is preferred; the engine can fall
back to CPU when its checks allow. Local GGUF workers are released before a different heavy model loads.
Externally managed endpoints retain their own memory policy. Related models or repeated roles are not
independent scientific measurements.

The shipped local configuration uses EarthDial first for RGB, CapRL as an additional RGB witness, and
Qwen3.5 9B for structured review. Quick RGB captioning uses the first applicable model and does not
interpret a thermal companion through an RGB-only specialist. Review the coverage note.

No internet is needed after the local assets are installed. Explicitly configured remote HTTPS endpoints
send images to that endpoint. Default execution is local; there is no telemetry service.

## Recovery

- **Model setup pending:** install the named GGUF and matching projector, or connect a local endpoint.
- **Insufficient memory:** close other workloads; use Quick caption or CPU only where available.
- **Failed task:** inspect the saved error and model receipt, correct the cause, then resume.
- **Stale compute lock:** verify the recorded process and workload before changing a lock. Never delete
  a lock merely because restricted process enumeration cannot see its owner.
- **Read-only folder:** move the extracted application to a writable location. Do not run from inside ZIP.
- **Unsigned executable:** this build has no signing certificate. SHA-256 manifests identify the provided files.
- **Missing native DLL:** re-extract the whole archive; do not copy only Bird Eye.exe.

This release was exercised on one Windows 11 x64 / RTX 5060 laptop. Other hardware remains unverified.

