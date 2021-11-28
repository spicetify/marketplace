# Adapted from https://github.com/JulienMaille/dribbblish-dynamic-theme/blob/main/install.ps1
# Edited from project Denoland install script (https://github.com/denoland/deno_install)

param (
  [string] $version
)

$PSMinVersion = 3

if ($v) {
  $version = $v
}

# Helper functions for pretty terminal output.
function Write-Part ([string] $Text) {
  Write-Host $Text -NoNewline
}

function Write-Emphasized ([string] $Text) {
  Write-Host $Text -NoNewLine -ForegroundColor "Yellow"
}

function Write-Done {
  Write-Host " > " -NoNewline
  Write-Host "OK" -ForegroundColor "Green"
}

if ($PSVersionTable.PSVersion.Major -gt $PSMinVersion) {
  $ErrorActionPreference = "Stop"

  # Enable TLS 1.2 since it is required for connections to GitHub.
  [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

  $checkSpice = Get-Command spicetify -ErrorAction Silent
  if ($null -eq $checkSpice) {
    Write-Host -ForegroundColor Red "Spicetify not found"
    Invoke-WebRequest -UseBasicParsing "https://raw.githubusercontent.com/khanhas/spicetify-cli/master/install.ps1" | Invoke-Expression
  }

  if (-not $version) {
    # Determine latest release via GitHub API.
    $latest_release_uri =
    "https://github.com/CharlieS1103/spicetify-marketplace/archive/refs/heads/main.zip"
    Write-Part "DOWNLOADING    "; Write-Emphasized $latest_release_uri
    $latest_release_json = Invoke-RestMethod -Uri $latest_release_uri -UseBasicParsing
    Write-Done

    $version = "Latest (Project is currently WIP)"
  }

  # Check ~\spicetify-cli\CustomApps directory already exists
  $sp_dir = "${HOME}\spicetify-cli\CustomApps"
  if (-not (Test-Path $sp_dir)) {
    Write-Part "MAKING FOLDER  "; Write-Emphasized $sp_dir
    New-Item -Path $sp_dir -ItemType Directory | Out-Null
    Write-Done
  }

  # Download release.
  $zip_file = "${sp_dir}\spicetify-marketplace.zip"
  Write-Part "DOWNLOADING    "; Write-Emphasized "https://github.com/CharlieS1103/spicetify-marketplace/archive/refs/heads/main.zip"
  Invoke-WebRequest -Uri "https://github.com/CharlieS1103/spicetify-marketplace/archive/refs/heads/main.zip" -UseBasicParsing -OutFile $zip_file
  Write-Done

  # Extract theme from .zip file.
  Write-Part "EXTRACTING     "; Write-Emphasized $zip_file
  Write-Part " into "; Write-Emphasized ${sp_dir};
  

  Expand-Archive -Path $zip_file -DestinationPath "${sp_dir}\spicetify-marketplace" -Force
  Write-Done

  # Remove .zip file.
  Write-Part "REMOVING       "; Write-Emphasized $zip_file
  Remove-Item -Path $zip_file
  Remove-Item -Path  "${sp_dir}\spicetify-marketplace\spicetify-marketplace-main" -Force -Recurse
  Write-Done

  # Check ~\.spicetify.\Themes directory already exists
  $spicePath = spicetify -c | Split-Path
  $sp_dot_dir = "$spicePath\"
  if (-not (Test-Path $sp_dot_dir)) {
    Write-Part "MAKING FOLDER  "; Write-Emphasized $sp_dot_dir
    New-Item -Path $sp_dot_dir -ItemType Directory | Out-Null
    Write-Done
  }


  # Copy to .spicetify.
  Write-Part "COPYING        "; Write-Emphasized $sp_dot_dir
  Copy-Item -Path "${sp_dir}\" -Destination $sp_dot_dir -Recurse -Force
  Write-Done
 
  # Installing.
  Write-Part "INSTALLING";
  cd $sp_dot_dir
  spicetify config custom_apps spicetify-marketplace
  spicetify apply
  Write-Done

  # Add patch
  Write-Part "PATCHING       "; Write-Emphasized "config-xpui.ini"
  $configFile = Get-Content "$spicePath\config-xpui.ini"
  if (-not ($configFile -match "xpui.js_find_8008")) {
    $rep = @"
[Patch]
xpui.js_find_8008=,(\w+=)32,
xpui.js_repl_8008=,`${1}58,
"@
    # In case missing Patch section
    if (-not ($configFile -match "\[Patch\]")) {
      $configFile += "`n[Patch]`n"
    }
    $configFile = $configFile -replace "\[Patch\]",$rep
    Set-Content "$spicePath\config-xpui.ini" $configFile
  }
  Write-Done

  Write-Part "APPLYING";
  $backupVer = $configFile -match "^version"
  $version = ConvertFrom-StringData $backupVer[0]
  if ($version.version.Length -gt 0) {
    spicetify apply
  } else {
    spicetify backup apply
  }
}
else {
  Write-Part "`nYour Powershell version is less than "; Write-Emphasized "$PSMinVersion";
  Write-Part "`nPlease, update your Powershell downloading the "; Write-Emphasized "'Windows Management Framework'"; Write-Part " greater than "; Write-Emphasized "$PSMinVersion"
}
