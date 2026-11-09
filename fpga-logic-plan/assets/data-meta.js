/* =============================================================================
 * data-meta.js — 计划元数据 v2
 * 面向：华为 硬件技术工程师（实习生）· 逻辑
 * 设计原则：不绑定"几点做什么"，只绑定"学什么、做到什么程度、哪天前完成"
 * ========================================================================== */
(function (root) {
  'use strict';

  /* ------------------------------ 阶段 ------------------------------ */
  /* core      = 本阶段要练成的核心技能
     knowledge = 必须能说清的关键知识
     exit      = 出口标准（做不到就不算过） */
  const phases = [
    {
      id: 'P0', name: '基线校准', color: '#94a3b8',
      goal: '把手上的工具链、资料、已有工程盘一遍，建立可复用的仓库与节奏',
      path: '概念：电路精读 + 工程复盘 → 刷题：Getting Started 2 题 → 产出：工具链自检 / 仓库规范',
      cName: '准备',
      bName: '产出与复盘',
      core: ['工具链闭环（编译 / 仿真 / 下载）', '工程目录与版本管理'],
      knowledge: ['AC620 时钟复位与引脚约束', 'Quartus 工程结构与 qsf', 'ModelSim 独立仿真流程'],
      exit: ['不看教程能跑通 编译 → 仿真 → 下载 三件事', '引脚速查表覆盖 TFT / SDRAM / 以太网 / ADC']
    },
    {
      id: 'P1', name: '组合逻辑与数电', color: '#38bdf8',
      goal: '把组合逻辑打通：数电先讲清概念 → HDLBits 组合真题刷到位 → 再手写可综合模块 → 仿真回归',
      path: '概念：数电①② + 教材模块化 → 刷题：Gates 17 / Mux 5 / Arith 7 / KMap 8 / More Verilog 7 / TB 5 → 手写：组合三件套 + 代码规范',
      bName: '手写模块',
      core: ['可综合 Verilog 子集与编码风格', '组合逻辑设计与化简', '模块化与参数化'],
      knowledge: ['assign 与 always 的分工', '位宽 / 符号扩展 / 拼接 / 截断', '卡诺图化简与无关项', '竞争冒险与组合毛刺'],
      exit: ['HDLBits 组合逻辑 37 题全绿（Gates/Mux/Arith/Kmap）', 'rtl/lib 下组合模块各自有自检 tb 且综合 0 latch', '能手写七段译码/多路选择/参数化加法器并上板验证']
    },
    {
      id: 'P2', name: '时序基础与状态机', color: '#a78bfa',
      goal: '时序三件套（触发器/计数/移位）先刷真题再手写，再进状态机与 UART；形成「概念→真题→手写→上板」的固定节奏',
      path: '概念：数电③触发器 + FSM 方法学 → 刷题：FF 19 / Counters 8 / Shift 12 / FSM 20+13 → 手写：四件套 / 计数器 / 消抖 / 移位 / 数码管 / 手写 FSM / UART / SignalTap',
      bName: '手写模块与板级',
      core: ['触发器 / 计数器 / 移位寄存器', '状态机建模（三段式）', '串行协议实现（UART）'],
      knowledge: ['同步复位 vs 异步复位同步释放', '建立/保持与亚稳态', 'Moore / Mealy 与编码选择', 'UART 帧格式与 16× 过采样'],
      exit: ['HDLBits 时序篇 72 题全绿（FF/计数/移位/FSM）', '四件套/计数器/消抖/移位全部有 tb 且上板', 'UART 命令解析上板，1000 帧零丢包、CRC 错帧被丢弃']
    },
    {
      id: 'P3', name: '跨时钟域与存储', color: '#34d399',
      goal: 'CDC 三类问题、同步/异步 FIFO、BRAM 推断、SDC 约束与 TimeQuest 解读',
      path: '概念：CDC 理论 + 存储资源 → 刷题：Large Circuits 7 + Reading Simulations 15 → 手写：同步/异步 FIFO / 验证 / 断言 / X 域上板 / SDC',
      bName: '手写模块与联调',
      core: ['跨时钟域处理', '同步 / 异步 FIFO 设计', '存储资源推断与存储层次', '时序约束与静态时序分析'],
      knowledge: ['两级同步器与 MTBF', '格雷码指针与空满判断', 'M9K 结构与 RAM 推断', 'SDC：create_clock / IO delay / false path', 'TimeQuest 与关键路径'],
      exit: ['异步 FIFO 在两时钟比下各跑 10 万拍无溢出', '≥4 条 SVA 断言纳入回归', '能给 TFT 输出口写出合理的 output delay']
    },
    {
      id: 'P4', name: '体系结构 mini-core', color: '#fbbf24',
      goal: 'RV32I 单周期→五级流水，前递/停顿，D-Cache，SDRAM 控制器；对齐 JD「计算核/cache/内存控制器」',
      path: '概念：体系结构总览 + Cache 原理 → 手写：ALU → 单周期 → 流水 → 冒险 → 分支预测 → D-Cache → SDRAM → 上板 → CPI',
      bName: '手写内核',
      core: ['指令集与数据通路', '五级流水与冒险处理', 'Cache 设计', '内存控制器'],
      knowledge: ['RV32I 六种指令格式', '数据前递 / load-use 停顿 / 分支预测', '直接映射与组相联、写直达与写回、AMAT', 'SDRAM 命令与时序参数'],
      exit: ['20 个测试程序回归全过', 'CPI 与 Fmax 有实测数据（不只是"能跑"）', 'D-Cache 命中率 > 85% 且功能回归不退化']
    },
    {
      id: 'P5', name: '高速接口与协议', color: '#f472b6',
      goal: '8b/10b、SerDes、XAUI/Interlaken/SDH/OAM 概念；以太网 MAC/UDP 全链路实现与抓包验证',
      path: '概念：SerDes/8b10b + 协议对比 + 以太网 MAC + RGMII → 手写：8b10b / CRC32 / UDP / 参考模型 / 抓包验证',
      bName: '综合项目',
      core: ['线路编码与 SerDes 概念', '以太网 MAC 与协议栈子集', '高速设计与 IO 时序'],
      knowledge: ['8b/10b 与 running disparity', 'XAUI / Interlaken / SDH / OAM 帧结构与分层', 'RGMII 的 DDR 采样与移相', 'CRC32 覆盖范围与并行实现'],
      exit: ['UDP 回环 1000 包零丢包并给出吞吐数据', '8b/10b 256 条向量全过', '四个协议的对比表能脱稿讲 3 分钟']
    },
    {
      id: 'P6', name: '系统集成与平台化', color: '#60a5fa',
      goal: 'AXI4-Lite 互联 + SoC 集成 + 脚本化构建/回归，做出「FPGA 验证平台」雏形',
      path: '概念：AXI4-Lite 协议 → 手写：从机 → 互联 → SoC → C 程序 → 回归 → Tcl 构建 → 寄存器文档 → 数据通路',
      bName: '综合项目',
      core: ['总线与地址映射', 'SoC 顶层集成', '脚本化构建与回归', '文档自动化'],
      knowledge: ['AXI4-Lite 五通道握手规则', '寄存器映射与地址译码', 'Tcl 构建流程', '覆盖率与回归报告'],
      exit: ['一条命令从源码到 sof，一条命令跑完回归', '6 个系统级场景都有自动判定', '寄存器手册由脚本生成，改一处不漏']
    },
    {
      id: 'P7', name: '作品集与面试冲刺', color: '#e11d2b',
      goal: '八股、手撕代码、项目 STAR 复盘、简历与模拟面试',
      path: '概念：面经研读 → 刷题：八股 ×2 / 手撕 ×2 / 笔试题 → 作品集：项目复盘 ×3 / 简历 / 模拟面试',
      bName: '作品集',
      core: ['项目叙述（STAR + 数据）', '八股与手撕代码', '简历与投递'],
      knowledge: ['时序 / CDC / RTL 高频八股', '读代码找 bug 的套路', '项目取舍与踩坑复盘'],
      exit: ['3 个项目各能在 3 分钟内讲清并扛住两轮追问', '手撕 20 题在限时内完成且综合干净']
    },
    {
      id: 'P8', name: '巩固与深挖（弹性）', color: '#2dd4bf',
      goal: '错题回炉、项目深化、限时训练；容量不足时整段可降级为选做',
      path: '概念：弱项诊断 → 刷题：错题 / 协议 / 八股 / 手撕 → 深化：Cache / 中断 / Fmax / 覆盖率 / 简历终版',
      bName: '深化',
      core: ['弱项定向补强', '项目深化', '限时训练'],
      knowledge: ['组相联 / 写回 Cache', '中断与 DMA', 'Fmax 优化手法（流水 / 复制 / 重定时）'],
      exit: ['至少 1 项优化有量化收益（Fmax 或 CPI）', '高危错题清零（≤5 条）']
    }
  ];

  /* ------------------------------ 核心 15 项（聚焦） ------------------------------ */
  /* type: skill 技能 / know 知识 / proj 项目；units 决定进度 */
  const core = [
    { t: '可综合 RTL 与状态机', type: 'skill', units: ['P1-09', 'P2-10', 'P2-11'], note: '写得出、综合干净、无 latch' },
    { t: '时序与 CDC', type: 'skill', units: ['P2-01', 'P3-01', 'P3-03', 'P3-10'], note: '能徒手设计两级同步与异步 FIFO' },
    { t: '异步 FIFO 设计', type: 'know', units: ['P3-03', 'P3-04'], note: '格雷码指针 + 空满反向判断' },
    { t: 'RV32I 五级流水', type: 'proj', units: ['P4-03', 'P4-05', 'P4-06'], note: '前递 / 停顿 / 分支预测' },
    { t: 'Cache 与存储层次', type: 'know', units: ['P4-09', 'P4-10'], note: '映射方式、写策略、AMAT' },
    { t: 'AXI4-Lite 总线', type: 'know', units: ['P6-01', 'P6-02'], note: '五通道握手与地址译码' },
    { t: '以太网 MAC / UDP', type: 'proj', units: ['P5-05', 'P5-06'], note: 'ARP/ICMP/UDP + CRC32' },
    { t: '8b/10b 与 SerDes', type: 'know', units: ['P5-01', 'P5-02'], note: '编码表、disparity、CDR' },
    { t: '验证方法学', type: 'skill', units: ['P3-04', 'P3-05', 'P6-05'], note: '自检 TB / 随机 / 断言 / 回归' },
    { t: 'Quartus 全流程与时序约束', type: 'skill', units: ['P3-10', 'P4-13'], note: 'SDC + TimeQuest + 关键路径' },
    { t: 'SoC 集成与平台化', type: 'proj', units: ['P6-03', 'P6-06', 'P6-07'], note: '一键构建 + 自动回归 + 文档生成' },
    { t: '数电功底与代码分析', type: 'skill', units: ['P1-01', 'P1-06', 'P7-05'], note: '化简 / 冒险 / 读代码挑错' },
    { t: '高速设计与 Fmax 优化', type: 'skill', units: ['P5-09', 'P8-04'], note: 'IO 时序、流水、重定时、复制' },
    { t: '项目叙述与数据', type: 'proj', units: ['P7-06', 'P7-07', 'P7-08'], note: 'STAR + 可追溯的指标' },
    { t: '简历 / 八股 / 手撕', type: 'proj', units: ['P7-01', 'P7-03', 'P7-09'], note: '关键词对齐 JD，限时输出' }
  ];

  /* ------------------------------ 能力矩阵 ------------------------------ */
  const skills = [
    { id: 'rtl', short: 'RTL 编码', name: 'Verilog / RTL 编码', target: 88, jd: '精通 Verilog',
      how: 'HDLBits 全刷 + 每周手写 3~5 个可综合模块 + 代码规范自查',
      points: ['可综合子集', '阻塞 vs 非阻塞', 'always 模板', '参数化与 generate', '三段式状态机', 'latch 与毛刺'] },
    { id: 'dd', short: '数电功底', name: '数电功底与代码分析', target: 85, jd: '扎实的数电功底',
      how: '卡诺图/时序图/竞争冒险 + 读别人代码并指出可综合性问题',
      points: ['卡诺图化简', '竞争冒险', '触发器时序', '建立/保持', '多驱动与隐式网络', '代码可综合性判断'] },
    { id: 'tim', short: '时序·CDC', name: '时序 · CDC · STA', target: 85, jd: '高速设计',
      how: 'SDC 约束 + TimeQuest 报告 + 异步 FIFO 手写 + 亚稳态 MTBF 估算',
      points: ['同步设计原则', '两级同步器', '亚稳态与 MTBF', '格雷码 CDC', '异步 FIFO 空满', 'SDC 约束', '关键路径定位'] },
    { id: 'arch', short: '体系结构', name: '体系结构（CPU/Cache/存储）', target: 78, jd: '处理器、内存体系架构',
      how: 'RV32I 五级流水 + D-Cache + SDRAM 控制器 + CPI 实测',
      points: ['RV32I 指令格式', '单周期与流水线', '前递与停顿', '分支预测', 'Cache 映射与写策略', 'AMAT', 'SDRAM 时序', 'AXI 总线'] },
    { id: 'hs', short: '高速接口', name: '高速接口与协议', target: 72, jd: 'XAUI/Interlaken/OAM/SDH',
      how: '8b/10b 编解码 + 以太网 MAC/UDP + 协议帧结构手绘与对比',
      points: ['8b/10b', 'SerDes 与 CDR', 'XAUI', 'Interlaken', 'SDH 帧与指针', 'OAM', '以太网帧与 CRC', 'RGMII'] },
    { id: 'ver', short: '验证方法', name: '验证方法学', target: 80, jd: '仿真方法学、vcs/verdi',
      how: '自检 TB + 随机激励 + SVA 断言 + 脚本化回归 + 覆盖率',
      points: ['分层 TB', '自检与参考模型', '随机化激励', 'SVA 断言', '覆盖率', '脚本化回归'] },
    { id: 'tool', short: '工具链', name: '工具链与板级调试', target: 86, jd: 'Quartus/Vivado/ISE',
      how: 'Quartus 全流程 + ModelSim + SignalTap + Tcl 脚本 + 引脚/时钟约束',
      points: ['Quartus 全流程', 'ModelSim 流程', 'SignalTap', '引脚与时钟约束', 'Tcl 脚本', '资源与 Fmax 报告'] },
    { id: 'eng', short: '工程交付', name: '工程交付与文档', target: 80, jd: '平台化设计与优化',
      how: '统一顶层/参数化/一键构建/寄存器文档生成/验证报告',
      points: ['目录与版本管理', '模块文档', '一键构建', '寄存器文档生成', '验证报告'] }
  ];

  /* ------------------------------ HDLBits 题库 ------------------------------ */
  const hbGroups = [
    { id: 'start', name: 'Getting Started', items: [
      { id: 'hb-start', name: '入门（Step one / Zero）', total: 2, anchor: 'Getting_Started' }
    ]},
    { id: 'verilog', name: 'Verilog Language', items: [
      { id: 'hb-basics', name: 'Basics', total: 8, anchor: 'Basics' },
      { id: 'hb-vectors', name: 'Vectors', total: 9, anchor: 'Vectors' },
      { id: 'hb-modules', name: 'Modules: Hierarchy', total: 9, anchor: 'Modules:_Hierarchy' },
      { id: 'hb-procedures', name: 'Procedures', total: 8, anchor: 'Procedures' },
      { id: 'hb-more', name: 'More Verilog Features', total: 7, anchor: 'More_Verilog_Features' }
    ]},
    { id: 'comb', name: 'Circuits · 组合逻辑', items: [
      { id: 'hb-gates', name: 'Basic Gates', total: 17, anchor: 'Basic_Gates' },
      { id: 'hb-mux', name: 'Multiplexers', total: 5, anchor: 'Multiplexers' },
      { id: 'hb-arith', name: 'Arithmetic Circuits', total: 7, anchor: 'Arithmetic_Circuits' },
      { id: 'hb-kmap', name: 'Karnaugh Map to Circuit', total: 8, anchor: 'Karnaugh_Map_to_Circuit' }
    ]},
    { id: 'seq', name: 'Circuits · 时序逻辑', items: [
      { id: 'hb-ff', name: 'Latches and Flip-Flops', total: 19, anchor: 'Latches_and_Flip-Flops' },
      { id: 'hb-cnt', name: 'Counters', total: 8, anchor: 'Counters' },
      { id: 'hb-shift', name: 'Shift Registers', total: 9, anchor: 'Shift_Registers' },
      { id: 'hb-morecirc', name: 'More Circuits', total: 3, anchor: 'More_Circuits' },
      { id: 'hb-fsm', name: 'Finite State Machines', total: 33, anchor: 'Finite_State_Machines' }
    ]},
    { id: 'big', name: 'Building Larger Circuits', items: [
      { id: 'hb-large', name: 'Building Larger Circuits', total: 7, anchor: 'Building_Larger_Circuits' }
    ]},
    { id: 'verify', name: 'Verification', items: [
      { id: 'hb-read', name: 'Reading Simulations', total: 15, anchor: 'Verification:_Reading_Simulations' },
      { id: 'hb-tb', name: 'Writing Testbenches', total: 5, anchor: 'Verification:_Writing_Testbenches' }
    ]}
  ];

  // 初始已完成（据 2026-11 截图：Basics / Vectors / Modules / Procedures 全绿 = 34 题）
  const hbInit = { 'hb-basics': 8, 'hb-vectors': 9, 'hb-modules': 9, 'hb-procedures': 8 };

  /* ------------------------------ 项目 ------------------------------ */
  const projects = [
    {
      id: 'PR0', tag: '已完成', name: '数字电压表（TFT 曲线显示）',
      goal: 'ADC128S022 三线串行控制 + 8 点滑动平均 + BCD 换算 + 800×480 TFT 波形绘制，已含像素级模型比对验证。',
      skills: ['rtl', 'tool', 'ver'], metric: '采样率 1 Hz~1 kHz 在线可切；784 点/屏；仿真-上板一致性 100%',
      ms: [
        { t: 'ADC 控制器 34 步序列机 + 自检 TB', done: true },
        { t: '按键消抖/单次脉冲/长按，10 档采样率在线切换', done: true },
        { t: '波形 RAM + 像素级曲线绘制 + 数字显示', done: true },
        { t: '验证报告与 PPT（可作面试讲述素材）', done: true }
      ],
      resume: '基于 Cyclone IV 完成 12 bit ADC 数据采集到 800×480 显示的完整通路，采样率 1 Hz~1 kHz 在线可切；用像素级参考模型比对替代肉眼验收，仿真-上板一致性 100%。',
      paths: ['tftProj']
    },
    {
      id: 'PR1', tag: 'P1', name: '基础 RTL 模块库',
      goal: '把「计数器/边沿检测/消抖/七段译码/BCD/分频」写成参数化、带 TB、带文档的通用库，后续所有项目复用。',
      skills: ['rtl', 'tool'], metric: '6+ 模块各自自检通过；综合 0 latch',
      ms: [
        { t: 'rtl/lib 目录与命名规范、每个模块独立 TB', unit: 'P1-11' },
        { t: '组合三件套手写（七段 / MUX / 加法器）', unit: 'P1-09' },
        { t: '6 位动态扫描 + BCD 计数上板', unit: 'P2-09' }
      ],
      resume: '沉淀 10+ 参数化通用模块（消抖/边沿/分频/BCD/七段扫描/同步器），全部附自检 testbench，成为后续 4 个项目的公共底座。',
      paths: ['fpgaDemo']
    },
    {
      id: 'PR2', tag: 'P2', name: 'UART 子系统 + 命令解析状态机',
      goal: '自写 TX/RX（16× 过采样、中点采样）、帧头-长度-CRC 命令解析 FSM，PC 端串口工具联调通过。',
      skills: ['rtl', 'tool', 'ver'], metric: '115200 bps；1000 帧零丢包；CRC 错帧回 NAK',
      ms: [
        { t: 'UART TX 可配置波特率', unit: 'P2-14' },
        { t: 'UART RX 抗噪采样 + 回环', unit: 'P2-15' },
        { t: '命令解析 FSM（0xAA 帧头 / LEN / PAYLOAD / CRC8）', unit: 'P2-16' },
        { t: 'SignalTap 抓帧存证', unit: 'P2-17' }
      ],
      resume: '设计 115200 bps UART 收发与命令解析状态机，支持变长帧 + CRC8 校验，误码注入 1000 帧零丢包；用 SignalTap 完成板级协议调试。',
      paths: ['uartTx', 'uartRx']
    },
    {
      id: 'PR3', tag: 'P3', name: 'CDC & FIFO 验证套件',
      goal: '同步/异步 FIFO（格雷码指针）+ 随机化自检 TB + SVA 断言，作为「不溢出/不读空」的可信证据。',
      skills: ['tim', 'ver'], metric: '50 万拍无溢出；4 条断言；两时钟比 3:2 与 1:1',
      ms: [
        { t: '同步 FIFO（满/空/almost_full）', unit: 'P3-02' },
        { t: '异步 FIFO（两级同步 + 格雷码）', unit: 'P3-03' },
        { t: '随机激励 + 自检 + 断言', unit: 'P3-04' },
        { t: '跨时钟域搬运上板 + SignalTap', unit: 'P3-09' }
      ],
      resume: '实现 8 bit×256 深度异步 FIFO，格雷码指针跨域、两级同步器 + 空满反向判断，随机激励 50 万拍无溢出；配套 4 条 SVA 断言纳入回归。',
      paths: ['fifo', 'dpram', 'paperFIFO']
    },
    {
      id: 'PR4', tag: 'P4', name: 'RV32I 五级流水 mini-core + D-Cache',
      goal: '单周期 → 五级流水（前递/load-use 停顿/静态分支预测）→ 直接映射 D-Cache（写直达），实测 CPI 与 Fmax。',
      skills: ['arch', 'rtl', 'ver'], metric: '37 条指令；CPI 1.62→1.21；50 MHz 下 WNS 为正',
      ms: [
        { t: 'ALU / 立即数扩展 / 双端口寄存器堆', unit: 'P4-02' },
        { t: '单周期数据通路 + 汇编程序跑通', unit: 'P4-03' },
        { t: '五级流水 + 前递 + 停顿', unit: 'P4-05' },
        { t: 'D-Cache（1 KB 直接映射、写直达）', unit: 'P4-10' },
        { t: 'CPI / Fmax 实测与关键路径分析', unit: 'P4-13' }
      ],
      resume: '从零实现 RV32I 五级流水处理器（37 条指令），含数据前递与 load-use 停顿、静态分支预测；外挂 1 KB 直接映射 D-Cache 后，访存密集程序 CPI 由 1.62 降至 1.21。',
      paths: ['riscvSpec', 'riscvTests', 'picorv32', 'bookCO']
    },
    {
      id: 'PR5', tag: 'P5', name: '千兆以太网 UDP 数据通路 + 8b/10b',
      goal: 'RGMII→GMII、ARP/ICMP/UDP 收发、CRC32 并行、8b/10b 编解码；Wireshark 抓包佐证；协议笔记覆盖 XAUI/Interlaken/SDH。',
      skills: ['hs', 'ver', 'tool'], metric: 'UDP 1000 包零丢包；单帧 1024 B 环回 < 8 μs',
      ms: [
        { t: '8b/10b 编解码 + disparity 检查', unit: 'P5-02' },
        { t: 'CRC32 并行 + ARP 响应', unit: 'P5-05' },
        { t: 'UDP 收发 + PC 联调', unit: 'P5-06' },
        { t: 'Wireshark 抓包与时序图文档', unit: 'P5-11' }
      ],
      resume: '在 AC620 上打通 RGMII 千兆通路，实现 ARP/ICMP/UDP 协议栈子集与并行 CRC32，单帧 1024 B 环回延迟 < 8 μs；独立完成 8b/10b 编解码器并与 XAUI 分层模型对齐。',
      paths: ['eth48', 'udp51', 'enc8b10b', 'xaui', 'sdh']
    },
    {
      id: 'PR6', tag: 'P6', name: 'SoC 集成与 FPGA 验证平台',
      goal: 'CPU + AXI4-Lite 互联 + UART/GPIO/Timer/TFT 外设，一键构建 + 脚本化回归 + 寄存器文档自动生成。',
      skills: ['arch', 'eng', 'tool'], metric: '一键构建；42 个回归用例；寄存器手册零漏改',
      ms: [
        { t: 'AXI4-Lite 从机 + 地址译码互联', unit: 'P6-02' },
        { t: 'SoC 顶层集成 + C 程序点灯/串口', unit: 'P6-03' },
        { t: 'Python/vsim 自动回归 + 覆盖率', unit: 'P6-05' },
        { t: '寄存器文档自动生成', unit: 'P6-07' }
      ],
      resume: '搭建 CPU+5 外设的 SoC 原型与验证平台：AXI4-Lite 互联、Tcl 一键综合、Python 驱动 ModelSim 回归 42 个用例，寄存器手册由脚本从 JSON 生成，改版零漏改。',
      paths: ['fpgaDemo', 'tft5', 'axi']
    },
    {
      id: 'PR7', tag: 'P7', name: '作品集与面试弹药',
      goal: '3 个项目 STAR 叙述 + 120 题八股 + 手撕代码清单 + 两版简历 + 演示视频。',
      skills: ['eng'], metric: '3 分钟讲清 3 个项目；20 题限时手撕',
      ms: [
        { t: '八股 120 题（含答案与追问）', unit: 'P7-01' },
        { t: '手撕 20 题限时训练', unit: 'P7-03' },
        { t: '简历 v2 两版', unit: 'P7-09' },
        { t: '模拟面试 2 轮 + 录音复盘', unit: 'P7-10' }
      ],
      resume: '',
      paths: ['nowcoder', 'huaweiCareer', 'va']
    }
  ];

  /* ------------------------------ JD 对照 ------------------------------ */
  const jd = [
    {
      id: 'jd-d1', tag: '职责 1',
      orig: '负责 FPGA/ASIC 创新设计，聚焦处理器、内存、网络、AI 等芯片的体系架构创新，完成原型开发和验证。',
      cover: '用「RV32I 五级流水 + Cache + SDRAM 控制器 + 以太网通路」在真实 FPGA 上做出可运行原型；每个原型都配自检 TB 与上板证据，形成「设计-验证-原型」闭环。',
      units: ['P4-03', 'P4-05', 'P4-10', 'P6-03'], level: 2
    },
    {
      id: 'jd-d2', tag: '职责 2',
      orig: '承担逻辑模块的方案设计、器件选型、详细设计、代码编程和板上调试，实现计算核、cache、内存控制器、各类算法、各类高速接口协议的逻辑产品交付。',
      cover: '每个项目强制走「方案→器件/资源评估→详细设计→编码→仿真→上板→报告」七步；计算核(P4)、cache(P4-10)、内存控制器(P4-11)、算法(滤波/CRC/8b10b)、高速接口(P5)逐个落地。',
      units: ['P4-02', 'P4-11', 'P5-05', 'P5-09'], level: 2
    },
    {
      id: 'jd-d3', tag: '职责 3',
      orig: '承担 FPGA/ASIC 各类通用模块的平台化设计和优化，负责自研芯片技术原型和 FPGA 验证平台的构建和维护。',
      cover: 'P6 阶段专门做平台化：参数化模块库、统一顶层、AXI-Lite 互联、Tcl 一键构建、Python 回归、寄存器文档自动生成——这正是「验证平台构建与维护」的实习版。',
      units: ['P6-02', 'P6-05', 'P6-06', 'P6-07'], level: 1
    },
    {
      id: 'jd-r1', tag: '要求 1',
      orig: '计算机、通信、电子、自动化等相关专业。',
      cover: '已满足；只需在简历里把课程（数电/计组/信号与系统）与项目对应起来。',
      units: [], level: 4
    },
    {
      id: 'jd-r2', tag: '要求 2',
      orig: '熟悉器件特性（Xilinx、Altera 器件等），熟悉常用协议（XAUI、Interlaken、OAM、SDH 等）；精通 Verilog、SystemVerilog、C 等逻辑编程语言；熟练 Vivado、ISE、Quartus 等电路后端工具；熟练 vcs、verdi 等逻辑仿真工具。',
      cover: 'Altera/Cyclone IV 已上手（Quartus 全流程 + ModelSim）；补 SystemVerilog 可综合子集与 TB；协议按「概念→帧结构→自实现片段」补 XAUI/Interlaken/SDH/OAM；Vivado/ISE 用方法学文档补齐认知差；VCS/Verdi 以 Linux+Makefile+波形调试方法论对标。',
      units: ['P5-01', 'P5-03', 'P5-10', 'O-02'], level: 2
    },
    {
      id: 'jd-r3', tag: '要求 3',
      orig: '了解高速设计、仿真方法学等高端逻辑技术。',
      cover: '高速设计：SDC 约束、IO 时序、跨时钟、流水/重定时/复制、Fmax 优化实验；仿真方法学：分层 TB、随机化、自检、断言、覆盖率、回归脚本。',
      units: ['P3-10', 'P5-09', 'P6-05', 'P8-05'], level: 1
    },
    {
      id: 'jd-r4', tag: '要求 4',
      orig: '有扎实的数电功底，能够设计分析硬件描述代码。',
      cover: '数电：卡诺图化简、竞争冒险、建立保持、亚稳态、时序分析；代码分析：读代码找 bug / 判断能否综合的训练，配合 HDLBits 的 bugs 与 exams 系列。',
      units: ['P1-06', 'P2-01', 'P3-01', 'P7-05'], level: 2
    },
    {
      id: 'jd-r5', tag: '要求 5',
      orig: '参加全国电子设计竞赛、研究生电子设计竞赛、挑战杯等并获得较好的名次者优先考虑。',
      cover: '以「可验证的工程项目 + 数据指标」替代竞赛名次：3 个完整项目 + 验证报告 + 演示视频；若时间允许，选 1 道历年电赛 FPGA 赛题做方案设计，面试时讲得出取舍。',
      units: ['O-10', 'P7-06', 'P7-07'], level: 1
    }
  ];

  /* ------------------------------ 资源库 ------------------------------ */
  /* url    = 在线资源     path = 本机路径     note = 书/论文说明（无链接） */
  const resources = {
    /* —— 在线 —— */
    hbSite:        { label: 'HDLBits 题库', url: 'https://hdlbits.01xz.net/wiki/Problem_sets' },
    riscvSpec:     { label: 'RISC-V 指令集手册', url: 'https://github.com/riscv/riscv-isa-manual' },
    riscvTests:    { label: 'riscv-tests 官方测试集', url: 'https://github.com/riscv-software-src/riscv-tests' },
    picorv32:      { label: 'PicoRV32 参考实现', url: 'https://github.com/YosysHQ/picorv32' },
    verilator:     { label: 'Verilator 开源仿真', url: 'https://www.veripool.org/verilator/' },
    axi:           { label: 'AMBA AXI 规范（Arm）', url: 'https://developer.arm.com/documentation/ihi0022/' },
    enc8b10b:      { label: '8b/10b 编码（Wikipedia）', url: 'https://en.wikipedia.org/wiki/8b/10b_encoding' },
    xaui:          { label: 'XAUI（Wikipedia）', url: 'https://en.wikipedia.org/wiki/XAUI' },
    sdh:           { label: 'SDH / SONET（Wikipedia）', url: 'https://en.wikipedia.org/wiki/Synchronous_optical_networking' },
    ethFrame:      { label: '以太网帧格式（Wikipedia）', url: 'https://en.wikipedia.org/wiki/Ethernet_frame' },
    va:            { label: 'Verification Academy（SVA/UVM）', url: 'https://verificationacademy.com/' },
    nowcoder:      { label: '牛客（机试 / 面经）', url: 'https://www.nowcoder.com/' },
    huaweiCareer:  { label: '华为招聘官网', url: 'https://career.huawei.com/' },
    corecourse:    { label: '小梅哥教程站', url: 'http://www.corecourse.cn' },
    /* —— 书 / 论文（无链接，按名称搜） —— */
    bookCO:        { label: '《计算机组成与设计：RISC-V 版》', note: 'Patterson & Hennessy：第 4 章流水线、第 5 章存储层次，P4 阶段的对照读物' },
    bookDE:        { label: '《数字电子技术基础》阎石', note: '卡诺图 / 触发器 / 时序，P1 数电复习用' },
    bookHDL:       { label: '《Verilog HDL 高级数字设计》', note: '可综合子集与建模规范' },
    paperFIFO:     { label: 'Cummings：异步 FIFO 设计（SNUG 2002）', note: '搜 "Cummings SNUG2002 FIFO" 找 PDF，P3 必读' },
    paperCDC:      { label: 'Cummings：CDC 设计与验证（SNUG 2008）', note: '搜 "Cummings SNUG2008 CDC" 找 PDF' },
    /* —— 本地资料 —— */
    ac620:         { label: 'AC620 用户手册 V3.2', path: 'D:\\WorkProject\\FPGA\\01_【产品说明书】AC620V2+FPGA开发板用户手册V3.2.pdf' },
    bookA:         { label: 'FPGA系统设计与验证实战指南 V3.3', path: 'D:\\WorkProject\\FPGA\\02A_【学习教材】FPGA系统设计与验证实战指南_V3.3.pdf' },
    bookB:         { label: '小梅哥 FPGA 逻辑设计进阶教程 2020', path: 'D:\\WorkProject\\FPGA\\02B_【学习教材】小梅哥FPGA逻辑设计进阶教程2020版V1.0.pdf' },
    bookSopc:      { label: 'AC620 SOPC 嵌入式系统设计教程', path: 'D:\\WorkProject\\FPGA\\03_【学习教材】AC620 SOPC嵌入式系统设计教程V1.2.pdf' },
    msTips:        { label: 'ModelSim 仿真问题集锦 V1.3', path: 'D:\\WorkProject\\FPGA\\04_【工具书】ModelSim仿真使用常见问题及解决办法集锦V1.3.pdf' },
    quartusInst:   { label: 'Quartus II 13.0 安装指导书', path: 'D:\\WorkProject\\FPGA\\06_【工具书】Quartus II 13.0安装和破解指导书V1.0.pdf' },
    driver:        { label: '芯路恒驱动安装说明', path: 'D:\\WorkProject\\FPGA\\07_【工具书】芯路恒FPGA学习套件驱动安装说明V1.0.pdf' },
    quartusFaq:    { label: 'Quartus II 常见问题集锦', path: 'D:\\WorkProject\\FPGA\\08_【工具书】QuartusII使用常见问题及解决办法集锦V1.0.pdf' },
    ext:           { label: '扩展功能模块应用说明', path: 'D:\\WorkProject\\FPGA\\09_【扩展功能】各扩展功能模块与AC620开发板的应用说明.pdf' },
    timing:        { label: '小梅哥 FPGA 时序约束笔记', path: 'D:\\WorkProject\\FPGA\\小梅哥FPGA时序约束笔记.pdf' },
    cyc4:          { label: 'Cyclone IV 器件手册（英文）', path: 'D:\\WorkProject\\FPGA\\Cyclone IV\\cyclone4-handbook.pdf' },
    sdram:         { label: 'W9825G6KH SDRAM 数据手册', path: 'D:\\WorkProject\\FPGA\\SDRAM\\W9825G6KH-6.PDF' },
    rgmii:         { label: 'RTL8211E 千兆 PHY 数据手册', path: 'D:\\WorkProject\\FPGA\\以太网\\RTL8211E(G)-VB(VL)-CG_DataSheet_1.7.pdf' },
    rj45:          { label: 'HR911130C 千兆 RJ45 手册', path: 'D:\\WorkProject\\FPGA\\以太网\\HR911130C千兆RJ45.pdf' },
    fpgaDemo:      { label: 'AC620 官方例程 64 个（1~64）', path: 'D:\\WorkProject\\FPGA\\AC620_verilog' },
    tftProj:       { label: '你的数字电压表工程（已完成）', path: 'D:\\WorkProject\\FPGA\\32_AC620_TFT_Dig_Volt\\32_AC620_TFT_Dig_Volt' },
    uartTx:        { label: '例程 10_AC620_uart_tx', path: 'D:\\WorkProject\\FPGA\\AC620_verilog\\10_AC620_uart_tx' },
    uartRx:        { label: '例程 11_AC620_uart_rx', path: 'D:\\WorkProject\\FPGA\\AC620_verilog\\11_AC620_uart_rx' },
    keyBoard:      { label: '例程 12_AC620_Key_Board', path: 'D:\\WorkProject\\FPGA\\AC620_verilog\\12_AC620_Key_Board' },
    dpram:         { label: '例程 13_AC620_dpram', path: 'D:\\WorkProject\\FPGA\\AC620_verilog\\13_AC620_dpram' },
    fifo:          { label: '例程 16_AC620_fifo', path: 'D:\\WorkProject\\FPGA\\AC620_verilog\\16_AC620_fifo' },
    pll:           { label: '例程 17_AC620_pll', path: 'D:\\WorkProject\\FPGA\\AC620_verilog\\17_AC620_pll' },
    adc:           { label: '例程 20_AC620_ADCadc128s022', path: 'D:\\WorkProject\\FPGA\\AC620_verilog\\20_AC620_ADCadc128s022' },
    tft5:          { label: '例程 23_AC620_TFT_CTRL5.0', path: 'D:\\WorkProject\\FPGA\\AC620_verilog\\23_AC620_TFT_CTRL5.0' },
    sdramCtrl:     { label: '例程 36_AC620_Sdram_Control', path: 'D:\\WorkProject\\FPGA\\AC620_verilog\\36_AC620_Sdram_Control' },
    eth48:         { label: '例程 48_rgmii_to_gmii_to_rgmii', path: 'D:\\WorkProject\\FPGA\\AC620_verilog\\48_AC620_rgmii_to_gmii_to_rgmii' },
    arp49:         { label: '例程 49_AC620_arp_send', path: 'D:\\WorkProject\\FPGA\\AC620_verilog\\49_AC620_arp_send' },
    ipCk50:        { label: '例程 50_AC620_Ip_Checksum', path: 'D:\\WorkProject\\FPGA\\AC620_verilog\\50_AC620_Ip_Checksum' },
    udp51:         { label: '例程 51_AC620_udp_send', path: 'D:\\WorkProject\\FPGA\\AC620_verilog\\51_AC620_udp_send' },
    ov5640:        { label: '例程 43_AC620_OV5640_DPRAM_Display', path: 'D:\\WorkProject\\FPGA\\AC620_verilog\\43_AC620_OV5640_DPRAM_Display' },
    dds:           { label: '例程 34_AC620_DDS2', path: 'D:\\WorkProject\\FPGA\\AC620_verilog\\34_AC620_DDS2' },
    i2c:           { label: '例程 28_AC620_i2c_control', path: 'D:\\WorkProject\\FPGA\\AC620_verilog\\28_AC620_i2c_control' },
    modelsim:      { label: 'ModelSim 2020.4 安装目录', path: 'D:\\WorkApp\\modelsim2020_4' },
    learnDir:      { label: '你的学习笔记目录 learn', path: 'D:\\WorkProject\\FPGA\\learn' }
  };

  /* ------------------------------ 任务补充资料 ------------------------------ */
  /* 给已有任务挂上在线资料/书（避免逐条改 data-units.js；渲染时合并去重） */
  const unitRes = {
    'P1-01': ['bookDE'],
    'P1-06': ['bookDE'],
    'P1-09': ['bookHDL'],
    'P1-10': ['msTips'],
    'P2-01': ['bookDE', 'paperCDC'],
    'P2-03': ['bookHDL'],
    'P2-05': ['bookHDL'],
    'P2-08': ['paperCDC'],
    'P2-10': ['bookA', 'bookHDL'],
    'P3-01': ['paperCDC', 'bookB'],
    'P3-03': ['paperFIFO', 'fifo'],
    'P4-01': ['riscvSpec', 'bookCO'],
    'P4-03': ['riscvSpec'],
    'P4-04': ['riscvTests'],
    'P4-08': ['riscvTests'],
    'P4-09': ['bookCO'],
    'P5-01': ['enc8b10b'],
    'P5-03': ['xaui', 'sdh'],
    'P5-04': ['ethFrame'],
    'P6-01': ['axi'],
    'P6-02': ['axi'],
    'P7-05': ['nowcoder'],
    'P7-12': ['huaweiCareer', 'nowcoder'],
    'O-03': ['verilator'],
    'O-07': ['picorv32']
  };
  root.FP_META = {
    version: '2.0.0',
    updated: '2026-11-04',
    title: '华为 逻辑实习生 · 核心技能作战计划',
    jdNote: '岗位截图为 2026-03-25 更新版；JD 中「XAUIL」应为 XAUI，本计划按 XAUI 处理。',
    phases, core, skills, hbGroups, hbInit, projects, jd, resources, unitRes
  };
})(typeof window !== 'undefined' ? window : globalThis);
