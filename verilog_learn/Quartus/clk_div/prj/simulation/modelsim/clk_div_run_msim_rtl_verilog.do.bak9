transcript on
if {[file exists rtl_work]} {
	vdel -lib rtl_work -all
}
vlib rtl_work
vmap work rtl_work

vlog -vlog01compat -work work +incdir+D:/WorkProject/Project_TID/daily-reports/verilog_learn/Quartus/clk_div/rtl {D:/WorkProject/Project_TID/daily-reports/verilog_learn/Quartus/clk_div/rtl/clk_div.v}

vlog -vlog01compat -work work +incdir+D:/WorkProject/Project_TID/daily-reports/verilog_learn/Quartus/clk_div/prj/../testbench {D:/WorkProject/Project_TID/daily-reports/verilog_learn/Quartus/clk_div/prj/../testbench/tb_clk_div.v}

vsim -t 1ps -L altera_ver -L lpm_ver -L sgate_ver -L altera_mf_ver -L altera_lnsim_ver -L cycloneive_ver -L rtl_work -L work -voptargs="+acc"  tb_clk_div

add wave *
view structure
view signals
run -all
