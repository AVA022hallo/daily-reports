 module counter_param #(
    parameter integer W   = 4,
    parameter integer MAX = (1 << W) - 1
)(
    input  wire         clk,
    input  wire         rst_n,    // 异步复位，低有效
    input  wire         en,       // 计数使能
    input  wire         load,     // 同步加载
    input  wire         up_down,  // 1=加，0=减
    input  wire [W-1:0] din,      // 加载值
    output reg  [W-1:0] q,        // 当前计数值
    output wire         tc        // 终端计数，电平
);

always@(posedge clk or negedge rst_n)begin
	if(!rst_n)begin
		q <= 0;
	end
	else if(load)begin
		q <= din;
	end
	else if(en)begin
		if(up_down == 1)begin
			if(q == {W{1'b1}})	q <= 0;
			else q <= q + 1'b1;
		end
		else begin
			if(q == 0)	q <= {W{1'b1}};
			else q <= q - 1'b1;
		end
	end
end

assign tc = (up_down) ? (q == MAX): (q == 0) ;

endmodule 