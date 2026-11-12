 `timescale 1ns / 1ps
 
 module tb_clk_div;
	// ============ 1. 信号声明 ============
	reg clk_in, rst_n;
	wire clk_out;
	// ============ 2. 例化 DUT ============
	clk_div#(.DIV(5))u_clk_div(
		.clk_in(clk_in),
		.rst_n(rst_n),
		.clk_out(clk_out)
	);
	
	// ============ 3. 时钟生成 ============
	initial clk_in = 0;
	always #5 clk_in = ~clk_in;
	
	// ============ 7. 激励 ============
	initial begin
	//1.复位
	//2.分频结果
	//3.异步清空
		
		//1.复位
		rst_n = 0;
			// 查看复位结果
		//2.分频结果
		@(negedge clk_in); rst_n = 1; //释放
		#200; // 200/10/4 = 5 即clk_out 应该有两次输出5的高电平
		
		//3.异步清空
		@(negedge clk_in); rst_n = 0;
		
		$stop;
	end
	
 endmodule