$ErrorActionPreference = 'Stop'
$projectRoot = $PSScriptRoot
$appPath = Join-Path $projectRoot 'psalmist.html'
$existing = [IO.File]::ReadAllText($appPath)
$bibleMatch = [regex]::Match($existing, '<script id="bible" type="application/json">([\s\S]*?)</script>')
if (-not $bibleMatch.Success) { throw 'The embedded Bible text was not found. Build stopped.' }
$document = [IO.File]::ReadAllText((Join-Path $projectRoot 'src\shell.html'))
$document = $document.Replace('/* BIBLE */', $bibleMatch.Groups[1].Value)
$document = $document.Replace('/* STYLES */', [IO.File]::ReadAllText((Join-Path $projectRoot 'src\style.css')))
$document = $document.Replace('/* STORAGE */', [IO.File]::ReadAllText((Join-Path $projectRoot 'src\storage.js')))
$document = $document.Replace('/* APP */', [IO.File]::ReadAllText((Join-Path $projectRoot 'src\app.js')))
[IO.File]::WriteAllText($appPath, $document, (New-Object Text.UTF8Encoding $false))
Write-Output 'Built self-contained psalmist.html with the original Bible text.'
