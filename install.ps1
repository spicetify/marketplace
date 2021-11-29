Write-Host "Downloading..." -ForegroundColor "Green"
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

$checkSpice = Get-Command spicetify -ErrorAction Silent
if ($null -eq $checkSpice) {
  Write-Host -ForegroundColor Red "Spicetify not found"
  Invoke-WebRequest -UseBasicParsing "https://raw.githubusercontent.com/khanhas/spicetify-cli/master/install.ps1" | Invoke-Expression
}

Invoke-WebRequest -Uri "https://github.com/CharlieS1103/spicetify-marketplace/archive/refs/heads/main.zip" -UseBasicParsing -OutFile "${HOME}/.spicetify/CustomApps/spicetify-marketplace.zip"

Write-Host "Unzipping and installing..." -ForegroundColor "Green"
Expand-Archive -Path "${HOME}/.spicetify/CustomApps/spicetify-marketplace.zip" -DestinationPath "${HOME}/.spicetify/CustomApps/" -Force
Remove-Item -Path "${HOME}/.spicetify/CustomApps/spicetify-marketplace.zip" -Force
Rename-Item -Path "${HOME}/.spicetify/CustomApps/spicetify-marketplace-main" -NewName "spicetify-marketplace" 
Set-Location ${HOME}/.spicetify/CustomApps/
spicetify config custom_apps spicetify-marketplace
spicetify apply

Write-Host "Done! You may have to do spicetify backup apply if nothing has happened." -ForegroundColor "Green"
