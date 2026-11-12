# 复位条件写前边

你写的是 if(!reset)，这在逻辑上完全等价于在 else 里写 if(reset)。

但在数字电路设计中，复位信号（Reset）通常拥有最高优先级。

为了在代码里强调这一点，我们通常会把复位条件写在最前面：
if (reset) ... else ...。

这样别人读代码时，一眼就能看到“复位时会怎样”。

# 同步复位 vs 异步复位
同步复位

```verilog
always @(posedge clk) begin

    if (reset) begin
        //复位区
    end

    else begin
        //正常区
    end
end
```
异步复位
```verilog

always @(posedge clk or posedge areset) begin
    // 即“areset拉高且为1”
    if (areset) begin
        // 一旦 areset 拉高，立即清零
        

    end

    else begin
        // 正常工作时，在时钟上升沿传数据
        
    end

end
```

异步复位信号如果刚好在时钟沿附近发生跳变，会导致触发器输出处于亚稳态（Metastability）（既不是 0 也不是 1，电路会发疯）。

所以工业界通常的标配是：异步复位，同步释放（Asynchronous Reset, Synchronous Release）。

这个知识点你以后会在跨时钟域（CDC）和复位设计里反复遇到。

# 不需要写 else 保持原值

```verilog
if (byteena[0]) 
    q[7:0] <= d[7:0];   // 低字节使能
```
在 `always @(posedge clk) `块里，如果条件不满足（比如 `byteena[0] == 0`），综合工具会自动推断出触发器要保持状态。

# D触发器搭建JK触发器
需要根据题目给的真值表，推导出 D 触发器输入端的逻辑表达式（也就是下一状态 Qnext）。

当前状态Qold也当作一个输入变量，根据 J 和 K 的值，得出Qnext

# 上升沿检测器（Rising Edge Detector）

​要判断信号是不是“刚刚发生改变”，你必须知道它“之前是什么状态”。

1. 打一拍（引入时序）：你需要一个 8-bit 的 D 触发器（寄存器），把当前的输入 in 存起来。这个存起来的值，就是上一个时钟周期的 in。

2. 比较（组合逻辑）：当前的 in 和上一拍的 in_reg 进行比较。

要检测上升沿（0 -> 1），条件就是：当前是 1，且上一拍是 0。

逻辑表达式：pedge = in & (~in_reg)。
 
# 组合（assign）时序（always）？

1. 需要“记住”状态的，放在 always @(posedge clk) 里
触发器（DFF）、寄存器、计数器、移位寄存器、状态机。

判定特征：在时钟沿到来之前，它必须保持不变。 比如你的 in_reg（记住上一拍的 in），比如 out（记住捕获到的边沿）。

2. 只是“算一下”，不需要记忆的，放在 assign 里
各种逻辑门、加法器、多路选择器（MUX）、比较器。

判定特征：输入一变，输出立刻跟着变，哪怕没有时钟。 比如你的边沿计算公式 ~in & in_reg。

# else if

复位 > 使能 > 计数

```verilog
    always @(posedge clk) begin
        if (reset) begin
            q <= 4'd0;
        end
        else if (slowena) begin // 把 slowena 作为 else if 的条件
            if (q == 4'd9) 
                q <= 4'd0;
            else 
                q <= q + 1'b1;
        end
        // 如果 reset 为 0 且 slowena 为 0，没有 else 分支，
        // 寄存器会自动保持原值，这就省去了一行代码。
    end

```

# 计数器容易忽略
计算到最大值如果依旧**在使能**才会在下一个上升沿重置,
所以 重置信号 = reset|((Q == 最大值) & 使能);

# “多级级联计数器”时最容易犯的逻辑漏洞

以1000计数器为例

个位与十位都为9，而不是十位满就进位

错误：`assign c_enable[2] = (q_1 == 4'd9);`
正确：`assign c_enable[2] = (q_1 == 4'd9) & (q_0 == 4'd9);`