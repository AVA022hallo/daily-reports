# 参考命令
# .\new.bat seg7_decode

# ==========================================
# 1. 获取外部传入的工程主文件夹名字
# ==========================================
if {[llength $argv] > 0} {
    set root_dir [file normalize [lindex $argv 0]]
} else {
    set root_dir [file normalize "my_new_project"]
    puts "Warning: No folder name provided. Using default: $root_dir"
}

set project_name [file tail $root_dir]
set top_entity   $project_name

if {![file exists $root_dir]} {
    file mkdir $root_dir
    puts "Created root directory: $root_dir"
}

# ==========================================
# 2. 在主文件夹下创建标准目录结构
# ==========================================
set extra_dirs {doc img rtl testbench}
foreach dir $extra_dirs {
    set target_dir [file join $root_dir $dir]
    if {![file exists $target_dir]} {
        file mkdir $target_dir
        puts "Created sub-directory: $target_dir"
    }
}

# ==========================================
# 3. 自动生成顶层 Verilog 文件 (已去掉默认端口)
# ==========================================
set rtl_file [file join $root_dir rtl "${top_entity}.v"]

if {![file exists $rtl_file]} {
    set fp [open $rtl_file w]
    puts $fp "`timescale 1ns / 1ps"
    puts $fp "// =========================================="
    puts $fp "// File Name   : ${top_entity}.v"
    puts $fp "// Description : Top module for ${project_name}"
    puts $fp "// =========================================="
    puts $fp "module ${top_entity} ("
    puts $fp "    // TODO: Add your ports here"
    puts $fp ");"
    puts $fp ""
    puts $fp "    // TODO: Write your logic here"
    puts $fp ""
    puts $fp "endmodule"
    close $fp
    puts "Created RTL top file: $rtl_file"
}

# ==========================================
# 4. 创建 Vivado 工程
# ==========================================
set project_dir [file join $root_dir prj]
create_project $project_name $project_dir -part xc7z020clg484-1 -force
puts "Created Vivado project: $project_dir/$project_name.xpr"

# ==========================================
# 5. 将生成的顶层文件添加进工程并设属性
# ==========================================
add_files -norecurse [list $rtl_file]

set_property target_language Verilog [current_project]
set_property default_lib xil_defaultlib [current_project]

set_property top $top_entity [current_fileset]
update_compile_order -fileset sources_1

# ==========================================
# 6. 保存并关闭工程
# ==========================================
close_project
puts "Project successfully created in $project_dir"