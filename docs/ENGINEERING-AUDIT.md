# Marine engineering and offshore-sailing audit（船舶工程与远洋独航审计）

2026-09-17 21:54:47 America/Los_Angeles

Model SHA-256（模型散列）：`e2b78adca0789b413202d9048f5413bf47c9a784876cad0c25a93cc2148accbe`

This is an evidence-based educational model review, not professional certification or a surveyed Cal 40 replica.（这是基于证据的教学模型审阅，不是专业认证或实船测绘复制品。）

## Corrections and evidence（修正与证据）

### A01 GLB node identity（GLB 节点标识）

Imported nodes were not guaranteed to be Three.Group; use component metadata rather than class identity.（导入节点不保证为 Three.Group；改用部件元数据识别。）

Validation（验证）：Browser visibility and exact reassembly tests（浏览器显隐与精确复位测试）。

### A02 Hull sections and waterline（船体横剖面与水线）

Narrow sections exposed interior geometry. Reconstructed flatter bilges and corrected centerline waterline from 8.478 m to 9.24 m.（狭窄剖面使舱内部件外露；重建较平缓舭部，并将中心线水线长由 8.478 米校正为 9.24 米。）

Validation（验证）：Original lines, sheet 204/2; dimension and containment tests（原始型线图 204/2；尺寸与包络测试）。

### A03 Bulkheads, berths and deck（舱壁、铺位与甲板）

Rectangular interior panels were not constrained by hull shape. Profiled bulkheads, tapered forward berths, and deck sheer now follow the shell.（矩形内部板件未受船壳形状约束；舱壁、渐缩前铺位及甲板舷弧现已适配船壳。）

Validation（验证）：Original section/cabin drawings 204/5 and 204/4; vertex containment checks（原始剖面／舱室图 204/5、204/4；顶点包络检查）。

### A04 Moving sail and steering attachments（运动中的帆装与操舵连接）

Replaced center-based rotations with luff/stock pivots. Regenerated connected running lines as trim, reef and rudder settings change.（用帆前缘／舵轴旋转替代绕网格中心旋转；随调帆、缩帆与舵角变化重建连接索路。）

Validation（验证）：Raymarine drive guide, original rig drawing, kinematics tests（Raymarine 驱动指南、原始帆装图及运动学测试）。

### A05 Mainsheet purchase（主帆缭绳滑轮组）

Straight cross-sheave shortcuts were replaced by arcs in the sheave planes, with four moving-block supporting strands.（跨滑轮直线捷径改为滑轮平面内的弧线，形成四段承载动滑轮的绳段。）

Validation（验证）：Harken reeving principles; representative single-speed geometry and attachment tests（Harken 穿绳原理；示意单速几何与连接测试）。

### A06 Spinnaker support（球帆支撑）

Added a representative pole, topping lift and afterguy, visible only in the spinnaker configuration.（补充示意撑杆、吊索与后拉索，仅在球帆配置中显示。）

Validation（验证）：Original sail plan and declared refit assumptions; configuration test（原始帆装图及明确的改装假设；配置测试）。

### A07 Power and feedback graph（供电与反馈图谱）

Separated charging, supply, control, measurement and feedback edges. Independent handhelds preserve reduced voice/position capability after house supply loss.（区分充电、供电、控制、测量与反馈；生活电源失效后独立手持设备可保留有限通信／定位能力。）

Validation（验证）：Raymarine network documentation and failure propagation tests（Raymarine 网络资料与故障传播测试）。

### A08 Controller and navigation equipment placement（控制器与导航设备位置）

Moved the solar controller away from directly above the battery; separated radio equipment and widened its supporting surface.（将太阳能控制器移离电池正上方；分隔无线电设备并加宽支承面。）

Validation（验证）：Victron installation section 4.1; inspected model layout（Victron 安装说明第 4.1 节；模型布置检查）。

### A09 Selectable geometry batching（可选几何批处理）

Merged compatible surfaces within component IDs instead of losing selection through whole-boat merging.（在部件标识内部合并兼容曲面，避免整船合并导致选取信息丢失。）

