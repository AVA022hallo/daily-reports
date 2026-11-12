module clk_div #(
    parameter integer DIV = 4   // 分频比，>=2
)(
    input  wire clk_in,
    input  wire rst_n,    // 异步复位，低有效
    output reg  clk_out
);

    // 1. 动态计算计数器所需的位宽，节省资源
    localparam integer CNT_WIDTH = $clog2(DIV);
    reg [CNT_WIDTH-1:0] counter;

    always @(posedge clk_in or negedge rst_n) begin
        if (!rst_n) begin
            counter <= 0;
            clk_out <= 1'b0;
        end 
        else begin
            // 2. 计数器循环逻辑
            if (counter == DIV - 1) begin
                counter <= 0;
            end 
            else begin
                counter <= counter + 1'b1;
            end
            
            // 3. 输出逻辑：利用 (DIV+1)/2 统一处理奇偶分频
            if (counter < (DIV + 1) / 2) begin
                clk_out <= 1'b1;  // 前半段输出高电平
            end 
            else begin
                clk_out <= 1'b0;  // 后半段输出低电平
            end
        end
    end

endmodule