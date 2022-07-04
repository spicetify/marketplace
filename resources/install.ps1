# Modified from https://github.com/JulienMaille/dribbblish-dynamic-theme/blob/main/install.ps1
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

Write-Host "Setting up..." -ForegroundColor "Green"

$checkSpice = Get-Command spicetify -ErrorAction Silent
if ($null -eq $checkSpice) {
  Write-Host -ForegroundColor Red "Spicetify not found. Installing that for you..."
  Invoke-WebRequest -UseBasicParsing "https://raw.githubusercontent.com/khanhas/spicetify-cli/master/install.ps1" | Invoke-Expression
}

$spicePath = spicetify -c | Split-Path
$sp_dot_dir = "$spicePath\CustomApps"
if (-not (Test-Path $sp_dot_dir)) {
  Write-Host "Making a CustomApps folder..." -ForegroundColor "Cyan"
  New-Item -Path $sp_dot_dir -ItemType Directory | Out-Null
}

Write-Host "Downloading..." -ForegroundColor "Green"
Invoke-WebRequest -Uri "https://github.com/spicetify/spicetify-marketplace/archive/refs/heads/dist.zip" -UseBasicParsing -OutFile "$sp_dot_dir\marketplace.zip"

Write-Host "Unzipping and installing..." -ForegroundColor "Green"
Expand-Archive -Path "$sp_dot_dir\marketplace.zip" -DestinationPath $sp_dot_dir -Force
Remove-Item -Path "$sp_dot_dir\marketplace.zip" -Force
if (Test-Path -Path "$sp_dot_dir\marketplace") {
  Write-Host "marketplace was already found! Updating..." -ForegroundColor "Cyan"
  Remove-Item -Path "$sp_dot_dir\marketplace" -Force -Recurse
}
Rename-Item -Path "$sp_dot_dir\spicetify-marketplace-dist" -NewName "marketplace" -Force
spicetify config custom_apps spicetify-marketplace-
spicetify config custom_apps marketplace

# Color injection fix
spicetify config inject_css 1
spicetify config replace_colors 1

$currentTheme = spicetify config current_theme | Out-String
if ($currentTheme.Length -lt 3) {
  Write-Host -ForegroundColor Red "No theme is found, applying placeholder theme..."
  if (-not (Test-Path "$spicePath\Themes\marketplace")) {
    Write-Host "Making placeholder theme folder..." -ForegroundColor "Cyan"
    New-Item -Path "$spicePath\Themes\marketplace" -ItemType Directory | Out-Null
  }
  Invoke-WebRequest -UseBasicParsing "https://raw.githubusercontent.com/spicetify/spicetify-marketplace/main/resources/color.ini" -OutFile "$spicePath\Themes\marketplace\color.ini"
  spicetify config current_theme marketplace
}

spicetify backup
spicetify apply

Write-Host "Done! If nothing has happened, do spicetify apply" -ForegroundColor "Green"
