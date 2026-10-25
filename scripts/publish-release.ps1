# Bird Eye - Parham (Leon) Faraji - leon-executes
$ErrorActionPreference = 'Stop'
$releaseRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../dist/github'))
if (!(Get-Command gh -ErrorAction SilentlyContinue)) { throw 'Install GitHub CLI and run gh auth login first.' }
$assets = @(Get-ChildItem -LiteralPath $releaseRoot -File)
if ($assets.Count -lt 15) { throw 'Incomplete public release set.' }
foreach ($asset in $assets) {
 if ($asset.Length -ge 2000000000) { throw 'Asset exceeds 2 GB.' }
 if ($asset.Name -match 'Personal|detector|thermal-addon') { throw 'Personal or detector asset refused.' }
}
& gh release create v1.0.2 --repo leon-executes/bird-eye --title 'Bird Eye 1.0.2' --notes-file (Join-Path $PSScriptRoot '../docs/RELEASE-1.0.2.md') @($assets.FullName)
if ($LASTEXITCODE) { throw 'Upload failed; inspect release state before retrying.' }
