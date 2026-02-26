[CmdletBinding()]
param(
  [Parameter(Position = 0)]
  [string]$Command = "help",

  [ValidateSet("auto", "docker", "podman")]
  [string]$Engine = "auto",

  [ValidateRange(1, 65535)]
  [int]$ApiPort = 8080,

  [Parameter(ValueFromRemainingArguments = $true)]
  [string[]]$Args
)

$ErrorActionPreference = "Stop"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RepoRoot = Split-Path -Parent $ScriptDir
$WebDir = Join-Path $RepoRoot "apps\web"
$ComposeFile = Join-Path $RepoRoot "infra\docker\docker-compose.yml"
$WebDevPort = 5173
$WebDevPidFile = Join-Path $RepoRoot ".web-dev.pid"
$WebDevLogFile = Join-Path $RepoRoot "web-dev.log"
$ApiBaseUrl = "http://localhost:$ApiPort"
$ResolvedContainerEngine = $null
$ResolvedComposeCommandPrefix = $null

function Run-InDir {
  param(
    [Parameter(Mandatory = $true)][string]$Path,
    [Parameter(Mandatory = $true)][scriptblock]$Action
  )

  Push-Location $Path
  try {
    & $Action
  }
  finally {
    Pop-Location
  }
}

function Test-CommandAvailable {
  param([Parameter(Mandatory = $true)][string]$Name)
  return $null -ne (Get-Command -Name $Name -ErrorAction SilentlyContinue)
}

function Get-PythonUserScriptsPaths {
  $paths = New-Object System.Collections.Generic.List[string]

  if (-not (Test-CommandAvailable -Name "py")) {
    return @()
  }

  try {
    $userBase = (& py -m site --user-base 2>$null | Select-Object -First 1).Trim()
    if ($userBase) {
      $scriptsPath = Join-Path $userBase "Scripts"
      if (Test-Path $scriptsPath) {
        $paths.Add($scriptsPath)
      }
    }
  }
  catch {}

  $appDataPythonRoot = Join-Path $env:APPDATA "Python"
  if (Test-Path $appDataPythonRoot) {
    $versionedPythonDirs = Get-ChildItem -Path $appDataPythonRoot -Directory -Filter "Python*" -ErrorAction SilentlyContinue
    foreach ($dir in $versionedPythonDirs) {
      $versionedScriptsPath = Join-Path $dir.FullName "Scripts"
      if (Test-Path $versionedScriptsPath) {
        $paths.Add($versionedScriptsPath)
      }
    }
  }

  return ($paths.ToArray() | Select-Object -Unique)
}

function Resolve-CommandPath {
  param([Parameter(Mandatory = $true)][string]$Name)

  $resolvedName = [string]$Name
  $command = Get-Command -Name $resolvedName -ErrorAction SilentlyContinue
  if ($command) {
    return [string]($command | Select-Object -First 1 -ExpandProperty Source)
  }

  $pythonScriptsPaths = @(Get-PythonUserScriptsPaths)
  foreach ($pythonScriptsPath in $pythonScriptsPaths) {
    $pythonScriptsPathText = [string]$pythonScriptsPath
    if (-not $pythonScriptsPathText) {
      continue
    }

    $candidates = @(
      (Join-Path -Path $pythonScriptsPathText -ChildPath $resolvedName),
      (Join-Path -Path $pythonScriptsPathText -ChildPath "$resolvedName.exe"),
      (Join-Path -Path $pythonScriptsPathText -ChildPath "$resolvedName.cmd"),
      (Join-Path -Path $pythonScriptsPathText -ChildPath "$resolvedName.bat")
    )

    foreach ($candidate in $candidates) {
      if (Test-Path $candidate) {
        return $candidate
      }
    }
  }

  return $null
}

function Resolve-ContainerEngine {
  if ($script:ResolvedContainerEngine) {
    return $script:ResolvedContainerEngine
  }

  $requestedEngine = $Engine.ToLowerInvariant()
  if ($requestedEngine -eq "auto") {
    if (Test-CommandAvailable -Name "docker") {
      $requestedEngine = "docker"
    }
    elseif (Test-CommandAvailable -Name "podman") {
      $requestedEngine = "podman"
    }
    else {
      throw "Neither 'docker' nor 'podman' command is available in PATH."
    }
  }

  if (-not (Test-CommandAvailable -Name $requestedEngine)) {
    throw "Container engine '$requestedEngine' is not available in PATH."
  }

  $script:ResolvedContainerEngine = $requestedEngine
  return $script:ResolvedContainerEngine
}