Validation（验证）：Geometry coverage and draw-call inspection（几何覆盖与绘制调用检查）。

## Five-why root causes（五问根因）

1. Interior parts protruded because their rectangular bounds exceeded the shell.（内部部件穿壳，因为矩形边界超出船壳。）
2. The shell was too narrow near the waterline because a generic section curve was used.（水线附近船壳偏窄，因为采用了通用剖面曲线。）
3. That curve was not calibrated against both the body plan and the waterline length.（曲线没有同时依据横剖面与水线长校准。）
4. Early checks covered data and transform integrity but not physical containment.（早期检查覆盖数据和变换完整性，却缺少物理包络约束。）
5. Dimensional and mating constraints were not executable acceptance tests. The correction made them tests and updated the geometry generator, rather than hiding the exposed meshes.（尺寸和装配约束尚未成为可执行验收测试。修正将其写成测试并更新几何生成器，而非隐藏外露网格。）

For visibility: incorrect sail states → component loop skipped nodes → imported node classes differed → generator runtime types were assumed to survive export → missing GLB integration coverage. Stable metadata plus a real-browser configuration test address the root cause.（显隐根因链：帆状态错误 → 部件循环漏掉节点 → 导入节点类型变化 → 假定生成器类型在导出后保持不变 → 缺少 GLB 集成覆盖。稳定元数据与真实浏览器配置测试解决此根因。）

## Source-verified facts（来源核实事实）

Published Cal 40 baseline: LOA 11.99 m, LWL 9.24 m, beam 3.35 m, draft 1.70 m. Rig baseline I 14.02 m, J 4.62 m, P 12.19 m, E 5.33 m. These facts do not certify every surface or equipment location.（已公布的 Cal 40 基准：总长 11.99 米、水线长 9.24 米、船宽 3.35 米、吃水 1.70 米；帆装 I 14.02 米、J 4.62 米、P 12.19 米、E 5.33 米。这些事实不代表所有曲面和设备位置已经核实。）

## Approximated components（近似重建部件）

Hull shell（船壳） · Deck（甲板） · Coachroof（舱顶） · Fin keel（鳍式龙骨） · Mast（桅杆） · Boom（帆桁） · Mainsail（主帆） · Working jib（工作前帆） · Spade rudder（独立舵） · Galley（厨房） · Port berth（左舷铺位） · Starboard berth（右舷铺位） · V-berth（船首 V 形铺位） · Navigation station（导航台）

## Illustrative components and limits（示意部件与限制）

Modern refit machinery, electronics, safety gear, hidden reinforcement, circuits, hoses and line routing are representative. Sail cloth, foil sections and shell thickness are simplified. Exact scantlings, load ratings, tank capacities, battery capacities and boat-specific equipment installation are not established.（现代改装机械、电子设备、安全装备、隐藏加强件、电路、软管与索路为代表性配置。帆布、翼型与船壳厚度已简化。未建立精确结构尺寸、载荷等级、水箱容量、电池容量或实船设备安装参数。）

The sailing model uses assumed coefficients and simplified resistance/righting behavior; it is not validated against Cal 40 polars. Failure logic models declared circuit/control dependencies, not every marine casualty. Cut faces are visual sections, not verified laminate schedules. Mobile browser emulation is not a physical iPhone performance measurement.（航行模型采用假设系数和简化阻力／复原模型，未用 Cal 40 极线验证。故障逻辑模拟明确的电路／控制依赖，而非所有海事事故。剖面不是经核实的铺层结构。移动浏览器模拟不等于真实 iPhone 性能测量。）

## Component coverage（部件覆盖）

