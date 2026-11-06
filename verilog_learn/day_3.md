# Module cseladd
## mine
```verilog
module top_module(
    input [31:0] a,
    input [31:0] b,
    output [31:0] sum
);
    wire [15:0] sum_b, sum_c;
    wire cout_a;
    
    //实例化A（sum直接进入sum[15：0],cout_a进入 选择器）
    add16 add_a(
        .a(a[15:0]),
        .b(b[15:0]),
        .cin(0),
        .cout(cout_a),
        .sum(sum[15:0])
    );  
	//实例化BC（sum_b,sum_c进入 选择器）
    add16 add_b(
        .a(a[31:16]),
        .b(b[31:16]),
        .cin(0),
        .cout(),
        .sum(sum_b)
    );
    add16 add_c(
        .a(a[31:16]),
        .b(b[31:16]),
        .cin(1),
        .cout(),
        .sum(sum_c)
    );
    //组合逻辑 选择器
    assign sum[31:16] = (cout_a == 1'b0) ? sum_b:
        								   sum_c;
    
endmodule
```

## ai
其中`.cin(0)`应该改为`.cin(1'b0)`、`.cin(1)`应该改为`.cin(1'b1)`

# Module addsub
## mine
```verilog
module top_module(
    input [31:0] a,
    input [31:0] b,
    input sub,
    output [31:0] sum
);
    wire [31:0] b_del;
    wire [15:0] cout_a;
    
    // sum 的 XOR（异或） 逻辑
    // 输出 b_del
    assign b_del = b ^ {32{sub}};
    
    // add_16实例化
    // add_a 
    		//输入 sub 进 cin
    		//输出 (1)cout_a 进入 add_b 的 cin (2)sum[15:0]
    add16 add_a(
        .a(a[15:0]),
        .b(b_del[15:0]),
        .cin(sub),
        .cout(cout_a),
        .sum(sum[15:0])
    );
    
    add16 add_b(
        .a(a[31:16]),
        .b(b_del[31:16]),
        .cin(cout_a),
        .cout(),
        .sum(sum[31:16])
    );
    
endmodule
```

## ai
**粗心错误**
`wire [15:0] cout_a;`因为实际上add16只输出一位cout，所以应该为`wire cout_a;`
### 看到 wire 声明
一定要在脑子里过一遍：它接收的信号到底是几位的
以后写代码，看到 wire 声明，一定要在脑子里过一遍：它接收的信号到底是几位的？ 保持等号左右两边、端口连接两边的位宽严丝合缝，是优秀硬件工程师的标志。
## 减法是通过加法来实现
在计算机中，没有专门的减法器电路，减法是通过加法来实现的。
公式：a - b = a + (~b) + 
~b：将 b 按位取反。
+ 1：在最低位加 1。
所以，我们需要一个电路：
当 sub = 0（加法）时：计算 a + b。
当 sub = 1（减法）时：计算 a + (~b) + 1。

# assign/always @(*) 和always

`always @(*) `块在硬件综合上，和 assign 语句是完全等价的！ 它们都综合出组合逻辑（Combinational Logic）。
其中的 (*) 是敏感列表。它的意思是：“只要这个块里用到的任何一个输入信号发生变化，就重新执行这个块”

语法铁律：wire vs reg（重点，必考！）
    assign 语句的左边：必须是 wire（线网）类型。
    always 块里的赋值（过程赋值）：左边必须是 reg（寄存器/变量） 类型。

>在 always @(*) 里被赋值的 reg，最终综合出来的硬件并不是寄存器（触发器），而只是普通的导线。它叫 reg 纯粹是因为历史遗留的语法规定。

在 `always @(*) `组合逻辑块里，我们使用 `=`。它的执行就像 C 语言一样，从上到下顺序执行。而未来你在时钟块里会用到非阻塞赋值 `<=`，那时候代码才代表真正的寄存器。

## 既然 assign 也能做，为什么还要引入 always
真实工程中经常有非常复杂的条件判断（比如 if-else 嵌套十几层）。用 assign 写嵌套三目运算符会让人崩溃，而用 always 加上 if-else 或 case 就会极其清晰。

# 阻塞赋值和非阻塞赋值

