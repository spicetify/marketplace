# Modified from https://github.com/JulienMaille/dribbblish-dynamic-theme/blob/main/install.ps1
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

Write-Host "Setting up..." -ForegroundColor "Green"

$checkSpice = Get-Command spicetify -ErrorAction Silent
if ($null -eq $checkSpice) {
  Write-Host -ForegroundColor Red "Spicetify not found. Installing that for you..."
  Invoke-WebRequest -UseBasicParsing "https://raw.githubusercontent.com/khanhas/spicetify-cli/master/install.ps1" | Invoke-Expression
}

$sp_dir = "${HOME}\spicetify-cli\CustomApps"
if (-not (Test-Path $sp_dir)) {
  Write-Host "Making a CustomApps folder..." -ForegroundColor "Cyan"
  New-Item -Path $sp_dir -ItemType Directory | Out-Null
  Write-Done
}

$spicePath = spicetify -c | Split-Path
$sp_dot_dir = "$spicePath\CustomApps"
if (-not (Test-Path $sp_dot_dir)) {
  Write-Host "Making a CustomApps folder..." -ForegroundColor "Cyan"
  New-Item -Path $sp_dot_dir -ItemType Directory | Out-Null
}

Write-Host "Downloading..." -ForegroundColor "Green"
Invoke-WebRequest -Uri "https://github.com/spicetify/spicetify-marketplace/archive/refs/heads/dist.zip" -UseBasicParsing -OutFile "${HOME}/spicetify-cli/CustomApps/marketplace.zip"

Write-Host "Unzipping and installing..." -ForegroundColor "Green"
Expand-Archive -Path "${HOME}/spicetify-cli/CustomApps/marketplace.zip" -DestinationPath "${HOME}/spicetify-cli/CustomApps/" -Force
Remove-Item -Path "${HOME}/spicetify-cli/CustomApps/marketplace.zip" -Force
if (Test-Path -Path "${HOME}/spicetify-cli/CustomApps/marketplace") {
  Write-Host "marketplace was already found! Updating..." -ForegroundColor "Cyan"
  Remove-Item -Path "${HOME}/spicetify-cli/CustomApps/marketplace" -Force -Recurse
}
Rename-Item -Path "${HOME}/spicetify-cli/CustomApps/marketplace-dist" -NewName "marketplace" -Force
Copy-Item -Path "${HOME}/spicetify-cli/CustomApps/marketplace" -Destination $sp_dot_dir -Recurse -Force
spicetify config custom_apps marketplace
spicetify backup apply

Write-Host "Done! If nothing has happened, do spicetify apply" -ForegroundColor "Green"