| Component（部件） | Classification（分类） | Relations（关系数） | Sources（来源标识） |
| --- | --- | --- | --- |
| Hull shell（船壳） | Approximated（近似） | 12 | lines, deck-plan, dimensions |
| Deck（甲板） | Approximated（近似） | 7 | lines, deck-plan, dimensions |
| Coachroof（舱顶） | Approximated（近似） | 4 | lines, deck-plan, dimensions |
| Fin keel（鳍式龙骨） | Approximated（近似） | 2 | lines, deck-plan, dimensions |
| Lead ballast（铅压载） | Illustrative（示意） | 1 | lines, deck-plan, dimensions |
| Main bulkhead（主舱壁） | Illustrative（示意） | 1 | lines, deck-plan, dimensions |
| Forward bulkhead（前舱壁） | Illustrative（示意） | 1 | lines, deck-plan, dimensions |
| Port stringer（左舷纵桁） | Illustrative（示意） | 1 | lines, deck-plan, dimensions |
| Starboard stringer（右舷纵桁） | Illustrative（示意） | 1 | lines, deck-plan, dimensions |
| Mast support beam（桅杆支撑梁） | Illustrative（示意） | 2 | lines, deck-plan, dimensions |
| Mast（桅杆） | Approximated（近似） | 7 | sail-plan |
| Boom（帆桁） | Approximated（近似） | 5 | sail-plan |
| Port spreader（左撑杆） | Illustrative（示意） | 1 | sail-plan |
| Starboard spreader（右撑杆） | Illustrative（示意） | 1 | sail-plan |
| Forestay（前支索） | Illustrative（示意） | 3 | sail-plan |
| Backstay（后支索） | Illustrative（示意） | 1 | sail-plan |
| Port cap shroud（左上侧支索） | Illustrative（示意） | 2 | sail-plan |
| Starboard cap shroud（右上侧支索） | Illustrative（示意） | 2 | sail-plan |
| Port lower shroud（左下侧支索） | Illustrative（示意） | 1 | sail-plan |
| Starboard lower shroud（右下侧支索） | Illustrative（示意） | 1 | sail-plan |
| Port chainplate（左链板） | Illustrative（示意） | 4 | sail-plan |
| Starboard chainplate（右链板） | Illustrative（示意） | 4 | sail-plan |
| Port turnbuckle（左花篮螺丝） | Illustrative（示意） | 2 | sail-plan |
| Starboard turnbuckle（右花篮螺丝） | Illustrative（示意） | 2 | sail-plan |
| Main halyard（主帆升降索） | Illustrative（示意） | 2 | sail-plan |
| Jib halyard（前帆升降索） | Illustrative（示意） | 1 | sail-plan |
| Mainsheet（主帆缭绳） | Illustrative（示意） | 2 | sail-plan, sheet |
| Port jib sheet（左前帆缭绳） | Illustrative（示意） | 2 | sail-plan |
| Starboard jib sheet（右前帆缭绳） | Illustrative（示意） | 2 | sail-plan |
| Reefing line（缩帆索） | Illustrative（示意） | 1 | sail-plan |
| Boom vang（帆桁下拉索） | Illustrative（示意） | 1 | sail-plan |
| Mainsail（主帆） | Approximated（近似） | 5 | sail-plan |
| Working jib（工作前帆） | Approximated（近似） | 1 | sail-plan |
| Genoa（热那亚帆） | Illustrative（示意） | 1 | sail-plan |
| Spinnaker（球帆） | Illustrative（示意） | 1 | sail-plan |
| Storm jib（风暴前帆） | Illustrative（示意） | 1 | sail-plan |
| Spinnaker pole（球帆撑杆） | Illustrative（示意） | 4 | sail-plan |
| Pole topping lift（球帆杆吊索） | Illustrative（示意） | 1 | sail-plan |
| Spinnaker afterguy（球帆后拉索） | Illustrative（示意） | 1 | sail-plan |
| Spade rudder（独立舵） | Approximated（近似） | 2 | lines, deck-plan, dimensions |
| Rudder stock（舵轴） | Illustrative（示意） | 5 | representative |
| Tiller（舵柄） | Illustrative（示意） | 2 | representative |
| Rudder bearing（舵轴承） | Illustrative（示意） | 1 | representative |
| Autopilot tiller arm（自动舵舵臂） | Illustrative（示意） | 2 | pilot, network, representative |
| Auxiliary engine（辅助发动机） | Illustrative（示意） | 4 | representative |
| Propeller shaft（螺旋桨轴） | Illustrative（示意） | 2 | representative |
| Propeller（螺旋桨） | Illustrative（示意） | 1 | representative |
| Fuel tank（燃油箱） | Illustrative（示意） | 1 | representative |
| Fuel supply line（供油管） | Illustrative（示意） | 2 | representative |
| Exhaust hose（排气软管） | Illustrative（示意） | 1 | representative |
| House battery（生活蓄电池） | Illustrative（示意） | 4 | representative |
| Main fuse & isolator（主保险与隔离开关） | Illustrative（示意） | 2 | representative |
| DC distribution panel（直流配电板） | Illustrative（示意） | 12 | representative |
| Solar panels（太阳能板） | Illustrative（示意） | 1 | representative |
| Solar charge controller（太阳能充电控制器） | Illustrative（示意） | 2 | representative |
| Alternator（交流发电机） | Illustrative（示意） | 2 | representative |
| Shore-power inlet（岸电接口） | Illustrative（示意） | 1 | representative |
| Battery charger（蓄电池充电器） | Illustrative（示意） | 2 | representative |
| DC supply & return（直流供电与回路） | Illustrative（示意） | 2 | representative |
| AIS transceiver（AIS 收发机） | Illustrative（示意） | 1 | representative |
| Fixed VHF radio（固定甚高频电台） | Illustrative（示意） | 3 | representative |
| Chartplotter / GPS（海图仪／卫星定位） | Illustrative（示意） | 3 | representative |
| Compass / IMU（电子罗经／惯性单元） | Illustrative（示意） | 3 | pilot, network, representative |
| Depth transducer（测深传感器） | Illustrative（示意） | 2 | representative |
| Wind instrument（风向风速仪） | Illustrative（示意） | 2 | representative |
| VHF antenna（甚高频天线） | Illustrative（示意） | 1 | representative |
| Handheld VHF（手持甚高频电台） | Illustrative（示意） | 1 | representative |
| Independent GPS（独立定位仪） | Illustrative（示意） | 1 | representative |
| Magnetic compass（磁罗经） | Illustrative（示意） | 1 | representative |
| Satellite communicator（卫星通信器） | Illustrative（示意） | 1 | representative |
| EPIRB（应急无线电示位标） | Illustrative（示意） | 1 | representative |
| Liferaft（救生筏） | Illustrative（示意） | 1 | representative |
| Port jackline（左舷安全索） | Illustrative（示意） | 1 | representative |
| Starboard jackline（右舷安全索） | Illustrative（示意） | 1 | representative |
| Safety tether（安全系绳） | Illustrative（示意） | 3 | representative |
| PFD & harness（救生衣与安全带） | Illustrative（示意） | 1 | representative |
| Fire extinguisher（灭火器） | Illustrative（示意） | 1 | representative |
| Drogue bag（拖曳式海锚包） | Illustrative（示意） | 1 | representative |
| Anchor（船锚） | Illustrative（示意） | 1 | representative |
| Anchor chain（锚链） | Illustrative（示意） | 3 | representative |
| Anchor rode（锚缆） | Illustrative（示意） | 1 | representative |
| Windlass（起锚机） | Illustrative（示意） | 2 | representative |
| Fresh-water tank（淡水箱） | Illustrative（示意） | 1 | representative |
| Fresh-water pump（淡水泵） | Illustrative（示意） | 3 | representative |
| Fresh-water hose（淡水管） | Illustrative（示意） | 2 | representative |
| Marine head（船用厕所） | Illustrative（示意） | 2 | representative |
| Seacock（海底阀） | Illustrative（示意） | 2 | representative |
| Through-hull fitting（穿舷接头） | Illustrative（示意） | 1 | representative |
| Electric bilge pump（电动舱底泵） | Illustrative（示意） | 3 | representative |
| Manual bilge pump（手动舱底泵） | Illustrative（示意） | 1 | representative |
| Bilge discharge hose（舱底排水管） | Illustrative（示意） | 1 | representative |
| Holding tank（污水箱） | Illustrative（示意） | 1 | representative |
| Galley（厨房） | Approximated（近似） | 1 | interior-plan |
| Sink（水槽） | Illustrative（示意） | 2 | interior-plan |
| Port berth（左舷铺位） | Approximated（近似） | 1 | interior-plan |
| Starboard berth（右舷铺位） | Approximated（近似） | 1 | interior-plan |
| V-berth（船首 V 形铺位） | Approximated（近似） | 1 | interior-plan |
| Navigation station（导航台） | Approximated（近似） | 2 | interior-plan |
| Food storage（食物储藏） | Illustrative（示意） | 1 | interior-plan |
| Cabin sole（舱内地板） | Illustrative（示意） | 2 | interior-plan |
| Companionway steps（舱口梯） | Illustrative（示意） | 1 | interior-plan |
| Mainsheet traveler（主帆滑轨） | Illustrative（示意） | 1 | representative |
| Traveler car（滑轨小车） | Illustrative（示意） | 2 | representative |
| Upper sheet block（上缭绳滑轮） | Illustrative（示意） | 2 | representative |
| Lower sheet block（下缭绳滑轮） | Illustrative（示意） | 2 | representative |
| Port primary winch（左主绞盘） | Illustrative（示意） | 1 | representative |
| Starboard primary winch（右主绞盘） | Illustrative（示意） | 1 | representative |
| Halyard winch（升降索绞盘） | Illustrative（示意） | 1 | representative |
| Bow cleat（船首系缆桩） | Illustrative（示意） | 1 | representative |
| Stern cleat（船尾系缆桩） | Illustrative（示意） | 1 | representative |
| Port sheet fairlead（左缭绳导索器） | Illustrative（示意） | 1 | representative |
| Starboard sheet fairlead（右缭绳导索器） | Illustrative（示意） | 1 | representative |
| Reef tack hook（缩帆前角钩） | Illustrative（示意） | 1 | representative |
| Forehatch（前舱盖） | Illustrative（示意） | 1 | representative |
| Lifelines & stanchions（护栏索与立柱） | Illustrative（示意） | 1 | representative |
| Autopilot controller（自动舵控制器） | Illustrative（示意） | 4 | pilot, network, representative |
| Autopilot linear drive（自动舵直线驱动器） | Illustrative（示意） | 3 | pilot, network, representative |
| Windvane self-steering（风向自操舵） | Illustrative（示意） | 1 | representative |
| Emergency tiller（应急舵柄） | Illustrative（示意） | 1 | representative |
| Boom preventer（帆桁防意外换舷索） | Illustrative（示意） | 1 | representative |
| Boat heading（船首向） | Illustrative（示意） | 4 | representative |
| Aerodynamic force（气动力） | Illustrative（示意） | 2 | sail-plan |
| Navigation capability（导航能力） | Illustrative（示意） | 3 | representative |
| Voice communication（语音通信能力） | Illustrative（示意） | 2 | representative |

