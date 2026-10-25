# Release policy

Original code is PolyForm Noncommercial 1.0.0. This is a source-available noncommercial license,
not an OSI open-source license. Third-party licenses are unchanged.

## Artifacts

- **BirdEye-1.0.0-Windows-x64.zip**: public desktop distribution; runtimes, cited samples and recorded
  example included; model weights excluded.
- **BirdEye-1.0.0-Source.zip**: GitHub-ready source, tests, documentation, artwork and cited samples;
  no runtime binaries, model weights, private imports, settings, logs or private reports.
- **local-only/BirdEye-1.0.0-Windows-x64-Local-Full.zip**: personal ready-to-run installation with the
  existing active local weights. Do not upload this archive as a public release: EarthDial and
  RemoteCLIP weight redistribution terms remain unresolved, and the optional detector has separate terms.

Every ZIP is written under dist. The runnable local staging folder is portable/Bird Eye.
SHA256SUMS.txt records ZIP digests; each desktop package also includes a per-file manifest.

## Build

Use Node 24 on Windows x64. Install the locked npm dependencies with npm ci.
Run scripts/setup-runtime.mjs to fetch verified Node and llama.cpp binaries.
Run scripts/download-desktop.mjs to fetch the pinned official Electron release and verified art/license assets.
Run scripts/download-build-tool.mjs to fetch the integrity-checked resource editor.
Run scripts/render-icon.mjs, then node --test tests/*.test.mjs.
Run node scripts/build-desktop.mjs. Add --local-full only on a machine with all default local models present.

The build verifies the caption-engine baseline before packaging. It uses explicit allowlists for samples
and source files. The private data/imports.json and live reports directory are never copied.
Source includes only data/examples reports deliberately selected from public samples.

The desktop executable receives the original seven-resolution ICO plus product/version/author metadata.
It is unsigned. The runtime SHA-256 is checked against Electron's official release checksums.
Compilation/build dependencies do not become new inference dependencies.

GitHub publication is a separate step. No repository, release or upload is created by this build.
GitHub release asset size limits make the local full archive unsuitable even aside from its model terms.

