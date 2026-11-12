`timescale 1ns / 1ps

module tb_counter_param();
	// ============ 1. 信号声明 ============
	parameter W = 4;
	
	reg clk, rst_n, en, load, up_down;
	reg [W-1:0] din;
	
	wire [W-1:0] q;
	wire tc;
	
	// ============ 2. 例化 DUT ============
	counter_param#(
		.W(W)
	)u_counter_param(
		.clk(clk),
		.rst_n(rst_n),
		.en(en),
		.load(load),
		.up_down(up_down),
		.din(din),
		.q(q),
		.tc(tc)
	);
	
	// ============ 3. 时钟生成 ============
	initial clk = 0;
	always #5 clk = ~clk;
	
	// ============ 6. 自动比对 ============
   integer errors = 0;
	 
	// ============ 7. 激励 ============
	initial begin
		rst_n = 0;
		en = 0;
		load = 0;
		up_down = 0;
		din = {W{1'b0}};
		
		// 用例1：测试复位有效性
		// 用例2：load = 1，en = 0, d = 1'd1
		// 用例3：load = 1，en = 1, d = 1'd0
		// 用例3：加计数回卷，同时看tc
		// 用例4：减计数回卷，同时看tc
		// 用例5：加计数中改为减计数
		// 用例6：减计数中改为加计数
		// 用例7：加计数中reset_n = 0检查异步复位
		// 用例8：改变计数位宽测试加减计数
		
		// 用例1：测试复位有效性
		#12
		if(q != {W{1'b0}})begin
			errors = errors + 1;
			$display("[ERROR] reset failed：q = %b", q);
		end
		
		@(negedge clk); rst_n =1'b1; //解除复位
		
		// 用例2：load = 1，en = 0, d = 1'd1
		@(negedge clk); load = 1'b1; en = 1'b0; 
		din = {W{1'b1}};
		
		@(posedge clk); //上升沿来的时候检测
		# 1;
		if(q != din)begin
			errors = errors + 1;
			$display("[ERROR] load failed!：q = %b", q);
		end
		
		// 用例3：load = 1，en = 1, d = 1'd0
		@(negedge clk); load = 1'b1; en = 1'b1; din = {W{1'b0}};
		
		@(posedge clk); //上升沿来的时候检测
		if(q != din)begin
			errors = errors + 1;
			$display("[ERROR] priority failed!：q = %b", q);
		end
		
		// 用例3：加计数回卷，同时看tc
		@(negedge clk); 
		load = 1'b1; 
		up_down = 1'b1;
		din = {W{1'b0}}; 
		
		@(negedge clk); 
		load = 1'b0;
		en = 1'b1; 
		
		#155;
		
		@(posedge clk); //上升沿来的时候检测
		if(q != {W{1'b1}})begin
			errors = errors + 1;
			$display("[ERROR] up failed!：q = %b", q);
		end
		if(tc != 1'b1)begin
			errors = errors + 1;
			$display("[ERROR] up tc failed!：q = %b", q);
		end
		
		// 用例4：减计数回卷，同时看tc
		@(negedge clk); 
		load = 1'b1; 
		up_down = 1'b0;
		din = {W{1'b1}}; 
		
		@(negedge clk); 
		load = 1'b0;
		en = 1'b1;
		
		#155;
		
		@(posedge clk); //上升沿来的时候检测
		if(q != {W{1'b0}})begin
			errors = errors + 1;
			$display("[ERROR] down failed!：q = %b", q);
		end
		if(tc != 1'b1)begin
			errors = errors + 1;
			$display("[ERROR] up tc failed!：q = %b", q);
		end
		
		$stop;
		
	end
	
endmodule 