$ErrorActionPreference = 'Stop'
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

Write-Host -Object 'Setting up...' -ForegroundColor Cyan

if (-not (Get-Command -Name spicetify -ErrorAction SilentlyContinue)) {
  Write-Host -Object 'Spicetify not found. Installing it for you...' -ForegroundColor Yellow
  $Parameters = @{
    Uri             = 'https://raw.githubusercontent.com/spicetify/spicetify-cli/master/install.ps1'
    UseBasicParsing = $true
  }
  Invoke-WebRequest @Parameters | Invoke-Expression
}

spicetify path userdata | Out-Null
$spiceUserDataPath = (spicetify path userdata)
$marketAppPath = "$spiceUserDataPath\CustomApps\marketplace"
$marketThemePath = "$spiceUserDataPath\Themes\marketplace"
$isMarketplaceInstalled = (
  ((spicetify config custom_apps) -contains 'marketplace') -and (Test-Path -Path $marketAppPath -PathType Container)
)

Write-Host -Object 'Removing and creating Marketplace folders...' -ForegroundColor Cyan
Remove-Item -Path $marketAppPath, $marketThemePath -Recurse -Force -ErrorAction SilentlyContinue | Out-Null
New-Item -Path $marketAppPath, $marketThemePath -ItemType Directory -Force | Out-Null

Write-Host 'Downloading Marketplace...' -ForegroundColor Cyan
$marketArchivePath = "$marketAppPath\marketplace.zip"
$unpackedFolderPath = "$marketAppPath\spicetify-marketplace-dist"
$Parameters = @{
  Uri             = 'https://github.com/spicetify/spicetify-marketplace/releases/latest/download/spicetify-marketplace.zip'
  UseBasicParsing = $true
  OutFile         = $marketArchivePath
}
Invoke-WebRequest @Parameters

Write-Host -Object 'Unzipping and installing...' -ForegroundColor Cyan
Expand-Archive -Path $marketArchivePath -DestinationPath $marketAppPath -Force
Move-Item -Path "$unpackedFolderPath\*" -Destination $marketAppPath -Force
Remove-Item -Path $marketArchivePath, $unpackedFolderPath -Force
spicetify config custom_apps spicetify-marketplace- -q
spicetify config custom_apps marketplace
spicetify config inject_css 1 replace_colors 1

Write-Host -Object 'Downloading placeholder theme...' -ForegroundColor Cyan
$Parameters = @{
  Uri             = 'https://raw.githubusercontent.com/spicetify/spicetify-marketplace/main/resources/color.ini'
  UseBasicParsing = $true
  OutFile         = "$marketThemePath\color.ini"
}
Invoke-WebRequest @Parameters

Write-Host -Object 'Applying...' -ForegroundColor Cyan
if (-not $isMarketplaceInstalled) {
  spicetify config current_theme marketplace
}
if (-not (Test-Path -Path "$spiceUserDataPath\Backup" -PathType Container)) {
  spicetify backup 
}
spicetify apply

Write-Host -Object 'Done! If nothing has happened, do spicetify apply' -ForegroundColor Green
