$ErrorActionPreference = "Stop"
$vencord = Join-Path $HOME "Vencord"
$zipUrl = "https://github.com/Pm74k/GraphTech-Cosmetics-/archive/refs/heads/main.zip"

foreach ($cmd in "node", "git") {
    if (-not (Get-Command $cmd -ErrorAction SilentlyContinue)) {
        Write-Host "Il manque '$cmd'. Installe Node.js (https://nodejs.org) et Git (https://git-scm.com/download/win), rouvre PowerShell, puis relance cette commande."
        return
    }
}

$firstInstall = -not (Test-Path $vencord)
if ($firstInstall) {
    Write-Host "Telechargement de Vencord..."
    git clone --depth 1 https://github.com/Vendicated/Vencord.git $vencord
}

$tmp = Join-Path $env:TEMP "graphtech-install"
if (Test-Path $tmp) { Remove-Item $tmp -Recurse -Force }
New-Item -ItemType Directory -Path $tmp | Out-Null

Write-Host "Telechargement de GraphTech..."
Invoke-WebRequest -Uri $zipUrl -OutFile (Join-Path $tmp "gt.zip")
Expand-Archive -Path (Join-Path $tmp "gt.zip") -DestinationPath $tmp -Force

$plugins = Join-Path $vencord "src\userplugins"
New-Item -ItemType Directory -Path $plugins -Force | Out-Null
$dest = Join-Path $plugins "graphtech"
if (Test-Path $dest) { Remove-Item $dest -Recurse -Force }
$src = Get-ChildItem -Path $tmp -Recurse -Filter index.tsx | Where-Object { $_.Directory.Name -eq "graphtech" } | Select-Object -First 1
if (-not $src) {
    Write-Host "Dossier du plugin introuvable dans l'archive telechargee."
    return
}
Copy-Item $src.Directory.FullName $dest -Recurse
Remove-Item $tmp -Recurse -Force

Set-Location $vencord
Write-Host "Installation des dependances..."
npx.cmd --yes pnpm install
Write-Host "Compilation..."
npx.cmd pnpm build

if ($firstInstall) {
    Write-Host "Choisis ton Discord dans la liste :"
    npx.cmd pnpm inject
}

Write-Host ""
Write-Host "Termine. Quitte Discord completement (clic droit sur l'icone > Quitter) puis relance-le."
if ($firstInstall) {
    Write-Host "Active ensuite le plugin : Parametres > Vencord > Plugins > GraphTech."
}
