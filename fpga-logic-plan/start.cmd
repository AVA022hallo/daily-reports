@echo off
chcp 65001 >nul
setlocal
cd /d "%~dp0"

where python >nul 2>nul
if errorlevel 1 (
  echo [x] 没有找到 python，请直接双击 index.html 打开（若提示存储不可用，再装 Python 或用其它静态服务器）。
  pause
  exit /b 1
)

echo [i] 正在启动本地服务 http://127.0.0.1:8777 ...
start "fpga-plan-server" /min cmd /c "python -m http.server 8777 --bind 127.0.0.1"
timeout /t 2 >nul
start "" "http://127.0.0.1:8777/index.html"

echo.
echo [i] 页面已在浏览器打开。关闭本窗口不会停止服务；
echo     如需停止，请在任务管理器结束那个最小化的 python 窗口，或执行：
echo     taskkill /f /fi "windowtitle eq fpga-plan-server*"
echo.
timeout /t 3 >nul