组合逻辑（Combinational）：`always @(*)`必须使用阻塞赋值（=）
`=`（阻塞赋值）：就像 C 语言，**代码一行行顺序执行**。上一行没跑完，下一行就得等着（阻塞）。

时序逻辑（Clocked/Sequential）：`always @(posedge clk)`必须使用非阻塞赋值（<=）
`<=`（非阻塞赋值）：在时钟沿到来时，**所有 `<= `右边的值会同时被计算出来**，然后**同时赋值**给左边。这完美模拟了真实硬件中，所有触发器在同一时刻“齐步走”的物理特性。

# Always if

在硬件设计中，if 语句会被综合工具翻译成一个 MUX（数据选择器）

`always @(*) if (condition) out = x; else out = y;`完全等价于 `assign out = (condition) ? x : y;`

在 `always @(*)` 块里写 if，一定要有 else；写 `case`，一定要有 `default`。保证所有分支下，被赋值的变量都有确定的值！
>如果你在 `always `块里写了 `if`，但忘了写` else`（比如只在条件为真时赋值），综合工具会认为：“哦，条件不成立的时候，你希望它记住上一次的值”。这会综合出一个 Latch（锁存器）！锁存器在同步电路设计中是极其不受欢迎的（会导致时序难以分析）

## mine
```verilog
// synthesis verilog_input_version verilog_2001
module top_module(
    input a,
    input b,
    input sel_b1,
    input sel_b2,
    output wire out_assign,
    output reg out_always   ); 

    assign out_assign = (sel_b1 & sel_b2) ? b:
        									a;
    always@(*)begin
        if(sel_b1 & sel_b2)begin out_always = b; end
            else begin out_always = a; end
    end
    
endmodule
```
## ai
在 if 的判断条件中，通常更习惯写逻辑运算符 &&，表示“条件A与条件B同时成立”。

# Always 使用 case

case 语句的语法特色

1. 不需要 break：在 C 语言里，switch 语句如果不写 break，会“贯穿”执行。但在 Verilog 中，每个 case 分支执行完会自动跳出，所以不需要写 break。
2. 多语句用 begin...end：如果一个分支里有多行代码，必须用 begin 和 end 包裹起来。只有一行代码的话，可以像 C 语言一样省略。
3. 必须有 default：而你没写 default，综合工具就会懵圈，从而给你生成一个 Latch。加上 default 是避免 Latch 的终极武器。
```verilog
always @(*) begin  // This is a combinational circuit
        case(sel)
            // 如果 sel 等于 0, 1, 2... 选对应的 data
            3'd0: out = data0;
            3'd1: out = data1;
            3'd2: out = data2;
            3'd3: out = data3;
            3'd4: out = data4;
            3'd5: out = data5;
            // 题目要求：否则输出 0。也刚好用来防止 Latch 产生！
            default: out = 4'd0; 
        endcase
    end
```
> case语句没有begin，只有endcase
> default 后面也有：

# Always 使用 casez

在`casez(in)`中使用`?`，我们可以把不关心的位屏蔽掉：

如果 in[0] 是 1，后面的位是什么都不重要了。写成 8'b???????1。

如果 in[0] 是 0，in[1] 是 1，后面的位就不重要了。写成 8'b??????10。

依此类推……

关键点：**匹配顺序**！
casez/case 语句是**从上往下**执行的。所以，优先级最高（也就是**最低位**）的条件必须写在最上面。只要匹配到一个，后面的就不看了。

# Always 避免 Latch

工业界极其推崇的标准写法：
在 always 块的最开头，先**把所有输出的默认值全写了（一般全写 0）**，然后再写 case 语句。

好处：因为你开头已经给所有变量赋了 0，所以如果输入匹配到了某个 case，它就会覆盖那个 0 变成 1；如果没匹配到，它自然就是 0。这样就绝对不会产生 Latch，而且连 default 都不需要写了！

