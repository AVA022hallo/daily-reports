@echo off
set PROJECT_NAME=%1
if "%PROJECT_NAME%"=="" set PROJECT_NAME=my_new_project

:: 记录当前所在目录，并获取脚本的绝对路径
set ORIG_DIR=%cd%
set SCRIPT_DIR=%~dp0
set TCL_SCRIPT=%SCRIPT_DIR%vivado_auto_setup.tcl

:: 组装工程的绝对路径
set PROJ_ABS=%ORIG_DIR%\%PROJECT_NAME%

:: 提前建好工程的基础目录，避免 Vivado 报错
if not exist "%PROJ_ABS%" mkdir "%PROJ_ABS%"
if not exist "%PROJ_ABS%\prj" mkdir "%PROJ_ABS%\prj"

:: 【核心操作】切换到系统的临时目录去启动 Vivado，让它的垃圾全产生在 Temp 里
cd /d "%TEMP%"

:: 运行 Vivado，把绝对路径传给 Tcl
"D:\WorkApp\Vivado2024_1\Vivado\2024.1\bin\vivado.bat" -mode batch -source "%TCL_SCRIPT%" -tclargs "%PROJ_ABS%" -log "%PROJ_ABS%\prj\vivado.log" -journal "%PROJ_ABS%\prj\vivado.jou"

:: 运行结束，切回原目录
cd /d "%ORIG_DIR%"

:: 暴力清扫：兜底清理可能残留在一开始的目录里的杂物
if exist "vivado.log" del /f /q "vivado.log" >nul 2>&1
if exist "vivado.jou" del /f /q "vivado.jou" >nul 2>&1
if exist ".Xil" rd /s /q ".Xil" >nul 2>&1