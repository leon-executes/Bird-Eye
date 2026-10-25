param([Parameter(Mandatory=$true)][string]$MergedModel, [Parameter(Mandatory=$true)][string]$Name, [string]$Python = 'work/convert-env/Scripts/python.exe', [string]$ConverterRoot = 'work/llama-source')
$ErrorActionPreference='Stop'
Set-Location (Split-Path $PSScriptRoot -Parent)
if ($Name -notmatch '^[A-Za-z0-9_-]+$') { throw 'Name must contain only letters, digits, underscores and hyphens.' }
$modelRoot = [IO.Path]::GetFullPath('models')
$source = [IO.Path]::GetFullPath($MergedModel)
if (!$source.StartsWith($modelRoot + [IO.Path]::DirectorySeparatorChar)) { throw 'Merged source must be inside models.' }
if (!(Test-Path -LiteralPath "$source/adaptation-provenance.json")) { throw 'Missing adaptation provenance.' }
foreach ($f in @("models/$Name-Q4_K_M.gguf","models/$Name-mmproj-f16.gguf","work/$Name-f16.gguf")) { if (Test-Path -LiteralPath $f) { throw "Refusing to overwrite $f" } }
& $Python "$ConverterRoot/convert_hf_to_gguf.py" $source --outtype f16 --outfile "work/$Name-f16.gguf"
if ($LASTEXITCODE -ne 0) { throw 'Decoder conversion failed.' }
& $Python "$ConverterRoot/convert_hf_to_gguf.py" $source --mmproj --outtype f16 --outfile "models/$Name-mmproj-f16.gguf"
if ($LASTEXITCODE -ne 0) { throw 'Adapted vision-projector conversion failed.' }
& ./runtime/llama-cpu/llama-quantize.exe "work/$Name-f16.gguf" "models/$Name-Q4_K_M.gguf" Q4_K_M
if ($LASTEXITCODE -ne 0) { throw 'Quantization failed.' }
foreach ($f in @("models/$Name-Q4_K_M.gguf","models/$Name-mmproj-f16.gguf")) { (Get-FileHash -LiteralPath $f -Algorithm SHA256).Hash.ToLowerInvariant() | Set-Content -LiteralPath ($f+'.sha256') -Encoding ascii }
Copy-Item -LiteralPath "$source/adaptation-provenance.json" -Destination "models/$Name-adaptation-provenance.json"
Write-Output 'Exported candidate. Run matched GGUF tests before activation; matching decoder and projector were exported. Read adaptation provenance to see whether visual merger weights were trained or frozen.'
