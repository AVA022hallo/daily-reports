# 模块化与参数化设计、
## 层次划分

Verilog 设计是树形结构：

```text
top（顶层）
├── u_reg8   : param_reg #(.WIDTH(8))
├── u_reg16  : param_reg #(.WIDTH(16))
└── u_ctrl   : ctrl_unit
    ├── u_fsm
    └── u_counter
```

- **顶层**：只做例化、连线、参数配置，尽量不写复杂逻辑。
- **子模块**：实现单一功能，通过端口对外暴露接口。
- **层次划分**：把大设计拆成“功能单一、接口清晰、可复用”的子模块。

| 原则 | 说明 |
|---|---|
| 功能单一 | 一个模块只做一件事，如寄存器、计数器、FSM |
| 接口清晰 | 端口方向、位宽、含义明确，命名一致 |
| 可复用 | 用 `parameter` 让同一模块适配不同位宽/深度 |
| 顶层薄 | 顶层只连线，不放算法逻辑 |
| 层次不过深 | 一般 3~4 层，过深难调试 |

**要点**：顶层不写 `always`，只例化；子模块通过端口通信，不靠全局变量。

## parameter / localparam 对比表

| 对比项 | `parameter` | `localparam` |
|---|---|---|
| 定义位置 | 模块参数列表 `#(...)` 或模块体内 | 模块体内 |
| 能否在例化时覆盖 | **能**，`#(.WIDTH(8))` | **不能**，外部不可改 |
| 作用域 | 模块内，可被例化覆盖 | 模块内常量 |
| 典型用途 | 位宽、深度、初值、分频系数等可配置项 | 由参数推导出的内部常量，如 `ZERO`、状态编码 |
| 综合影响 | 综合前确定，生成对应硬件 | 同左，纯常量 |
| 可读性 | 对外接口的一部分 | 内部实现细节 |

```verilog
module param_reg #(
    parameter WIDTH = 8,          // 可被例化覆盖
    parameter INIT  = 0           // 可被例化覆盖
)(
    input  wire             clk,
    input  wire             rst_n,
    input  wire [WIDTH-1:0] din,
    output reg  [WIDTH-1:0] dout
);
    // 由 WIDTH 推导的内部常量，不允许外部改
    localparam ZERO = {WIDTH{1'b0}};

    always @(posedge clk or negedge rst_n) begin
        if (!rst_n) dout <= INIT[WIDTH-1:0];
        else        dout <= din;
    end
endmodule
```
> **对外可配置 → `parameter`；内部推导常量 → `localparam`。**
>
> 能用 `localparam` 就不用 `parameter`，减少对外暴露。

## 端口声明要点

**推荐 ANSI 风格**

```verilog
module param_reg #(
    parameter WIDTH = 8
)(
    input  wire             clk,     // 时钟
    input  wire             rst_n,   // 低有效复位
    input  wire [WIDTH-1:0] din,     // 参数化位宽
    output reg  [WIDTH-1:0] dout
);
```

| 要点 | 说明 |
|---|---|
| 方向 | `input` / `output` / `inout`，`inout` 少用 |
| 类型 | 默认 `wire`；`output` 在 `always` 中赋值必须声明 `reg`（或 `logic`） |
| 位宽 | 用参数：`[WIDTH-1:0]`，不要写死 `[7:0]` |
| 端口顺序 | 惯例：`clk`、`rst_n` 在前，数据在后 |
| 命名 | 低有效加 `_n`，如 `rst_n`、`cs_n` |
| 不要悬空 | 未用输出可悬空，未用输入必须接常量 |
| 位宽匹配 | 例化时连线位宽与端口一致，避免隐式截断 |

## 例化

按名称例化（推荐）

```verilog
param_reg #(
    .WIDTH(8),
    .INIT(0)
) u_reg8 (
    .clk  (clk),
    .rst_n(rst_n),
    .din  (din8),
    .dout (dout8)
);
```

- 参数用 `#(.WIDTH(8))`，端口用 `.port(signal)`。
- 顺序无关，可读性最好，工程首选。

## 易错点

EP4CE10F17C8