function Resolve-ComposeCommandPrefix {
  if ($script:ResolvedComposeCommandPrefix) {
    return $script:ResolvedComposeCommandPrefix
  }

  $selectedEngine = Resolve-ContainerEngine
  if ($selectedEngine -eq "docker") {
    $script:ResolvedComposeCommandPrefix = @("docker", "compose")
    return $script:ResolvedComposeCommandPrefix
  }

  $composeProviderAvailable = $false
  try {
    & podman compose version *> $null
    $composeProviderAvailable = ($LASTEXITCODE -eq 0)
  }
  catch {
    $composeProviderAvailable = $false
  }

  if ($composeProviderAvailable) {
    $script:ResolvedComposeCommandPrefix = @("podman", "compose")
    return $script:ResolvedComposeCommandPrefix
  }

  $podmanComposePath = Resolve-CommandPath -Name "podman-compose"
  if ($podmanComposePath) {
    $script:ResolvedComposeCommandPrefix = @($podmanComposePath)
    return $script:ResolvedComposeCommandPrefix
  }

  throw "Podman compose is unavailable. Install the podman compose plugin or podman-compose."
}

function Run-ContainerEngineCommand {
  param(
    [Parameter(Mandatory = $true)][string[]]$EngineArgs,
    [switch]$Quiet
  )

  $selectedEngine = Resolve-ContainerEngine
  if ($Quiet) {
    & $selectedEngine @EngineArgs | Out-Null
  }
  else {
    & $selectedEngine @EngineArgs
  }

  if ($LASTEXITCODE -ne 0) {
    throw "$selectedEngine command failed with exit code $LASTEXITCODE."
  }
}

function Run-Compose {
  param([Parameter(Mandatory = $true)][string[]]$ComposeArgs)
  $composePrefix = @(Resolve-ComposeCommandPrefix)
  $env:VIBE_API_PORT = "$ApiPort"
  if ($composePrefix.Count -eq 2) {
    & $composePrefix[0] $composePrefix[1] -f $ComposeFile @ComposeArgs
  }
  else {
    & $composePrefix[0] -f $ComposeFile @ComposeArgs
  }
  if ($LASTEXITCODE -ne 0) {
    throw "compose command failed with exit code $LASTEXITCODE."
  }
}

function Run-NpmWeb {
  param([Parameter(Mandatory = $true)][string[]]$NpmArgs)
  Run-InDir -Path $WebDir -Action { & npm.cmd @NpmArgs }
  if ($LASTEXITCODE -ne 0) {
    throw "npm command failed with exit code $LASTEXITCODE."
  }
}

function Get-PortListeningPid {
  param([Parameter(Mandatory = $true)][int]$Port)
  $line = netstat -ano | Select-String -Pattern "LISTENING\s+(\d+)$" | Where-Object {
    $_.Line -match "[:\.]$Port\s+"
  } | Select-Object -First 1

  if (-not $line) {
    return $null
  }

  if ($line.Line -match "LISTENING\s+(\d+)$") {
    return [int]$Matches[1]
  }

  return $null
}

function Start-WebDevServer {
  $existingPid = Get-PortListeningPid -Port $WebDevPort
  if ($existingPid) {
    Set-Content -Path $WebDevPidFile -Value $existingPid
    Write-Host "Web dev server already listening on port $WebDevPort (PID: $existingPid)."
    return
  }

  if (Test-Path $WebDevPidFile) {
    Remove-Item $WebDevPidFile -Force
  }

  if (Test-Path $WebDevLogFile) {
    Remove-Item $WebDevLogFile -Force
  }

  $command = "cd /d `"$WebDir`" && npm.cmd run dev -- --host 127.0.0.1 --port $WebDevPort > `"$WebDevLogFile`" 2>&1"
  $process = Start-Process -FilePath "cmd.exe" -ArgumentList "/c", $command -PassThru
  Set-Content -Path $WebDevPidFile -Value $process.Id

  Start-Sleep -Seconds 2
  $startedPid = Get-PortListeningPid -Port $WebDevPort
  $running = Get-Process -Id $process.Id -ErrorAction SilentlyContinue

  if ($startedPid) {
    Write-Host "Web dev server started on http://127.0.0.1:$WebDevPort (PID: $startedPid)."
  }
  else {
    if (-not $running) {
      Remove-Item $WebDevPidFile -Force -ErrorAction SilentlyContinue
      Write-Warning "Web dev server exited before opening port $WebDevPort. Check log: $WebDevLogFile"
      if (Test-Path $WebDevLogFile) {
        Get-Content $WebDevLogFile -Tail 20
      }
      return
    }
    Write-Warning "Web dev server did not open port $WebDevPort yet. Check log: $WebDevLogFile"
  }
}

