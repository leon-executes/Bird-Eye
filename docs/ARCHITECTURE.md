# Bird Eye engineering architecture

## Separation of responsibilities

Bird Eye 1.0 changes presentation and desktop orchestration around the existing caption engine.
Nine engine-related source modules are frozen by SHA-256. The server adds persistent batch task lists,
validation before enqueue and a bounded bulk endpoint; it invokes the same runCouncil function and settings.

Electron owns the window, application menu, download dialogs and service process. It starts bundled Node
with COUNCIL_PORT=0 and waits for a machine-readable ready line. The server binds only 127.0.0.1, obtains an
ephemeral port and issues a fresh session token. The renderer has nodeIntegration disabled, contextIsolation
enabled and Chromium sandboxing enabled. Its preload exposes quit, open-reports, navigation, native selection and reads of opaque file handles created by that selection. The renderer cannot supply arbitrary filesystem paths. Native folder enumeration skips symbolic links and caps selected files at 1,000.

IPC validates the owning WebContents and its frame origin. The shell denies renderer permissions and
prevents navigation away from the local service. External source links use the system browser.
A content security policy restricts scripts and connections to the app origin. Dynamic strings are escaped
before entering HTML. Imported files go through a bounded JSON/base64 transport and Sharp decode limits.

This is protection against unintended browser-origin access, not an authentication boundary against a
hostile process already running as the same Windows user. The session state is readable on loopback.
Remote model endpoints are an explicit separate configuration; the engine requires HTTPS and allowRemote
for nonlocal hosts. API keys are kept out of UI state and release archives.

## Process and memory ownership

One desktop process owns one service process and one window per installation profile. A second launch
focuses the existing instance. The service owns local llama.cpp workers; native model launch hides consoles.
Engine release awaits actual worker exit before replacement, including cancellation paths. Optional ONNX
encoders are small CPU helpers and are not counted as independent heavy VLM instances.

Window close requests service shutdown, aborts active work and waits for its exit before terminating the
owned service if needed. Completed reports remain on disk. Forced OS termination may interrupt the current
file write or leave a compute lock; operators must inspect lock ownership rather than deleting it blindly.

Model endpoint processes are external and are not terminated by Bird Eye. Model memory checks are guards,
not a universal admission-control guarantee. Quantization size is not equivalent to required VRAM.

## Evidence pipeline

1. **Inspect.** Preserve original imported bytes and SHA-256. Create orientation-normalized PNG display
   assets. Read known manifest metadata and product sidecars. Display statistics remain display statistics.
2. **Route.** Match supported modalities and declared acquisition domains. The RGB specialist receives RGB;
   aerial thermal object proposals require the appropriate declared domain and suitable scale.
3. **Observe.** Obtain a first satellite reading, applicable independent caption proposals and optional
   helper evidence. Caption-only models contribute scene hypotheses, not structured adjudication.
4. **Challenge.** A general reasoning role sees relevant imagery and accumulated claims. Repetition by a
   related model is correlated evidence, not a new independent observation.
5. **Adjudicate.** The claim ledger requires explicit decisions. Missing, duplicate or invented claim IDs
   remain incomplete. Qualified source claims cap confidence; rejected sources cannot support final findings.
6. **Guard and persist.** Deterministic evidence checks remove unsupported numeric temperature assertions,
   prohibit uncalibrated brightness from becoming temperature evidence, and retain warnings, failures and
   incomplete coverage. Save caption, passes, measurements, decisions, model receipt and review metadata.

These checks reduce specific failure modes. They do not prove semantic correctness. The saved first
specialist reading remains visible when it differs from the final synthesis.

## Quick caption and council review

Quick mode chooses the first applicable configured model and makes a direct caption call. RGB-only
coverage is disclosed when thermal companions were selected. It is the default efficient path.

Council mode adds applicable observation, challenge and synthesis stages. Some roles reuse Qwen, so
stage count is not model count. RemoteCLIP generates competing scene labels; its rankings
are not a substitute for image-grounded interpretation. The AGPL detector was removed in 1.0.1.
If a specialist fails, the normal engine fallback path is retained and its failure appears in the receipt.

## Import and bulk contracts

Single import accepts one to four files, each at most 10 MB, with a 40-million-pixel decode ceiling.
The importer does not reconstruct radiometry from an arbitrary TIFF. Original bytes are retained,
but calibrated products require sidecars and explicit provenance in the manifest.

Bulk planning is a pure function over file names, relative paths and sizes. Individual mode creates a task
per supported file. Folder mode groups only by each file's immediate containing directory. It does not
merge nested directories or infer semantic relevance. Overfull groups make the whole plan invalid.
Non-image files are enumerated as ignored. Up to 1,000 selected files are accepted.

Bulk import uses the same single-scene import API sequentially. Each successful scene becomes durable.
The UI tracks completed import groups in memory so an in-session retry does not duplicate them.
The selection itself is not persisted across app restarts.

Before inference, the controller resolves every task and validates its selected assets. It saves the task
list, then checkpoints after each completed task. Errors are per-task and do not silently terminate later
tasks. A batch still marked running without an active controller is shown as interrupted. Resume derives
the unfinished scene/mode pairs from recorded report IDs and submits a new job. Each report preserves the
actual model configuration used; changing configuration between runs therefore remains auditable.

## Disk layout

~~~text
Bird Eye.exe
resources/app/                 Electron bootstrap
_internal/
  app/                         UI, service and preserved caption engine
  desktop/                     shell, narrow preload, default profiles
  runtime/node.exe             bundled Node
  runtime/llama-cpu/            CPU inference runtime
  runtime/llama-vulkan/         GPU inference runtime
  node_modules/                locked production dependencies
  artwork/                     original SVG/PNG/ICO and NASA photograph
  data/manifest.json           cited public examples
  data/examples/               explicitly marked recorded public reports
  data/imports.json            local imports; never released
  models/                      local weights; absent from public ZIP
  reports/                     per-scene outputs and batch checkpoints
  logs/                        local service/model diagnostics
  local-settings.json          local configuration; never publicly packaged
  desktop-state/               local Chromium profile
~~~

The source checkout uses these same application directories directly at its root.
No registry installation or administrator privilege is required. All runtime writes are confined to
the extracted writable application tree in normal operation; source links and native save dialogs
can write/open locations the user explicitly selects.

## Build and provenance

The desktop runtime is pinned by version and official SHA-256. The resource editor package is verified
against its npm integrity digest. Package manifests hash shipped files. Source/data packaging uses
allowlists, rather than copying the live reports or imports trees. Public and personal weight-inclusive
archives are separated. Engine baseline verification runs before build.

The Windows icon is rendered from an original SVG into 16, 24, 32, 48, 64, 128 and 256 pixel PNG-backed
ICO frames. Transparent PNG and SVG remain available for README and application use.
Window previews use Electron desktop capture thumbnails, excluding the cursor; they are not mockups.

## Known limits

No universal IR/geothermal competence is established. Unknown metadata stays unknown. A 30 m raster grid
does not imply 30 m native thermal optics. Scene labels and detections can be wrong. External endpoints,
GPU drivers, available memory and model conversion compatibility vary by machine. Evaluation reports
retain those limits rather than converting a selected sample result into a general performance claim.

