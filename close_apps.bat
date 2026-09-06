@echo off
title Close Desktop Applications
echo ===========================================
echo   Closing Desktop Applications...
echo ===========================================
echo.

:: Close Google Chrome
taskkill /IM chrome.exe /F 2>nul
if %ERRORLEVEL% EQU 0 (
    echo [OK] Google Chrome closed.
) else (
    echo [-] Google Chrome was not running.
)

:: Close Microsoft Edge
taskkill /IM msedge.exe /F 2>nul
if %ERRORLEVEL% EQU 0 (
    echo [OK] Microsoft Edge closed.
) else (
    echo [-] Microsoft Edge was not running.
)

:: Close Windows Settings
taskkill /IM SystemSettings.exe /F 2>nul
if %ERRORLEVEL% EQU 0 (
    echo [OK] Windows Settings closed.
) else (
    echo [-] Windows Settings was not running.
)

:: Close Calculator
taskkill /IM CalculatorApp.exe /F 2>nul
taskkill /IM calc.exe /F 2>nul
if %ERRORLEVEL% EQU 0 (
    echo [OK] Calculator closed.
) else (
    echo [-] Calculator was not running.
)

:: Close Notepad
taskkill /IM notepad.exe /F 2>nul
if %ERRORLEVEL% EQU 0 (
    echo [OK] Notepad closed.
) else (
    echo [-] Notepad was not running.
)

echo.
echo ===========================================
echo   Done! All target applications closed.
echo ===========================================
echo.
pause
