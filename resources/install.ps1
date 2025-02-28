[CmdletBinding()]
param(
    [Parameter()]
    [switch]$BypassAdmin
)

$ErrorActionPreference = 'Stop'
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

function Invoke-Spicetify {
    param (
        [Parameter(Mandatory = $true, Position = 0, ValueFromRemainingArguments = $true)]
        [string[]]$Arguments
    )
    
    $spicetifyArgs = @()
    if ($BypassAdmin) {
        $spicetifyArgs += "--bypass-admin"
    }
    $spicetifyArgs += $Arguments
    
    & spicetify $spicetifyArgs
    return $LASTEXITCODE
}

function Invoke-SpicetifyWithOutput {
    param (
        [Parameter(Mandatory = $true, Position = 0, ValueFromRemainingArguments = $true)]
        [string[]]$Arguments
    )
    
    $spicetifyArgs = @()
    if ($BypassAdmin) {
        $spicetifyArgs += "--bypass-admin"
    }
    $spicetifyArgs += $Arguments
    
    $output = (& spicetify $spicetifyArgs 2>&1 | Out-String).Trim()
    return @{
        Output = $output
        ExitCode = $LASTEXITCODE
    }
}

Write-Host -Object 'Setting up...' -ForegroundColor 'Cyan'

if (-not (Get-Command -Name 'spicetify' -ErrorAction 'SilentlyContinue')) {
    Write-Host -Object 'Spicetify not found.' -ForegroundColor 'Yellow'
    Write-Host -Object 'Installing it for you...' -ForegroundColor 'Cyan'
    $Parameters = @{
        Uri             = 'https://raw.githubusercontent.com/spicetify/cli/main/install.ps1'
        UseBasicParsing = $true
    }
    Invoke-WebRequest @Parameters | Invoke-Expression
}

try {
    $result = Invoke-SpicetifyWithOutput "path" "userdata"
    if ($result.ExitCode -ne 0) {
        Write-Host -Object "Error from Spicetify:" -ForegroundColor 'Red'
        Write-Host -Object $result.Output -ForegroundColor 'Red'
        return
    }
    $spiceUserDataPath = $result.Output
} catch {
    Write-Host -Object "Error running Spicetify:" -ForegroundColor 'Red'
    Write-Host -Object $_.Exception.Message.Trim() -ForegroundColor 'Red'
    return
}

if (-not (Test-Path -Path $spiceUserDataPath -PathType 'Container' -ErrorAction 'SilentlyContinue')) {
    $spiceUserDataPath = "$env:APPDATA\spicetify"
}
$marketAppPath = "$spiceUserDataPath\CustomApps\marketplace"
$marketThemePath = "$spiceUserDataPath\Themes\marketplace"

$isThemeInstalled = $(
    Invoke-Spicetify "path" "-s" | Out-Null
    -not $LASTEXITCODE
)
$currentTheme = (Invoke-SpicetifyWithOutput "config" "current_theme").Output
$setTheme = $true

Write-Host -Object 'Removing and creating Marketplace folders...' -ForegroundColor 'Cyan'
try {
    $result = Invoke-SpicetifyWithOutput "path" "userdata"
    if ($result.ExitCode -ne 0) {
        Write-Host -Object "Error: Failed to get Spicetify path. Details:" -ForegroundColor 'Red'
        Write-Host -Object $result.Output -ForegroundColor 'Red'
        return
    }

    Remove-Item -Path $marketAppPath, $marketThemePath -Recurse -Force -ErrorAction 'SilentlyContinue' | Out-Null
    if (-not (New-Item -Path $marketAppPath, $marketThemePath -ItemType 'Directory' -Force -ErrorAction 'Stop')) {
        Write-Host -Object "Error: Failed to create Marketplace directories." -ForegroundColor 'Red'
        return
    }
} catch {
    Write-Host -Object "Error: $($_.Exception.Message.Trim())" -ForegroundColor 'Red'
    return
}

Write-Host -Object 'Downloading Marketplace...' -ForegroundColor 'Cyan'
$marketArchivePath = "$marketAppPath\marketplace.zip"
$unpackedFolderPath = "$marketAppPath\marketplace-dist"
$Parameters = @{
  Uri             = 'https://github.com/spicetify/marketplace/releases/latest/download/marketplace.zip'
  UseBasicParsing = $true
  OutFile         = $marketArchivePath
}
Invoke-WebRequest @Parameters

Write-Host -Object 'Unzipping and installing...' -ForegroundColor 'Cyan'
Expand-Archive -Path $marketArchivePath -DestinationPath $marketAppPath -Force
Move-Item -Path "$unpackedFolderPath\*" -Destination $marketAppPath -Force
Remove-Item -Path $marketArchivePath, $unpackedFolderPath -Force
Invoke-Spicetify "config" "custom_apps" "spicetify-marketplace-" "-q"
Invoke-Spicetify "config" "custom_apps" "marketplace"
Invoke-Spicetify "config" "inject_css" "1" "replace_colors" "1"

Write-Host -Object 'Downloading placeholder theme...' -ForegroundColor 'Cyan'
$Parameters = @{
  Uri             = 'https://raw.githubusercontent.com/spicetify/marketplace/main/resources/color.ini'
  UseBasicParsing = $true
  OutFile         = "$marketThemePath\color.ini"
}
Invoke-WebRequest @Parameters

Write-Host -Object 'Applying...' -ForegroundColor 'Cyan'
if ($isThemeInstalled -and ($currentTheme -ne 'marketplace')) {
    $Host.UI.RawUI.Flushinputbuffer()
    $choice = $Host.UI.PromptForChoice(
        'Local theme found',
        'Do you want to replace it with a placeholder to install themes from the Marketplace?',
        ('&Yes', '&No'),
        0
    )
    if ($choice = 1) { $setTheme = $false }
}
if ($setTheme) {
    Invoke-Spicetify "config" "current_theme" "marketplace"
}
Invoke-Spicetify "backup"
Invoke-Spicetify "apply"

Write-Host -Object 'Done!' -ForegroundColor 'Green'
Write-Host -Object 'If nothing has happened, check the messages above for errors'