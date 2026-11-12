transcript on
if {[file exists rtl_work]} {
	vdel -lib rtl_work -all
}
vlib rtl_work
vmap work rtl_work

vlog -vlog01compat -work work +incdir+D:/WorkProject/Project_TID/daily-reports/verilog_learn/Quartus/counter_param/rtl {D:/WorkProject/Project_TID/daily-reports/verilog_learn/Quartus/counter_param/rtl/counter_param.v}

vlog -vlog01compat -work work +incdir+D:/WorkProject/Project_TID/daily-reports/verilog_learn/Quartus/counter_param/prj/../testbench {D:/WorkProject/Project_TID/daily-reports/verilog_learn/Quartus/counter_param/prj/../testbench/tb_counter_param.v}

vsim -t 1ps -L altera_ver -L lpm_ver -L sgate_ver -L altera_mf_ver -L altera_lnsim_ver -L cycloneive_ver -L rtl_work -L work -voptargs="+acc"  tb_counter_param

add wave *
view structure
view signals
run -all
