`timescale 1ns / 1ps
// ==========================================
// File Name   : seg7_decode.v
// Description : Top module for seg7_decode
// ==========================================
module seg7_decode (
    // TODO: Add your ports here
    input a,
    input b,
    input c,
    output [7:0] out
);
    wire [3:0] combine;
    assign combine = {a, b, c};

    // TODO: Write your logic here
    assign out = (combine == 3'd0) ? 8'b00000000:
                 (combine == 3'd1) ? 8'b00000010:
                 (combine == 3'd2) ? 8'b00000100:
                 (combine == 3'd3) ? 8'b00001000:
                 (combine == 3'd4) ? 8'b00010000:
                 (combine == 3'd5) ? 8'b00100000:
                 (combine == 3'd6) ? 8'b01000000:
                 (combine == 3'd7) ? 8'b10000000:
                                     8'd0;
    
//    always@(*)begin
//        case({a,b,c})
//            3'b001: out = 8'b00000001;
//            3'b010: out = 8'b00000
//            default: out = 8'b00000000;
//        endcase
//    end
    
endmodule
