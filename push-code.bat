@echo off
title Push Code to GitHub - Rapphimchill
cd /d "%~dp0"
set "PATH=C:\Program Files\Git\cmd;C:\Program Files\Git\bin;%PATH%"

echo ========================================================
echo   DANG PUSH CODE LEN GITHUB: dinhphuong25/rapphimchill-main
echo   Neu trinh duyet bat len, ban hay bam "Sign in with your browser"
echo ========================================================
echo.
git push origin main
echo.
if %ERRORLEVEL% EQU 0 (
    echo [THANH CONG] Toan bo code da duoc day len GitHub thanh cong!
) else (
    echo [CHUYEN HUONG] Neu gap loi xac thuc, vui long thu lai hoac kiem tra quyen repo.
)
echo.
pause
