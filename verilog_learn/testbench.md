# 一、什么是 Testbench

Testbench 是一段不可综合的 Verilog 代码，用来在仿真器中模拟真实硬件环境，给待测模块 DUT 提供激励，并观察输出是否正确。

特点：没有外部端口，模块写成 `module tb_name();`，是一个闭环的虚拟测试环境。

RTL 设计是“造硬件”，Testbench 是“写软件来测试这个硬件”。

# 二、标准四步结构

1. 声明模块：`module tb_name();`
2. 声明信号：连接到 DUT 输入端的信号声明为 `reg`，连接到 DUT 输出端的信号声明为 `wire`。
3. 实例化 DUT：按名称连接端口，`.port_name(signal_name)`。
4. 产生激励：在 `initial` 或 `always` 块中给 `reg` 信号赋值。

# 三、核心语法

## 1. reg 与 wire

在 Testbench 中：

- 需要**主动赋值、产生激励**的信号，用 `reg`。
- 用来**接收 DUT 输出的信号**，用 `wire`，在代码中不被赋值。

## 2. initial 与 always

- `initial` 块在仿真 0 时刻开始执行，只执行一次，常用于初始化信号。
- `always` 块会循环执行，常用于产生时钟。

## 3. 延时符号 #

`#` 表示等待若干个时间单位，只能用于仿真，不可综合。

例如：

```verilog
#5 clk = ~clk;
```

表示等待 5 个时间单位后翻转 clk。

## 4. 时间尺度

通常在 Testbench 顶部写：

```verilog
`timescale 1ns / 1ps
```

表示仿真时间单位是 1ns，精度是 1ps。

HDLbits 中通常不需要写，默认单位是 1。

# 四、时钟激励模板

```verilog
module top_module_tb();

    reg clk;

    dut u_dut (
        .clk(clk)
    );

    initial begin
        clk = 0;
    end

    always begin
        #5 clk = ~clk;
    end

endmodule
```

这个模板中，clk 每 5 个时间单位翻转一次，周期为 10 个时间单位。

# 五、自动化检查与仿真控制 
为了不用肉眼去盯波形图，我们可以用系统函数让仿真器自动帮我们查错和停止。

`$display("...");`：打印信息（类似 C 语言的 printf）。

`$monitor("...");`：持续监控信号，只要信号变化就会自动打印（注意全仿真只能调用一次）。

`$finish;`：强制结束仿真。在 Testbench 中极其重要，否则 always 块会无限循环，导致仿真卡死。

`$stop;`：暂停仿真。

`$time`：获取当前仿真时间。

# 六、避坑指南
1. 忘记写 $finish：会让仿真跑向无限循环，直接卡死你的电脑。

2. 在 Testbench 中给 wire 赋值：绝对会报错！要明白 Testbench 相当于软件，软件里的变量要用 reg。

3. initial 块没有顺序感：如果在 initial 块里写 a=0; b=1;，在 0 时刻它们可能同时生效。如果需要有先后顺序，必须用 # 加上延时隔开。

# 进阶

## 分开写多个 initial 块

时钟用一个 initial + always，激励用了一个单独的 initial 块。在 Testbench 里，多个 initial 块是并行执行的，互不干扰，这样看起来逻辑极其清晰。

```verilog
    // 3. 产生时钟信号
    initial begin
        clk = 0; 
    end
    always begin
        #5 clk = ~clk; 
    end

    // 4. 产生激励信号（严格按照波形图的时间节点）
    initial begin
        // t = 0
        in = 0;
        s = 2;
        
        // t = 15
        #15 s = 6;
        
        // t = 20
        #5  in = 1;
        
        // t = 25
        #5  s = 2;
        
    end

```