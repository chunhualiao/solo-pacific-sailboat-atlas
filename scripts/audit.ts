import { readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { parts, edges, systems, sources, t, b } from "../src/data";
import manifest from "../src/manifest.json";
const stamp = new Date().toLocaleString("sv-SE", {
  timeZone: "America/Los_Angeles",
});
const sha = createHash("sha256")
  .update(readFileSync("public/models/cal40.glb"))
  .digest("hex");
const findings = [
  [
    "A01",
    "GLB node identity",
    "GLB 节点标识",
    "Imported nodes were not guaranteed to be Three.Group; use component metadata rather than class identity.",
    "导入节点不保证为 Three.Group；改用部件元数据识别。",
    "Browser visibility and exact reassembly tests",
    "浏览器显隐与精确复位测试",
  ],
  [
    "A02",
    "Hull sections and waterline",
    "船体横剖面与水线",
    "Narrow sections exposed interior geometry. Reconstructed flatter bilges and corrected centerline waterline from 8.478 m to 9.24 m.",
    "狭窄剖面使舱内部件外露；重建较平缓舭部，并将中心线水线长由 8.478 米校正为 9.24 米。",
    "Original lines, sheet 204/2; dimension and containment tests",
    "原始型线图 204/2；尺寸与包络测试",
  ],
  [
    "A03",
    "Bulkheads, berths and deck",
    "舱壁、铺位与甲板",
    "Rectangular interior panels were not constrained by hull shape. Profiled bulkheads, tapered forward berths, and deck sheer now follow the shell.",
    "矩形内部板件未受船壳形状约束；舱壁、渐缩前铺位及甲板舷弧现已适配船壳。",
    "Original section/cabin drawings 204/5 and 204/4; vertex containment checks",
    "原始剖面／舱室图 204/5、204/4；顶点包络检查",
  ],
  [
    "A04",
    "Moving sail and steering attachments",
    "运动中的帆装与操舵连接",
    "Replaced center-based rotations with luff/stock pivots. Regenerated connected running lines as trim, reef and rudder settings change.",
    "用帆前缘／舵轴旋转替代绕网格中心旋转；随调帆、缩帆与舵角变化重建连接索路。",
    "Raymarine drive guide, original rig drawing, kinematics tests",
    "Raymarine 驱动指南、原始帆装图及运动学测试",
  ],
  [
    "A05",
    "Mainsheet purchase",
    "主帆缭绳滑轮组",
    "Straight cross-sheave shortcuts were replaced by arcs in the sheave planes, with four moving-block supporting strands.",
    "跨滑轮直线捷径改为滑轮平面内的弧线，形成四段承载动滑轮的绳段。",
    "Harken reeving principles; representative single-speed geometry and attachment tests",
    "Harken 穿绳原理；示意单速几何与连接测试",
  ],
  [
    "A06",
    "Spinnaker support",
    "球帆支撑",
    "Added a representative pole, topping lift and afterguy, visible only in the spinnaker configuration.",
    "补充示意撑杆、吊索与后拉索，仅在球帆配置中显示。",
    "Original sail plan and declared refit assumptions; configuration test",
    "原始帆装图及明确的改装假设；配置测试",
  ],
  [
    "A07",
    "Power and feedback graph",
    "供电与反馈图谱",
    "Separated charging, supply, control, measurement and feedback edges. Independent handhelds preserve reduced voice/position capability after house supply loss.",
    "区分充电、供电、控制、测量与反馈；生活电源失效后独立手持设备可保留有限通信／定位能力。",
    "Raymarine network documentation and failure propagation tests",
    "Raymarine 网络资料与故障传播测试",
  ],
  [
    "A08",
    "Controller and navigation equipment placement",
    "控制器与导航设备位置",
    "Moved the solar controller away from directly above the battery; separated radio equipment and widened its supporting surface.",
    "将太阳能控制器移离电池正上方；分隔无线电设备并加宽支承面。",
    "Victron installation section 4.1; inspected model layout",
    "Victron 安装说明第 4.1 节；模型布置检查",
  ],
  [
    "A09",
    "Selectable geometry batching",
    "可选几何批处理",
    "Merged compatible surfaces within component IDs instead of losing selection through whole-boat merging.",
    "在部件标识内部合并兼容曲面，避免整船合并导致选取信息丢失。",
    "Geometry coverage and draw-call inspection",
    "几何覆盖与绘制调用检查",
  ],
];
const coverage = parts.map((p) => ({
  id: p.id,
  name: p.name,
  system: p.system,
  classification: p.evidence,
  physical: !p.abstract,
  sources: p.sources,
  connections: edges.filter((e) => e.from === p.id || e.to === p.id),
  geometry: p.abstract ? null : manifest[p.id as keyof typeof manifest],
  disposition: b(
    "Reviewed at educational reconstruction level; exact installation remains unverified.",
    "已按教学重建层级审阅；精确安装仍未核实。",
  ),
}));
writeFileSync(
  "public/audit.json",
  JSON.stringify(
    {
      timestamp: stamp + " America/Los_Angeles",
      modelSha256: sha,
      findings,
      coverage,
    },
    null,
    2,
  ),
);
const lines = [
  `# Marine engineering and offshore-sailing audit（船舶工程与远洋独航审计）`,
  `\n${stamp} America/Los_Angeles`,
  `\nModel SHA-256（模型散列）：\`${sha}\``,
  "\nThis is an evidence-based educational model review, not professional certification or a surveyed Cal 40 replica.（这是基于证据的教学模型审阅，不是专业认证或实船测绘复制品。）",
  "\n## Corrections and evidence（修正与证据）",
  ...findings.map(
    ([id, en, zh, desc, dz, validation, vz]) =>
      `\n### ${id} ${en}（${zh}）\n\n${desc}（${dz}）\n\nValidation（验证）：${validation}（${vz}）。`,
  ),
  "\n## Five-why root causes（五问根因）",
  "\n1. Interior parts protruded because their rectangular bounds exceeded the shell.（内部部件穿壳，因为矩形边界超出船壳。）\n2. The shell was too narrow near the waterline because a generic section curve was used.（水线附近船壳偏窄，因为采用了通用剖面曲线。）\n3. That curve was not calibrated against both the body plan and the waterline length.（曲线没有同时依据横剖面与水线长校准。）\n4. Early checks covered data and transform integrity but not physical containment.（早期检查覆盖数据和变换完整性，却缺少物理包络约束。）\n5. Dimensional and mating constraints were not executable acceptance tests. The correction made them tests and updated the geometry generator, rather than hiding the exposed meshes.（尺寸和装配约束尚未成为可执行验收测试。修正将其写成测试并更新几何生成器，而非隐藏外露网格。）",
  "\nFor visibility: incorrect sail states → component loop skipped nodes → imported node classes differed → generator runtime types were assumed to survive export → missing GLB integration coverage. Stable metadata plus a real-browser configuration test address the root cause.（显隐根因链：帆状态错误 → 部件循环漏掉节点 → 导入节点类型变化 → 假定生成器类型在导出后保持不变 → 缺少 GLB 集成覆盖。稳定元数据与真实浏览器配置测试解决此根因。）",
  "\n## Source-verified facts（来源核实事实）",
  "\nPublished Cal 40 baseline: LOA 11.99 m, LWL 9.24 m, beam 3.35 m, draft 1.70 m. Rig baseline I 14.02 m, J 4.62 m, P 12.19 m, E 5.33 m. These facts do not certify every surface or equipment location.（已公布的 Cal 40 基准：总长 11.99 米、水线长 9.24 米、船宽 3.35 米、吃水 1.70 米；帆装 I 14.02 米、J 4.62 米、P 12.19 米、E 5.33 米。这些事实不代表所有曲面和设备位置已经核实。）",
  "\n## Approximated components（近似重建部件）",
  "\n" +
    parts
      .filter((p) => p.evidence === "approximated")
      .map((p) => t(p.name))
      .join(" · "),
  "\n## Illustrative components and limits（示意部件与限制）",
  "\nModern refit machinery, electronics, safety gear, hidden reinforcement, circuits, hoses and line routing are representative. Sail cloth, foil sections and shell thickness are simplified. Exact scantlings, load ratings, tank capacities, battery capacities and boat-specific equipment installation are not established.（现代改装机械、电子设备、安全装备、隐藏加强件、电路、软管与索路为代表性配置。帆布、翼型与船壳厚度已简化。未建立精确结构尺寸、载荷等级、水箱容量、电池容量或实船设备安装参数。）",
  "\nThe sailing model uses assumed coefficients and simplified resistance/righting behavior; it is not validated against Cal 40 polars. Failure logic models declared circuit/control dependencies, not every marine casualty. Cut faces are visual sections, not verified laminate schedules. Mobile browser emulation is not a physical iPhone performance measurement.（航行模型采用假设系数和简化阻力／复原模型，未用 Cal 40 极线验证。故障逻辑模拟明确的电路／控制依赖，而非所有海事事故。剖面不是经核实的铺层结构。移动浏览器模拟不等于真实 iPhone 性能测量。）",
  "\n## Component coverage（部件覆盖）",
  "\n| Component（部件） | Classification（分类） | Relations（关系数） | Sources（来源标识） |\n| --- | --- | --- | --- |",
  ...coverage.map(
    (c) =>
      `| ${t(c.name)} | ${c.classification === "approximated" ? "Approximated（近似）" : "Illustrative（示意）"} | ${c.connections.length} | ${c.sources.join(", ")} |`,
  ),
  "\n## Source register（来源目录）",
  ...sources.map(
    (s) =>
      `\n- ${s.url ? `[${t(s.name)}](${s.url})` : t(s.name)} — ${t(s.locator)}. ${t(s.note)}`,
  ),
  `\nCoverage（覆盖）：${parts.length} nodes（节点），${parts.filter((p) => !p.abstract).length} physical components（物理部件），${systems.length} systems（系统），${edges.length} relationships（关系）。`,
];
writeFileSync("docs/ENGINEERING-AUDIT.md", lines.join("\n") + "\n");
writeFileSync("public/audit.md", lines.join("\n") + "\n");
console.log(stamp, "audit coverage:", coverage.length, "model:", sha);
