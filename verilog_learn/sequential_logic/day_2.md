# 时钟题
没模块化的时候
```verilog
module top_module(
    input clk,
    input reset,
    input ena,
    output reg pm,
    output reg [7:0] hh,
    output reg [7:0] mm,
    output reg [7:0] ss); 

    wire ss_flag, mm_flag;
    
    always@(posedge clk)begin
        if(reset)	ss <= 0;
        else if(ena)begin
            if((ss[3:0] == 4'd9) & (ss[7:4] == 4'd5))begin
            	ss <= 0;
            end
            else if(ss[3:0] == 4'd9)begin
                ss[3:0] <= 0;
                ss[7:4] <= ss[7:4] + 1'b1;
            end
            else ss[3:0] <= ss[3:0] + 1'b1;
        end
    end
    
    assign ss_flag = ((ss[3:0] == 4'd9) & (ss[7:4] == 4'd5)) ? 1'b1:1'b0;
    
    always@(posedge clk)begin
        if(reset)	mm <= 0;
        else if(ena)begin
            if((mm[3:0] == 4'd9) & (mm[7:4] == 4'd5) & ss_flag)begin
            	mm <= 0;
            end
            else if(mm[3:0] == 4'd9 & ss_flag)begin
                mm[3:0] <= 0;
                mm[7:4] <= mm[7:4] + 1'b1;
            end
            else if(ss_flag) mm[3:0] <= mm[3:0] + 1'b1;
        end
    end
    
    assign mm_flag = (mm[3:0] == 4'd9) & (mm[7:4] == 4'd5) & ss_flag;
    
    always@(posedge clk)begin
        if(reset)	begin
            hh <= {4'd1, 4'd2};
            pm <= 0;
        end
        else if(ena)begin
            if((hh[3:0] == 4'd2) & (hh[7:4] == 4'd1) & mm_flag)begin
                hh <= {4'd0, 4'd1};
            end
            else if(hh[3:0] == 4'd9 & mm_flag)begin
                hh[3:0] <= 0;
                hh[7:4] <= hh[7:4] + 1'b1;
            end
            else if(mm_flag) begin
                hh[3:0] <= hh[3:0] + 1'b1;
                if((hh[3:0] == 4'd1) & (hh[7:4] == 4'd1))begin
                	pm <= ~pm;
                end
            end
        end
    end
    
endmodule

```

采用模块化后，首先构建60进制BCD计数器（计算秒分）和12进制BCD计数器（计算小时），顶层模块将变得极其干净，没有繁琐的 if-else

```verilog
module top_module(
    input clk,
    input reset,
    input ena,
    output pm,
    output [7:0] hh,
    output [7:0] mm,
    output [7:0] ss
); 
    wire ss_carry, mm_carry;
    
    // 秒：永远由 ena 驱动
    bcd_60 sec_counter (
        .clk(clk), .reset(reset), .ena(ena), 
        .q(ss), .carry(ss_carry)
    );
    
    // 分：只有秒进位时才计数
    bcd_60 min_counter (
        .clk(clk), .reset(reset), .ena(ss_carry), 
        .q(mm), .carry(mm_carry)
    );
    
    // 时：只有分进位时才计数，同时输出 PM
    bcd_12 hour_counter (
        .clk(clk), .reset(reset), .ena(mm_carry), 
        .q(hh), .carry(), // 这里的 carry 没用到，留空
        .pm(pm)
    );

endmodule
```

# 分频器

```verilog
// 1. 动态计算计数器所需的位宽，节省资源
localparam integer CNT_WIDTH = $clog2(DIV);
reg [CNT_WIDTH-1:0] counter;
```
`$clog2`可以动态计算位宽


```verilog
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
```
`(DIV+1)/2 `可以统一处理奇偶分频