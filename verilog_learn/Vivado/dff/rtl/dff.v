`timescale 1ns / 1ps
// ==========================================
// File Name   : dff.v
// Description : Top module for dff
// ==========================================

// D触发器
module dff #(
    parameter integer W = 1
)(
    input  wire         clk,
    input  wire         rst_n,   // 异步复位，低有效
    input  wire         en,      // 时钟使能
    input  wire [W-1:0] d,
    output reg  [W-1:0] q,
    output wire [W-1:0] q_n     // q_n = ~q
);
    
    always@(posedge clk or negedge rst_n)begin
        if(!rst_n)begin
            q <= 0;
        end
        else begin
            q <= en ? d : q;
        end
    end
    
    assign q_n = ~q;
    
endmodule

// JK触发器
module jk_ff (
    input  wire clk,
    input  wire rst_n,
    input  wire en,
    input  wire j,
    input  wire k,
    output reg  q,
    output wire q_n
);
    
    always@(posedge clk or negedge rst_n)begin
        if(!rst_n)begin
            q <= 0;
        end
        else begin
            q <= en ? ((j & ~q)|(~k & q)) : q;
        end
    end
    
    assign q_n = ~q;
    
endmodule

// T触发器
module t_ff (
    input  wire clk,
    input  wire rst_n,
    input  wire en,
    input  wire t,
    output reg  q,
    output wire q_n
);
    always@(posedge clk or negedge rst_n)begin
        if(!rst_n)begin
            q <= 0;
        end
        else begin
            q <= en ? ( t ? ( ~q ): q ): q;
        end
    end
    
    assign q_n = ~q;
    
endmodule