硬件本质：虽然代码是一行行往下写的，但**综合出来的硬件是一个多路选择器**。它的逻辑是：“**默认输出 0**，当 scancode 等于特定值时，某一个输出拉高为 1”。
```verilog
module top_module (
    input [15:0] scancode,
    output reg left,
    output reg down,
    output reg right,
    output reg up  ); 

    always @(*) begin
        // 第一步：先给所有输出赋默认值 0（防止 Latch）
        up = 1'b0; 
        down = 1'b0; 
        left = 1'b0; 
        right = 1'b0;
        
        // 第二步：条件匹配
        case (scancode)
            16'he06b: left = 1'b1;
            16'he072: down = 1'b1;
            16'he074: right = 1'b1;
            16'he075: up = 1'b1;
            // 因为上面已经默认全是 0 了，这里不需要再写 default 了
        endcase
    end

endmodule
```

# 三目运算符和硬件思维

```verilog
module top_module (
    input [7:0] a, b, c, d,
    output [7:0] min);

    // 声明中间连线（存放两两比较的结果）
    wire [7:0] min_ab;
    wire [7:0] min_cd;

    // 第一步：找出 a 和 b 的较小值
    assign min_ab = (a < b) ? a : b;

    // 第二步：找出 c 和 d 的较小值
    assign min_cd = (c < d) ? c : d;

    // 第三步：在两组胜者中决出最终的冠军（最小值）
    assign min = (min_ab < min_cd) ? min_ab : min_cd;

endmodule
```

> 不声明中间 wire，全写一行可以吗？
采用嵌套写法。你可以写成：
`assign min = (a < b ? a : b) < (c < d ? c : d) ? (a < b ? a : b) : (c < d ? c : d);`
你看，虽然只有一行，但这代码既难读，而且同样的逻辑被计算了多次，硬件综合出来的效果可能会很臃肿。所以，像参考答案那样**拆解分步写，才是最优美、最符合硬件思维**的写法。

# 按位操作 和 归约操作
Bitwise（按位操作）：两个操作数（比如 a & b），位对位运算，结果是多位的。

Reduction（归约操作）：只有一个操作数（Unary operator），把向量里的所有位“归约”成一个 1-bit 的结果。

    & in：如果 in 所有位都是 1，结果为 1；否则为 0。

    | in：如果 in 只要有一位是 1，结果就是 1。

    ^ in：把 in 的所有位拿来做异或。

# for循环

在软件里，for 循环是跑 100 次。

在硬件描述里，for 循环会被综合器“展平（Unroll）”。也就是说，综合器会自动帮你把这**100 次循环展开成 100 根交错连接的导线，没有任何时序延迟**。**for循环的本质是电路的复制**。

```verilog
integer i;
    
    always @(*) begin
        // 循环 100 次，把输入的最低位给输出的最高位，依次翻转
        for (i = 0; i < 100; i = i + 1) begin
            out[i] = in[99 - i]; 
        end
    end
```

>在 Verilog 中，for 循环的循环变量必须声明为 integer（32位有符号整数）类型，不能用 wire 或 reg 声明循环计数器。

# generate for 循环
实例化模块时，必须在模块顶层（always 块外）使用 generate ... endgenerate 配合 for 循环。

## 例化 100 次全加器（full adder）

```verilog
// 声明一根 101 位的内部进位线，carry[0] 接外部 cin，carry[100] 是最终进位
wire [100:0] carry;
assign carry[0] = cin;

// 声明 genvar 循环变量
genvar i;

// 使用 generate 块进行批量实例化
generate
    for (i = 0; i < 100; i = i + 1) begin : adder_loop
        fadd fa_inst (
            .a(a[i]),
            .b(b[i]),
            .cin(carry[i]),      // 接收上一位的进位
            .sum(sum[i]),
            .cout(carry[i+1])    // 产生当前位的进位
        );
    end
endgenerate
```
> 使用genvar 声明循环变量 ： genvar i;
> begin : 后加标签名 adder_loop
> 101 位的内部进位线，carry[0] 接外部 cin，carry[100] 是最终进位
> 先画模块图（外/内部信号），确定输入输出，再写代码


a[i*4 +: 4] 的意思是：从 i*4 开始，往高位（+）取 4 个 bit。这等价于 a[i*4+3 : i*4]。这种语法不仅规范，而且方便。
```
// 使用 +: 语法提取 4 位切片
    .a(a[i*4 +: 4]),   
    .b(b[i*4 +: 4]),
    .cin(carry[i]),
    .cout(carry[i+1]),
    .sum(sum[i*4 +: 4])
```