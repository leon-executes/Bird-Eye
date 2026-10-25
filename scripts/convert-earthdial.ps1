param([string]$Python = 'python', [string]$ConverterRoot = 'work/llama-source')
$ErrorActionPreference='Stop'
Set-Location (Split-Path $PSScriptRoot -Parent)
if (!(Test-Path -LiteralPath 'models/earthdial-source/model-00002-of-00002.safetensors')) { throw 'Download verified EarthDial source weights first: runtime/node.exe scripts/setup-experts.mjs --earthdial-only' }
if (!(Test-Path -LiteralPath "$ConverterRoot/convert_hf_to_gguf.py")) { throw 'Supply a llama.cpp b11867 source checkout using -ConverterRoot.' }
& $Python "$ConverterRoot/convert_hf_to_gguf.py" models/earthdial-source --outtype f16 --outfile work/EarthDial-4B-RGB-F16.gguf
if ($LASTEXITCODE -ne 0) { throw 'Text-model conversion failed' }
& $Python "$ConverterRoot/convert_hf_to_gguf.py" models/earthdial-source --mmproj --outtype f16 --outfile work/mmproj-EarthDial-4B-RGB-F16.gguf
if ($LASTEXITCODE -ne 0) { throw 'Vision-projector conversion failed' }
& ./runtime/llama-cpu/llama-quantize.exe work/EarthDial-4B-RGB-F16.gguf work/EarthDial-4B-RGB-Q4_K_M.gguf Q4_K_M
if ($LASTEXITCODE -ne 0) { throw 'Quantization failed' }
Move-Item -LiteralPath 'work/mmproj-EarthDial-4B-RGB-F16.gguf' -Destination 'models/mmproj-EarthDial-4B-RGB-F16.gguf'
Move-Item -LiteralPath 'work/EarthDial-4B-RGB-Q4_K_M.gguf' -Destination 'models/EarthDial-4B-RGB-Q4_K_M.gguf'
foreach ($modelPath in @('models/EarthDial-4B-RGB-Q4_K_M.gguf','models/mmproj-EarthDial-4B-RGB-F16.gguf')) {
  $digest=(Get-FileHash -LiteralPath $modelPath -Algorithm SHA256).Hash.ToLowerInvariant()
  Set-Content -LiteralPath ($modelPath+'.sha256') -Value $digest -Encoding ascii
}
Write-Output 'Conversion finished. Run the model comparison before promoting the specialist.'