function Stop-WebDevServer {
  if (-not (Test-Path $WebDevPidFile)) {
    $fallbackOnlyPid = Get-PortListeningPid -Port $WebDevPort
    if ($fallbackOnlyPid) {
      Stop-Process -Id $fallbackOnlyPid -Force -ErrorAction SilentlyContinue
      Write-Host "Stopped web dev server on port $WebDevPort (PID: $fallbackOnlyPid)."
    }
    return
  }

  $webPidRaw = Get-Content $WebDevPidFile -ErrorAction SilentlyContinue
  if (-not $webPidRaw) {
    Remove-Item $WebDevPidFile -Force -ErrorAction SilentlyContinue
    return
  }

  $webPid = [int]$webPidRaw
  $targetProcess = Get-Process -Id $webPid -ErrorAction SilentlyContinue
  if ($targetProcess) {
    Stop-Process -Id $webPid -Force
    Write-Host "Stopped web dev server (PID: $webPid)."
  }
  else {
    $fallbackPid = Get-PortListeningPid -Port $WebDevPort
    if ($fallbackPid) {
      Stop-Process -Id $fallbackPid -Force -ErrorAction SilentlyContinue
      Write-Host "Stopped web dev server on port $WebDevPort (PID: $fallbackPid)."
    }
  }

  Remove-Item $WebDevPidFile -Force -ErrorAction SilentlyContinue

  $remainingPid = Get-PortListeningPid -Port $WebDevPort
  if ($remainingPid) {
    Stop-Process -Id $remainingPid -Force -ErrorAction SilentlyContinue
    Write-Host "Stopped additional process on port $WebDevPort (PID: $remainingPid)."
  }
}

function Run-Smoke {
  Write-Host "Running smoke checks..."

  $apiResult = Invoke-RestMethod -Uri "$ApiBaseUrl/health" -Method Get -ErrorAction Stop
  if (-not $apiResult -or $apiResult.status -ne "ok") {
    throw "API health check failed. Expected status=ok."
  }
  Write-Host " - API health: ok"

  $webStatusCode = (Invoke-WebRequest -Uri "http://127.0.0.1:$WebDevPort" -UseBasicParsing -ErrorAction Stop).StatusCode
  if ($webStatusCode -lt 200 -or $webStatusCode -ge 400) {
    throw "Web check failed. HTTP status: $webStatusCode"
  }
  Write-Host " - Web status: $webStatusCode"
  Write-Host "Smoke checks passed."
}

