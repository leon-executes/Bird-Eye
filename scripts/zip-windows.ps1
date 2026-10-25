# Bird Eye · Parham (Leon) Faraji · leon-executes
param(
 [Parameter(Mandatory=$true)][string]$Stage,
 [Parameter(Mandatory=$true)][string]$Destination,
 [switch]$Store
)
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem
$base = [IO.Path]::GetFullPath($Stage).TrimEnd('\') + '\'
$dest = [IO.Path]::GetFullPath($Destination)
if ($dest.StartsWith($base, [StringComparison]::OrdinalIgnoreCase)) { throw 'ZIP destination must be outside its source directory' }
[IO.Directory]::CreateDirectory([IO.Path]::GetDirectoryName($dest)) | Out-Null
$partial = $dest + '.' + [Guid]::NewGuid().ToString('N') + '.partial'
$level = [IO.Compression.CompressionLevel]::Optimal
if ($Store) { $level = [IO.Compression.CompressionLevel]::NoCompression }
$stream = [IO.File]::Open($partial, [IO.FileMode]::CreateNew)
$zip = [IO.Compression.ZipArchive]::new($stream, [IO.Compression.ZipArchiveMode]::Create, $false)
try {
 # Do not emit "./" or "./path": Explorer's compressed-folder reader rejects that layout.
 foreach ($dir in [IO.Directory]::GetDirectories($base, '*', [IO.SearchOption]::AllDirectories)) {
  if ([IO.File]::GetAttributes($dir) -band [IO.FileAttributes]::ReparsePoint) { throw "Unexpected linked directory: $dir" }
  $relative = $dir.Substring($base.Length).Replace('\','/') + '/'
  $zip.CreateEntry($relative) | Out-Null
 }
 foreach ($file in [IO.Directory]::GetFiles($base, '*', [IO.SearchOption]::AllDirectories)) {
  if ([IO.File]::GetAttributes($file) -band [IO.FileAttributes]::ReparsePoint) { throw "Unexpected linked file: $file" }
  $relative = $file.Substring($base.Length).Replace('\','/')
  [IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip, $file, $relative, $level) | Out-Null
 }
} finally { $zip.Dispose(); $stream.Dispose() }
if ([IO.File]::Exists($dest)) { [IO.File]::Replace($partial, $dest, $null) }
else { [IO.File]::Move($partial, $dest) }
Write-Output "Created Explorer-compatible ZIP: $dest"

