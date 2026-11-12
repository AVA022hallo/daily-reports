
Verilog 语法（IEEE 1364 标准）的硬性规定：

assign 语句（连续赋值）只能用来驱动 wire 类型。

always 块（过程赋值，无论是组合逻辑 @(*) 还是时序逻辑 @(posedge clk)）内部的左值（即被赋值的信号），必须被声明为 reg 类型。

Vivado 的综合工具（XST 或 Vivado Synthesis）非常聪明。如果你加了 reg，它会在综合报告里明确告诉你：out 被推导为了组合逻辑电路（Combinational logic）。你可以综合完后点开 Schematic（原理图）看一眼，里面绝对没有任何寄存器。