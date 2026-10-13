param([switch]$NoBrowser)
$ErrorActionPreference = 'Stop'
$localUrl = 'http://localhost:8765/psalmist.html'
$healthUrl = 'http://127.0.0.1:8765/health'
# Probe IPv4 directly, matching server.cjs. Do not send loopback checks through
# a system proxy or depend on Invoke-WebRequest's response-body conversion.
function Get-PsalmistHealth {
    $request = [Net.HttpWebRequest]::Create($healthUrl)
    $request.Proxy = $null
    $request.Timeout = 1500
    $request.ReadWriteTimeout = 1500
    try {
        $reply = $request.GetResponse()
        try {
            $reader = New-Object IO.StreamReader($reply.GetResponseStream())
            try { return $reader.ReadToEnd().Trim() } finally { $reader.Dispose() }
        } finally { $reply.Close() }
    } catch [Net.WebException] {
        if ($_.Exception.Response) {
            $_.Exception.Response.Close()
            throw 'Port 8765 is responding, but it is not the Psalmist server.'
        }
        return $null
    }
}
$ready = $false
$health = Get-PsalmistHealth
if ($health) {
    if ($health -ne 'psalmist-local-v2') { throw 'Port 8765 is already used by a different application. No process was stopped.' }
    $ready = $true
    Write-Output 'Reusing the running Psalmist server on port 8765.'
}
if (-not $ready) {
    $nodeCommand = Get-Command node -ErrorAction SilentlyContinue
    $nodePath = if ($nodeCommand) { $nodeCommand.Source } else { $null }
    if (-not $nodePath) {
        $candidates = @(
            (Join-Path $env:LOCALAPPDATA 'hermes\node\node.exe'),
            (Join-Path $env:USERPROFILE '.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe')
        )
        $nodePath = $candidates | Where-Object { Test-Path -LiteralPath $_ } | Select-Object -First 1
    }
    if (-not $nodePath) { throw 'Node.js is required to run the local launcher. Install Node.js or use an equivalent static server at localhost:8765.' }
    $serverPath = Join-Path $PSScriptRoot 'server.cjs'
    $logFolder = Join-Path $PSScriptRoot 'work'
    [IO.Directory]::CreateDirectory($logFolder) | Out-Null
    $errorLog = Join-Path $logFolder 'server-error.log'
    $outputLog = Join-Path $logFolder 'server-output.log'
    $serverProcess = Start-Process -FilePath $nodePath -ArgumentList @(('"' + $serverPath + '"')) -WorkingDirectory $PSScriptRoot -WindowStyle Hidden -PassThru -RedirectStandardError $errorLog -RedirectStandardOutput $outputLog
    for ($attempt = 0; $attempt -lt 20; $attempt++) {
        Start-Sleep -Milliseconds 250
        $health = Get-PsalmistHealth
        if ($health -eq 'psalmist-local-v2') { $ready = $true; break }
        if ($health) { throw 'Port 8765 is responding with a different application. No process was stopped.' }
        if ($serverProcess.HasExited) { break }
    }
    if (-not $ready) {
        $detail = if (Test-Path -LiteralPath $errorLog) { [IO.File]::ReadAllText($errorLog).Trim() } else { '' }
        if ($detail -match 'EADDRINUSE') { throw 'Port 8765 is occupied by another process. It was not stopped. Use the existing Psalmist server if it is yours, or free the port before retrying.' }
        if ($detail) { throw ('The local server failed: ' + $detail) }
        throw ('The server did not pass its readiness check. Details: ' + $errorLog)
    }
}
Write-Output ('Psalmist is ready: ' + $localUrl)
if (-not $NoBrowser) { Start-Process $localUrl }
