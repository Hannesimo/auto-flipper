$BafPath = "${env:APPDATA}\BAF"
$Response = Invoke-WebRequest -URI "https://api.github.com/repos/Hannesimo/auto-flipper/releases" -UseBasicParsing
$Releases = ConvertFrom-Json $Response.Content

$Response = Invoke-WebRequest -URI $Releases[0].assets_url -UseBasicParsing
$Assets = ConvertFrom-Json $Response.Content

$NewestVersion = $Releases[0].tag_name
$Executable = ""
foreach ($Asset in $Assets) {
    if ($Asset.name -like "*-win.exe") {
        $Executable = $Asset
    }
}
$ExecutableName = $Executable.name

$FolderExists = Test-Path -Path $BafPath -PathType Container
if (!$FolderExists) {
    $_ = New-Item -ItemType Directory -Path $BafPath
}

$FilePath = Get-ChildItem -Path $BafPath -Filter "BAF*-win.exe" -File

if ($FilePath) {
    if ($FilePath[0].Name -ne "${ExecutableName}") {
        Write-Output "Newest available version: ${NewestVersion}"
        Write-Output "Different Executable present. Downloading new version..."
        Remove-Item $FilePath[0].FullName
        $wc = New-Object net.webclient
        $wc.Downloadfile($Executable.browser_download_url, "${BafPath}\${ExecutableName}")
    }
}
else {
    Write-Output "Executable is not present. Downloading..."
    $wc = New-Object net.webclient
    $wc.Downloadfile($Executable.browser_download_url, "${BafPath}\${ExecutableName}")
}

Write-Output "Starting BAF..."
Invoke-Expression "${BafPath}\${ExecutableName}"
