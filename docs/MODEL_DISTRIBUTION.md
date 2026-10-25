# Complete council distribution

Release v1.0.2 · https://github.com/leon-executes/bird-eye

Upload only dist/github. The public portable ZIP contains the desktop app, runtime, cited samples, notices and model installer. The source ZIP contains code, tests and a separate provider example. Twelve .zst parts contain all EarthDial, Qwen3.5, CapRL and RemoteCLIP weights/projectors. None contains the thermal detector.

The dist/personal ZIP contains all council models and a separate optional detector provider, weights and connection settings. It runs without model downloads. Exclude that archive from public uploads.

## Installation

Extract the Windows ZIP. Run Setup models.cmd. It checks for parts beside Bird Eye.exe before downloading the pinned v1.0.2 GitHub release. For offline setup put all twelve .zst parts beside the executable. No Python, 7-Zip or system Node is needed. The embedded manifest verifies every part and restored file.

Parts are independent standard Zstandard frames. Raw slices are at most 1,900,000,000 bytes. Each output is checked below 2,000,000,000 bytes, safely below GitHub's 2 GiB limit. The installer concatenates decompressed slices. Do not use Extract All on .zst parts. The app ZIP is an ordinary Explorer-compatible ZIP.

No additional quantization was applied. Restored files match the evaluated GGUF/ONNX bytes exactly. Compression affects download storage, not accuracy or inference RAM. The bundled executable remains Windows x64; the Node compression protocol is cross-platform, not a claim that the executable runs on every device.

## Measured compression

Compared gzip 1/6, Zstandard 3/9, Brotli 4 and XZ/LZMA2 6. All six passed exact round trips on four stratified 32 MiB model samples. See evaluation-1.0.2/compression-samples.json.

Zstandard 3 was chosen for speed, bounded streaming memory and built-in decoding in Node 24. XZ was smallest on the samples, but encoded at 12–18 seconds per 32 MiB and decoded at 0.5–1.8 seconds. Zstandard 3 took about 0.07–0.09 and 0.05–0.07 seconds respectively. Gzip has broader shell compatibility; the supplied installer avoids requiring native Zstandard support.

Whole files: **13,555,008,264 → 12,782,865,035 bytes (5.7% smaller)** across 12 parts. Largest part: **1,874,280,346 bytes**. Sample savings substantially overestimated Qwen's whole-file savings, demonstrating why complete-file testing matters. Every finished part was restored and every full model SHA-256 matched. Details: desktop/model-parts.json and evaluation-1.0.2/compression-full.json.

Rebuild with node scripts/pack-models.mjs. Installation is sequential. Verified completed downloads survive retry; incomplete HTTP parts restart. Existing models are skipped only after full hash verification. A crash can leave work/model-downloads/install.lock: close setup before removing that stale lock. Incomplete .installing files restart. Allow about 30 GB free for parts, restored models and app; retaining other archives needs more.

## Publication

Release URL: https://github.com/leon-executes/bird-eye/releases/download/v1.0.2/ . Tag and filenames must match. Upload every file from dist/github as release assets. Commit the source ZIP contents separately, excluding dist, models, work, runtime and private reports. The model manifest is shipped inside the app; do not substitute unsigned alternate manifests downloaded from elsewhere.

Primary references: [GitHub release limits](https://docs.github.com/en/repositories/releasing-projects-on-github/about-releases), [Node compression](https://nodejs.org/api/zlib.html), [7z/LZMA2](https://www.7-zip.org/7z.html).
