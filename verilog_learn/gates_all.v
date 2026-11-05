`timescale 1ns/1ps

module gates_all (
    input  wire       a,
    input  wire       b,
    input  wire       c,
    input  wire [3:0] d,
    output wire       y_not,
    output wire       y_buf,
    output wire       y_and,
    output wire       y_nand,
    output wire       y_or,
    output wire       y_nor,
    output wire       y_xor,
    output wire       y_xnor,
    output wire       y_xor3,
    output wire       y_parity,
    output wire       y_eq
);

    // ---------------- ① 门级原语（结构描述）----------------
    not  u_not  (y_not,  a);
    buf  u_buf  (y_buf,  a);
    and  u_and  (y_and,  a, b);
    nand u_nand (y_nand, a, b);
    or   u_or   (y_or,   a, b);
    nor  u_nor  (y_nor,  a, b);
    xor  u_xor  (y_xor,  a, b);
    xnor u_xnor (y_xnor, a, b);
    xor  u_xor3 (y_xor3, a, b, c);        // 多输入异或：奇数个 1 出 1

    // ---------------- ② 数据流描述（assign）----------------
    assign y_parity = ^d;                 // 缩减异或：偶校验位
    assign y_eq     = ~|(d ^ 4'b1010);    // 逐位异或后缩减或非：d == 1010 ?

endmodule