## Source register（来源目录）

- [Victron: solar charger installation（Victron：太阳能控制器安装）](https://www.victronenergy.com/media/pg/Manual_SmartSolar_MPPT_75-10_up_to_100-20/en/installation.html) — Sections 4.1, 4.2 and 4.6（第 4.1、4.2 与 4.6 节）. Reference for mounting, protected battery connection and commissioning order. Charging does not imply independent backup supply. Controller moved away from directly above the battery during audit.（用于安装、受保护电池连接及调试顺序参考；充电不代表独立备用供电。审计中已将控制器移至电池正上方以外。）

- [Lapworth: original lines, 1962（拉普沃思：1962 年原始型线图）](https://cal40.com/files/TEMP006.pdf) — Sheet 204/2, profile and body plan（图纸 204/2，侧视与横剖面）. Inspected scan. Mesh is a hand-reconstructed approximation, not digitized offsets.（已查阅扫描图；网格为人工近似重建，非精确型值数字化。）

- [Lapworth: sections & deck, 1963（拉普沃思：1963 年剖面与甲板图）](https://cal40.com/files/TEMP003.pdf) — Sheet 204/5, deck and section views（图纸 204/5，甲板与剖视图）. Arrangement reference; hardware detail is representative.（用于布置参考；五金细节为示意。）

- [Lapworth: cabin plan, 1963（拉普沃思：1963 年舱室图）](https://cal40.com/files/TEMP004.pdf) — Sheet 204/4, cabin plan and inboard profile（图纸 204/4，舱室与内部侧视图）. Berth, galley, and machinery regions reconstructed; refit details differ.（重建铺位、厨房与机械区域；改装细节有所不同。）

- [Lapworth: sail & rig plan, 1963（拉普沃思：1963 年帆装图）](https://cal40.com/files/TEMP005.pdf) — Sheet 204/6, rig elevation（图纸 204/6，帆装立面）. Sail silhouette and rig arrangement reference; cloth shape is approximate.（帆轮廓与索具布置参考；帆面形状为近似。）

- [SailboatData: Cal 40 dimensions（SailboatData：Cal 40 尺寸）](https://sailboatdata.com/sailboat/cal-40/) — Specifications; rig and sail particulars（规格、索具及帆参数）. Baseline: LOA 11.99 m; LWL 9.24 m; beam 3.35 m; draft 1.70 m. I 14.02, J 4.62, P 12.19, E 5.33 m. These do not certify mesh surfaces.（基准：总长 11.99 米，水线长 9.24 米，船宽 3.35 米，吃水 1.70 米；I 14.02、J 4.62、P 12.19、E 5.33 米。这些数值不代表曲面已精确认证。）

- [Cal 40 association: class rules（Cal 40 协会：级别规则）](https://www.cal40.com/rules.shtml) — Section 3: mast and rigging（第 3 节：桅杆与索具）. Published rig figures differ from database baseline. Kept as separate limits, not averaged.（公布的帆装数值与数据库基准不同；作为独立限制记录，不取平均值。）

- [Raymarine: autopilot drives（Raymarine：自动舵驱动装置）](https://www.raymarine.com/en-gb/learning/online-guides/selecting-your-raymarine-drive-unit) — Mechanical linear drives（机械直线驱动装置）. A drive acts through a tiller arm; controller, sensor, and power form distinct dependencies. Installation here is illustrative, not a product sizing recommendation.（驱动器通过舵臂作用；控制器、传感器和电源是不同依赖。本装置为示意，不是产品选型建议。）

- [Raymarine: control network（Raymarine：控制网络）](https://docs.raymarine.com/87424/en-US/latest/SeaTalkngConnection-305A50C7.html) — Basic Evolution system diagram（基本 Evolution 系统图）. Supports separation of sensor, controller, actuator and power. Exact wiring is representative.（支持传感、控制、执行与供电的区分；具体接线为示意。）

- [Harken: mainsheet systems（Harken：主帆缭绳系统）](https://gallery.harken.com/gallery/d74c32bb-3b7d-4a7e-b503-0c7ccfc75b9b.pdf) — Two-speed mainsheet instruction sheet（双速主帆缭绳说明书）. Reference for reeving principles only; the modeled single-speed purchase is illustrative and is not a specified Harken kit.（仅作穿绳原理参考；模型中的单速滑轮组为示意，并非指定 Harken 套件。）

- [Singlehanded Sailing Society（单人航海协会）](https://sfbaysss.org/shtp2025/) — 2025 Singlehanded Transpac resources（2025 年单人跨太平洋赛事资源）. Offshore learning context. Scenarios are conceptual walkthroughs, not race compliance or a vessel-specific operating checklist.（远洋学习背景。情景为概念演示，不代表赛事合规或特定船舶操作清单。）

- Declared engineering assumptions（明确声明的工程假设） — Atlas representative refit（图谱示意改装配置）. Equipment geometry, circuit topology, tank volumes and performance coefficients are illustrative unless separately cited. No exact installation or capacity is asserted.（除单独引用外，设备几何、电路拓扑、水箱容量及性能系数均为示意，不宣称实际安装或容量。）

Coverage（覆盖）：124 nodes（节点），120 physical components（物理部件），13 systems（系统），124 relationships（关系）。
