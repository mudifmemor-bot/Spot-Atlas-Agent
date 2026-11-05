@echo off
setlocal
set "page=%~dp0Spot-Atlas-offline.html"
if not exist "%page%" (
  echo Extract the entire ZIP first. Keep this launcher beside Spot-Atlas-offline.html.
  pause
  exit /b 1
)
for %%B in ("%ProgramFiles%\Google\Chrome\Application\chrome.exe" "%LocalAppData%\Google\Chrome\Application\chrome.exe" "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" "%ProgramFiles%\Microsoft\Edge\Application\msedge.exe") do (
  if exist "%%~B" (
    start "" "%%~B" --new-window "%page%"
    exit /b
  )
)
start "" "%page%"
