$source = "node_modules/onnxruntime-web/dist/*.wasm"
$sourceMjs = "node_modules/onnxruntime-web/dist/*.mjs"
$dest = "public/"

if (!(Test-Path $dest)) {
    New-Item -ItemType Directory -Force -Path $dest
}

Write-Host "Copying WASM files to $dest..."
Copy-Item $source $dest -ErrorAction SilentlyContinue
Write-Host "Copying MJS files to $dest..."
Copy-Item $sourceMjs $dest -ErrorAction SilentlyContinue

Write-Host "WASM and MJS sync complete."
