# & "D:\WorkApp\Quartus13.0windows\quartus\bin64\quartus_sh.exe" -t quartus_auto_setup.tcl LED_Blink_Project
# ==========================================
# 1. 获取外部传入的工程主文件夹名字
# ==========================================
# $argv 用于获取命令行参数，如果没传参数，默认叫 "my_new_project"
if {[llength $argv] > 0} {
    set root_dir [lindex $argv 0]
} else {
    set root_dir "my_new_project"
    puts "Warning: No folder name provided. Using default: $root_dir"
}

# 创建主文件夹
if {![file exists $root_dir]} {
    file mkdir $root_dir
    puts "Created root directory: $root_dir"
} else {
    puts "Root directory already exists: $root_dir"
}

# ==========================================
# 2. 在主文件夹下创建标准目录结构
# ==========================================
set dirs {doc img prj rtl testbench}

foreach dir $dirs {
    set target_dir [file join $root_dir $dir]
    if {![file exists $target_dir]} {
        file mkdir $target_dir
        puts "Created sub-directory: $target_dir"
    }
}

# ==========================================
# 3. 进入 prj 目录准备创建 Quartus 工程
# ==========================================
cd [file join $root_dir prj]

package require ::quartus::project

# 我们直接用主文件夹的名字作为工程名
set project_name $root_dir
set top_entity "top_module"

# 创建新工程
project_new $project_name -overwrite

# ==========================================
# 4. 基础全局设置
# ==========================================
set_global_assignment -name FAMILY "Cyclone IV E"
set_global_assignment -name DEVICE EP4CE10F17C8
set_global_assignment -name TOP_LEVEL_ENTITY $top_entity

# ==========================================
# 5. 添加设计文件和仿真文件 (注意相对路径)
# ==========================================
# 注意：如果你还没有写这些 .v 文件，请先将下面几行用 "#" 注释掉，否则 Quartus 会找不到文件
# set_global_assignment -name VERILOG_FILE ../rtl/top_module.v
# set_global_assignment -name VERILOG_FILE ../rtl/sub_module.v
# set_global_assignment -name VERILOG_FILE ../testbench/tb_top_module.v

# ==========================================
# 6. 引脚分配 (示例)
# ==========================================
# set_location_assignment PIN_A12 -to clk
# set_instance_assignment -name IO_STANDARD "3.3-V LVTTL" -to clk

# ==========================================
# 7. 保存并关闭工程
# ==========================================
project_close
puts "Project successfully created in $root_dir/prj"