function Show-Help {
  Write-Host ""
  Write-Host "Usage:"
  Write-Host "  .\scripts\dev.ps1 <command> [args] [-Engine auto|docker|podman] [-ApiPort <port>]"
  Write-Host "  .\scripts\dev.cmd <command> [args] [-Engine auto|docker|podman] [-ApiPort <port>]"
  Write-Host ""
  Write-Host "Container compose (project):"
  Write-Host "  docker-up             Build/start postgres+api and start web dev server"
  Write-Host "  docker-down           Stop/remove compose containers and stop web dev server"
  Write-Host "  docker-start          Start existing compose containers"
  Write-Host "  docker-stop           Stop compose containers"
  Write-Host "  docker-restart        Restart compose containers (stop/start)"
  Write-Host "  docker-ps             Show compose container status"
  Write-Host "  docker-logs [svc]     Show logs (follows). svc optional: api/postgres"
  Write-Host ""
  Write-Host "Container engine options:"
  Write-Host "  -Engine auto          Use docker if found, otherwise podman"
  Write-Host "  -Engine docker        Force docker for this run"
  Write-Host "  -Engine podman        Force podman for this run"
  Write-Host "  -ApiPort <port>       Host port mapped to API container 8080 (default: 8080)"
  Write-Host "  engine                Show currently selected engine"
  Write-Host "  container-*           Alias for docker-* (e.g., container-up)"
  Write-Host ""
  Write-Host "Container engine (machine-wide containers):"
  Write-Host "  docker-start-all      Start all existing containers on your machine"
  Write-Host "  docker-stop-all       Stop all running containers on your machine"
  Write-Host ""
  Write-Host "Web (apps/web npm scripts):"
  Write-Host "  web-install           npm install"
  Write-Host "  web-dev               npm run dev"
  Write-Host "  web-build             npm run build"
  Write-Host "  web-lint              npm run lint"
  Write-Host "  web-preview           npm run preview"
  Write-Host ""
  Write-Host "Utility:"
  Write-Host "  api-health            GET $ApiBaseUrl/health"
  Write-Host "  smoke                 Verify API health + web HTTP status"
  Write-Host "  help                  Show this help"
  Write-Host ""
}

$normalizedCommand = $Command.ToLowerInvariant()
if ($normalizedCommand.StartsWith("container-")) {
  $normalizedCommand = "docker-" + $normalizedCommand.Substring("container-".Length)
}

switch ($normalizedCommand) {
  "help" {
    Show-Help
    break
  }

  "engine" {
    $selectedEngine = Resolve-ContainerEngine
    Write-Host "Selected container engine: $selectedEngine"
    break
  }

  "docker-up" {
    Run-Compose @("up", "--build", "-d")
    Start-WebDevServer
    break
  }

  "docker-down" {
    Run-Compose @("down")
    Stop-WebDevServer
    break
  }

  "docker-start" {
    Run-Compose @("start")
    break
  }

  "docker-stop" {
    Run-Compose @("stop")
    break
  }

  "docker-restart" {
    Run-Compose @("restart")
    break
  }

  "docker-ps" {
    Run-Compose @("ps")
    break
  }

  "docker-logs" {
    if ($Args.Count -gt 0) {
      Run-Compose @("logs", "-f", $Args[0])
    }
    else {
      Run-Compose @("logs", "-f")
    }
    break
  }

  "docker-start-all" {
    $selectedEngine = Resolve-ContainerEngine
    $all = & $selectedEngine ps -aq
    if ($LASTEXITCODE -ne 0) {
      throw "$selectedEngine command failed with exit code $LASTEXITCODE."
    }
    if (-not $all) {
      Write-Host "No containers found."
      break
    }
    foreach ($containerId in $all) {
      Run-ContainerEngineCommand -EngineArgs @("start", $containerId) -Quiet
      Write-Host "Started: $containerId"
    }
    break
  }

  "docker-stop-all" {
    $selectedEngine = Resolve-ContainerEngine
    $running = & $selectedEngine ps -q
    if ($LASTEXITCODE -ne 0) {
      throw "$selectedEngine command failed with exit code $LASTEXITCODE."
    }
    if (-not $running) {
      Write-Host "No running containers found."
      break
    }
    foreach ($containerId in $running) {
      Run-ContainerEngineCommand -EngineArgs @("stop", $containerId) -Quiet
      Write-Host "Stopped: $containerId"
    }
    break
  }

  "web-install" {
    Run-NpmWeb @("install")
    break
  }

  "web-dev" {
    Run-NpmWeb @("run", "dev")
    break
  }

  "web-build" {
    Run-NpmWeb @("run", "build")
    break
  }

  "web-lint" {
    Run-NpmWeb @("run", "lint")
    break
  }

  "web-preview" {
    Run-NpmWeb @("run", "preview")
    break
  }

  "api-health" {
    Invoke-RestMethod -Uri "$ApiBaseUrl/health" -Method Get | ConvertTo-Json -Depth 5
    break
  }

  "smoke" {
    Run-Smoke
    break
  }

  default {
    Write-Error "Unknown command: $Command. Use 'help' to see available commands."
  }
}
