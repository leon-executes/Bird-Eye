# Bird Eye release verification · Parham (Leon) Faraji · leon-executes
param([string]$ReleaseDirectory = 'C:\HOUSE\BirdEye\dist')
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.IO.Compression.FileSystem
$results = @()
foreach ($file in (Get-ChildItem -LiteralPath $ReleaseDirectory -Filter '*1.0.2*.zip' -Recurse)) {
 $zip = [IO.Compression.ZipFile]::OpenRead($file.FullName)
 try {
  $entry = $zip.GetEntry('PACKAGE-MANIFEST.json')
  if (!$entry) { throw "No package manifest in $($file.Name)" }
  $reader = [IO.StreamReader]::new($entry.Open())
  try { $manifest = $reader.ReadToEnd() | ConvertFrom-Json } finally { $reader.Dispose() }
  $checked = 0
  foreach ($item in $manifest.files) {
   $e = $zip.GetEntry($item.path)
   if (!$e -or $e.Length -ne $item.bytes) { throw "Missing or wrong size: $($item.path)" }
   if ($e.FullName.StartsWith('./') -or $e.FullName.Contains('../')) { throw 'Unsafe archive path' }
   if ($file.Name -notmatch 'Personal' -and $e.FullName -match 'hituav-thermal-detector\.(onnx|json)|yolov8n.*\.(pt|onnx)|ultralytics/') { throw 'Retired model/runtime found' }
   $stream = $e.Open(); $sha = [Security.Cryptography.SHA256]::Create()
   try { $actual = [BitConverter]::ToString($sha.ComputeHash($stream)).Replace('-','').ToLowerInvariant() } finally { $sha.Dispose(); $stream.Dispose() }
   if ($actual -ne $item.sha256) { throw "Digest mismatch: $($item.path)" }
   $checked++
  }
  $results += [pscustomobject]@{ archive=$file.Name; files=$checked; sha256_manifest='all match'; detector_edition=($(if ($file.Name -match 'Personal') {'separate optional provider'} else {'no detector weights'})); bytes=$file.Length }
  Write-Output "Verified $($file.Name): $checked file digests"
 } finally { $zip.Dispose() }
}
$results | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath (Join-Path $ReleaseDirectory 'RELEASE-1.0.2-VERIFICATION.json') -Encoding UTF8
