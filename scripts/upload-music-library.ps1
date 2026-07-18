param(
  [string]$ProjectRef = "bydlhkzwvhykjttilwtr"
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$catalogPath = Join-Path $root "public\music-catalog.json"
$catalog = Get-Content -LiteralPath $catalogPath -Raw -Encoding UTF8 | ConvertFrom-Json

if (-not (Test-Path -LiteralPath (Join-Path $root "supabase\.temp\project-ref"))) {
  npx --yes supabase@latest link --project-ref $ProjectRef
}

$uploaded = 0
foreach ($track in $catalog) {
  $source = Join-Path $root $track.localSource
  if (-not (Test-Path -LiteralPath $source)) {
    throw "Missing local source for $($track.id): $source"
  }
  npx --yes supabase@latest storage cp $source "ss:///music-library/$($track.objectKey)" --linked --cache-control "public, max-age=31536000, immutable"
  if ($LASTEXITCODE -ne 0) { throw "Upload failed: $($track.id)" }
  $uploaded += 1
}

Write-Host "Uploaded $uploaded tracks to Supabase Storage."
