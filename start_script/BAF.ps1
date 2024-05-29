# Check if node is installed
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Output "ERROR: Seems like node is not installed. Please install it and run the script again."
    Write-Output "You can get it here: https://nodejs.org/en/download/prebuilt-installer"
    Exit
}

# Create BAF folder in APPDATA if it doesn't exist
$BafPath = '"${env:APPDATA}\BAF"'
$FolderExists = Test-Path -Path $BafPath -PathType Container
if (!$FolderExists) {
    New-Item -ItemType Directory -Path $BafPath
}

# Download latest version of BAF
$ProgressPreference = "SilentlyContinue"
$Response = Invoke-WebRequest -URI "https://api.github.com/repos/Hannesimo/auto-flipper/releases" -UseBasicParsing
$Releases = ConvertFrom-Json $Response.Content
$ZipURL = $Releases[0].zipball_url
$ZipFilePath = "$BafPath\BAF.zip"
$NewestVersion = $Releases[0].tag_name

# Check if the latest version is already installed
# if not install it
$FolderPath = Join-Path -Path $BafPath -ChildPath $NewestVersion
$NewestVersionAlreadyInstalled = Test-Path -Path $FolderPath -PathType Container
if (-not $NewestVersionAlreadyInstalled) {
    Invoke-WebRequest -Uri $ZipURL -OutFile $ZipFilePath
    Expand-Archive -Path $ZipFilePath -DestinationPath $BafPath 
    Remove-Item -Path $ZipFilePath
    $ResultFolder = Get-ChildItem -Path $BafPath | Sort-Object LastWriteTime -Descending | Select-Object -First 1
    Rename-Item -Path $ResultFolder.FullName -NewName $NewestVersion
}

# Start BAF
Set-Location -Path $FolderPath
Invoke-Expression "npm i"
Invoke-Expression "npm run start"