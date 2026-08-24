# One-shot Cloudflare setup + deploy for the Git Challenge Tracker.
#
#   cd tracker-worker
#   npx wrangler login          # once, opens a browser
#   npm run setup
#
# Runs the whole manual walkthrough in order and skips any step already done,
# so it is safe to re-run:
#
#   1. checks you are logged in
#   2. creates the D1 database if it does not exist
#   3. writes its real id into wrangler.jsonc
#   4. creates the tables
#   5. builds and deploys (which is what brings the Worker into existence)
#   6. generates and stores SESSION_SECRET if the Worker has none
#
# This path never touches the Git-connected dashboard project, so a wrong
# framework preset there cannot break it.

$DbName = 'git-challenge-tracker'
$WorkerDir = Split-Path -Parent $PSScriptRoot
$ConfigFile = Join-Path $WorkerDir 'wrangler.jsonc'

Set-Location $WorkerDir

function Step($text) { Write-Host "`n==> $text" -ForegroundColor Cyan }
function Note($text) { Write-Host "    $text" -ForegroundColor DarkGray }

# stderr from wrangler is left alone deliberately: redirecting a native
# command's stderr in Windows PowerShell 5.1 turns every line into an
# ErrorRecord, which looks like a failure even on a clean exit. Exit codes are
# checked explicitly instead.

# --- 1. auth -----------------------------------------------------------------

Step 'Checking Cloudflare login'
$whoami = (& npx wrangler whoami) -join "`n"
if ($whoami -match 'not authenticated') {
  Write-Host ''
  Write-Host '  Not logged in. Run this, then re-run npm run setup:' -ForegroundColor Yellow
  Write-Host '    npx wrangler login' -ForegroundColor Yellow
  Write-Host ''
  exit 1
}
Note 'logged in'

# --- 2. database -------------------------------------------------------------

Step "Looking for the D1 database '$DbName'"

# `d1 list --json` is the reliable way to read the id back. Parsing the output
# of `d1 create` breaks whenever Cloudflare reformats its banner.
function Get-DatabaseId {
  $raw = (& npx wrangler d1 list --json) -join "`n"
  if (-not $raw.Trim()) { return $null }
  try { $list = $raw | ConvertFrom-Json } catch { return $null }
  foreach ($db in @($list)) {
    if ($db.name -eq $DbName) {
      # wrangler calls it uuid; fall back to id in case that ever changes.
      if ($db.uuid) { return $db.uuid }
      if ($db.id) { return $db.id }
    }
  }
  return $null
}

$databaseId = Get-DatabaseId
if (-not $databaseId) {
  Note 'not found - creating it'
  & npx wrangler d1 create $DbName
  if ($LASTEXITCODE -ne 0) { throw "wrangler d1 create failed (exit code $LASTEXITCODE)" }
  $databaseId = Get-DatabaseId
}
if (-not $databaseId) { throw "database created but its id could not be read back; check: npx wrangler d1 list" }
Note "database_id = $databaseId"

# --- 3. config ---------------------------------------------------------------

Step 'Writing database_id into wrangler.jsonc'
$config = [System.IO.File]::ReadAllText($ConfigFile)
if ($config.Contains($databaseId)) {
  Note 'already correct'
} else {
  # Replacement is built by concatenation so PowerShell cannot interpolate the
  # ${1} / ${2} group references. Only the id value changes; comments survive.
  $replacement = '${1}' + $databaseId + '${2}'
  $patched = [regex]::Replace($config, '("database_id"\s*:\s*")[^"]*(")', $replacement)
  if ($patched -eq $config) { throw "no database_id field found in $ConfigFile" }
  # UTF-8 with no BOM: a BOM would sit in front of the JSONC and break parsing.
  [System.IO.File]::WriteAllText($ConfigFile, $patched, (New-Object System.Text.UTF8Encoding($false)))
  Note 'updated - commit this change so Git-connected builds work too'
}

# --- 4. tables ---------------------------------------------------------------

Step 'Creating the tables (safe to repeat)'
& npx wrangler d1 execute $DbName --remote --file=./schema.sql --yes
if ($LASTEXITCODE -ne 0) { throw "loading schema.sql failed (exit code $LASTEXITCODE)" }

# --- 5. deploy ---------------------------------------------------------------

# Deploy before setting the secret: `wrangler secret put` needs the Worker to
# exist already, otherwise it stops to ask whether to create one.
Step 'Building and deploying'
& npm run deploy
if ($LASTEXITCODE -ne 0) { throw "deploy failed (exit code $LASTEXITCODE)" }

# --- 6. secret ---------------------------------------------------------------

Step 'Checking SESSION_SECRET'
$secrets = (& npx wrangler secret list) -join "`n"
if ($secrets -match 'SESSION_SECRET') {
  Note 'already set - left alone, replacing it would sign everyone out'
} else {
  Note 'not set - generating one'
  $bytes = New-Object byte[] 48
  [System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
  $secret = -join ($bytes | ForEach-Object { $_.ToString('x2') })
  $secret | & npx wrangler secret put SESSION_SECRET
  if ($LASTEXITCODE -ne 0) { throw "storing SESSION_SECRET failed (exit code $LASTEXITCODE)" }
  Note 'stored'
}

Write-Host ''
Write-Host '  Done. Open the workers.dev URL printed above and sign up.' -ForegroundColor Green
Write-Host '  Your own domain: uncomment the routes block in wrangler.jsonc, then npm run deploy.' -ForegroundColor Green
Write-Host ''
