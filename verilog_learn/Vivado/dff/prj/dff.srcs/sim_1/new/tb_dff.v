`timescale 1ns / 1ps
//////////////////////////////////////////////////////////////////////////////////
// Company: 
// Engineer: 
// 
// Create Date: 2026/11/11 13:00:55
// Design Name: 
// Module Name: tb_dff
// Project Name: 
// Target Devices: 
// Tool Versions: 
// Description: 
// 
// Dependencies: 
// 
// Revision:
// Revision 0.01 - File Created
// Additional Comments:
// 
//////////////////////////////////////////////////////////////////////////////////
module tb_dff();

    // ============ 1. 信号声明 ===========
    reg clk, rst_n, en;
    
    reg d;
    
    wire q, q_n;
    
    // ============ 2. 例化 DUT ============
    dff #(
        .W(1)
    )u_dff_1bit(
        .clk(clk),
        .rst_n(rst_n),
        .en(en),
        .d(d),
        .q(q),
        .q_n(q_n)
    );
    
    // ============ 3. 时钟生成 ============
    initial clk = 1'b0;
    always #5 clk = ~clk;
    
    // ============ 4. 波形 dump ============
    initial begin
        $dumpfile("tb_dff_1bit.vcd");
        $dumpvars(0, u_dff_1bit);
    end
    
    // ============ 5. 参考模型（scoreboard） ============
    // 意义：你的 RTL 实现是否等价于一份独立描述的设计意图。
    reg exp_q;

    always @(posedge clk or negedge rst_n) begin
        if (!rst_n) exp_q <= 1'b0;
        else        exp_q <= en ? d : exp_q;
    end
    
    // ============ 6. 自动比对 ============
    integer errors = 0;
    integer checks = 0;
    
    // 在 negedge 采样，避开 posedge 的竞争
    always@(negedge clk)begin
        checks = checks + 1;
        if(q != exp_q)begin
            errors = errors + 1;
            $display("[ERROR] @%0t  q=%b  expect=%b", $time, q, exp_q);
        end
        if(q_n != ~exp_q)begin
            errors = errors + 1;
            $display("[ERROR] @%0t  q=%b  expect=%b", $time, q, exp_q);
        end
    end
    
    // ============ 7. 激励 ============
    initial begin
        rst_n = 1'b0;
        en = 1'b0;
        d = 1'b0;
        // ---- 用例 1：复位有效性 ----
        #12
        if(q != 1'b0)begin
           errors = errors + 1;
           $display("[ERROR] 复位期间 q 不为 0：q = %b", q);
        end
        
        @(negedge clk);// 在 negedge赋值，防止亚稳态
        rst_n = 1'b1;
        
        // ---- 用例 2：en=1，D 跟随 ----
        @(negedge clk);d = 1'b1;en = 1'b1;
        @(negedge clk);d = 1'b0;en = 1'b1;
        @(negedge clk);d = 1'b1;en = 1'b1;
       
        // ---- 用例 3：en=0，保持 ----
        @(negedge clk); en = 1'b0; d = 1'b0;
        @(negedge clk);            d = 1'b1;  
        @(negedge clk);            d = 1'b0;  
        
        // ---- 用例 4：重新打开 en ----
        @(negedge clk); en = 1'b1; d = 1'b1;
        
        // ---- 用例 5：复位期间再次拉低，检查异步立即生效 ----
        @(negedge clk);
        rst_n = 1'b0;
        if(q != 1'b0)begin
           errors = errors + 1;
           $display("[ERROR] 异步复位未生效：q = %b", q);
        end
        
        // ---- 用例 6：复位后再写 ----
        @(negedge clk);
        rst_n = 1'b1;
        
        @(negedge clk);d = 1'b1;en = 1'b1;
        @(negedge clk);d = 1'b0;en = 1'b1;
        
        $finish;
    end
    
    
endmodule
