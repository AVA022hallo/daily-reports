`timescale 1ns / 1ps
//////////////////////////////////////////////////////////////////////////////////
// Company: 
// Engineer: 
// 
// Create Date: 2026/11/09 20:01:27
// Design Name: 
// Module Name: seg7_decode_tb
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


module seg7_decode_tb();
    
    reg a, b, c;
    wire [7:0] out;
    
    seg7_decode u_seg7_decode(
        .a(a),
        .b(b),
        .c(c),
        .out(out)
    );
    
    initial begin
        {a, b, c} = 3'b000;
        #5;
        {a, b, c} = 3'b001;
        #5;
        {a, b, c} = 3'b010;
        #5;
        {a, b, c} = 3'b011;
        #5;
        {a, b, c} = 3'b100;
        #5;
        {a, b, c} = 3'b101;
        #5;
        {a, b, c} = 3'b110;
        #5;
        {a, b, c} = 3'b111;
        #20; 
        $finish;
    end
    
     

endmodule
