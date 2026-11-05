`timescale 1ns/1ps

module tb_gates_all;

    reg  a, b, c;
    reg  [3:0] d;

    wire y_not, y_buf, y_and, y_nand, y_or, y_nor;
    wire y_xor, y_xnor, y_xor3, y_parity, y_eq;

    // 期望值（黄金模型）
    reg  e_not, e_buf, e_and, e_nand, e_or, e_nor;
    reg  e_xor, e_xnor, e_xor3, e_parity, e_eq;

    integer i, errors;

    gates_all dut (
        .a(a), .b(b), .c(c), .d(d),
        .y_not(y_not), .y_buf(y_buf), .y_and(y_and), .y_nand(y_nand),
        .y_or(y_or), .y_nor(y_nor), .y_xor(y_xor), .y_xnor(y_xnor),
        .y_xor3(y_xor3), .y_parity(y_parity), .y_eq(y_eq)
    );

    // 用运算符直接算期望值
    always @(*) begin
        e_not    = ~a;
        e_buf    =  a;
        e_and    =  a & b;
        e_nand   = ~(a & b);
        e_or     =  a | b;
        e_nor    = ~(a | b);
        e_xor    =  a ^ b;
        e_xnor   =  a ~^ b;
        e_xor3   =  a ^ b ^ c;
        e_parity = ^d;
        e_eq     = (d == 4'b1010);
    end

    // 自检任务：把 11 个输出拼成向量，一次比较完
    task check_all;
        begin
            if ({y_not, y_buf, y_and, y_nand, y_or, y_nor,
                 y_xor, y_xnor, y_xor3, y_parity, y_eq}
                !==
                {e_not, e_buf, e_and, e_nand, e_or, e_nor,
                 e_xor, e_xnor, e_xor3, e_parity, e_eq}) begin
                errors = errors + 1;
                $display("  [FAIL] @%0t  a=%b b=%b c=%b d=%04b", $time, a, b, c, d);
                $display("         got %b %b %b %b %b %b %b %b %b %b %b",
                         y_not, y_buf, y_and, y_nand, y_or, y_nor,
                         y_xor, y_xnor, y_xor3, y_parity, y_eq);
                $display("         exp %b %b %b %b %b %b %b %b %b %b %b",
                         e_not, e_buf, e_and, e_nand, e_or, e_nor,
                         e_xor, e_xnor, e_xor3, e_parity, e_eq);
            end
        end
    endtask

    // 波形
    initial begin
        $dumpfile("tb_gates_all.vcd");
        $dumpvars(0, tb_gates_all);
    end

    initial begin
        errors = 0;
        $display("============================================================");
        $display(" a b c |  d   | not buf and nand or nor xor xnor xor3 par eq");
        $display("============================================================");

        // 穷举 8 组输入
        for (i = 0; i < 8; i = i + 1) begin
            {a, b, c} = i[2:0];
            d = i[2:0];
            #10;
            $display(" %b %b %b | %04b | %b %b  %b   %b   %b  %b   %b  %b   %b   %b  %b",
                     a, b, c, d, y_not, y_buf, y_and, y_nand, y_or, y_nor,
                     y_xor, y_xnor, y_xor3, y_parity, y_eq);
            check_all;
        end

        // 定向测试：d = 1010 时相等标志应为 1
        d = 4'b1010;
        #10;
        $display("------------------------------------------------------------");
        $display("directed: d=%04b -> parity=%b eq=%b", d, y_parity, y_eq);
        check_all;

        // 4 态演示：a = x 时各门如何传播
        a = 1'bx; b = 1'b1; c = 1'b0;
        #10;
        $display("X 传播: a=x b=1 -> and=%b or=%b xor=%b nand=%b xnor=%b",
                 y_and, y_or, y_xor, y_nand, y_xnor);
        $display("------------------------------------------------------------");

        if (errors == 0) $display("PASS: 全部向量通过");
        else             $display("FAIL: %0d 处不一致", errors);
        $finish;
    end

endmodule
