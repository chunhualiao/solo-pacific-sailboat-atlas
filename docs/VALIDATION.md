# Validation and acceptance（验证与验收）

Recorded 2026-09-17 22:02 America/Los_Angeles. Local Chromium, macOS; Node 26.4.0.（本地 Chromium 与 macOS；Node 26.4.0。）

| Requirement（要求） | Evidence（证据） | Result（结果） |
| --- | --- | --- |
| Bilingual catalog, sources and scenarios（双语目录、来源与情景） | `tests/domain.test.ts`; desktop/mobile screenshots（桌面／移动端截图） | Passed（通过） |
| Physical components and graph coverage（物理部件与图谱覆盖） | 120 GLB component IDs; 124 graph nodes, 124 typed edges; no orphan components（无孤立部件） | Passed（通过） |
| Hull and accommodation consistency（船壳与舱室一致性） | Dimension, waterline and vertex containment tests; original drawing review（尺寸、水线、顶点包络与原图审阅） | Passed within reconstruction scope（重建范围内通过） |
| Moving attachment continuity（运动连接连续性） | Luff/stock pivot and sheet attachment regression tests（前缘／舵轴及缭绳连接测试） | Passed（通过） |
| Autopilot / mainsheet / battery chains（自动舵／缭绳／电池链） | Curated graph paths; actual browser navigation; independent-backup and branch-fault tests（图谱路径、浏览器交互、独立备用与支路故障测试） | Passed（通过） |
| Whole boat and per-system explosion（整船与按系统拆解） | 0/25/50/75/100% browser checks; deterministic interpolation and nonoverlapping target boxes（浏览器检查、确定性插值与目标包络不重叠） | Passed（通过） |
| Exact reassembly（精确复位） | Browser compares every physical component position after reset（浏览器逐项比较恢复位置） | Passed（通过） |
| Visibility, isolation, clipping and configuration（显隐、隔离、剖切与配置） | Live GLB, section, tank and headsail controls（真实 GLB、剖面、水箱与前帆控件） | Passed（通过） |
| Direct canvas manipulation（直接操作画布） | Real pointer selection, orbit, right-drag pan and wheel zoom（真实指针拾取、旋转、右键平移与滚轮缩放） | Passed（通过） |
| Eleven solo-passage scenarios（十一项独航情景） | Every scenario and step exercised in browser（浏览器遍历每个情景及步骤） | Passed（通过） |
| Mobile layout（移动端布局） | 390×844 viewport; no horizontal overflow; bilingual search and source dialog（无横向溢出、双语搜索与来源对话框） | Passed in emulation（模拟环境通过） |
| Graphics interruption（图形中断） | Synthetic context events verify bilingual recovery and retained catalog（模拟上下文事件验证双语恢复与目录保留） | Passed; not GPU fault injection（通过，非实际 GPU 故障注入） |
| Rendering budget（渲染预算） | Measured 169 calls / 55,168 triangles in exercised desktop view（测试桌面视角实测） | Under 200 / 250k targets（低于目标） |
| Frame-rate target on physical iPhone（实机 iPhone 帧率目标） | No physical-device session available（无实机测试会话） | Unverified（未验证） |
| Build / types / lint / formatting（构建／类型／静态检查／格式） | `logs/build-final.txt`, `logs/lint.txt`, `logs/format-check.txt` | Passed（通过） |
| Unit and geometry tests（单元及几何测试） | `logs/tests-final.txt`: 17 tests（17 项） | Passed（通过） |
| Browser regression（浏览器回归） | `logs/browser-final.txt`: 6 tests, 32.1 s（6 组，32.1 秒） | Passed（通过） |
| Built app preview（构建产物预览） | `http://127.0.0.1:4179`; manually opened and inspected autopilot chain（手动打开并检查自动舵学习链） | Running locally（本地运行中） |

Screenshots in `docs/screenshots/` cover assembled, exploded, interior, graph, sailing, mobile, bow, stern, port, starboard, top and underwater views. Multiple-angle section screenshots intentionally show the active longitudinal cut. The initial mobile title/mast overlap was corrected by reserving canvas space below the bilingual heading.（截图覆盖整船、拆解、舱内、图谱、航行、移动端及六向视角；多向剖视截图保留纵剖状态。移动端标题与桅杆重叠已通过预留画布空间修正。）

## Remaining limits（仍存限制）

- Original drawings support an approximate educational reconstruction. Exact offsets, laminate thickness, scantlings, hardware load ratings and vessel-specific service clearances are not certified. See audit classifications rather than interpreting passing software tests as physical certification.（原图支持近似教学重建；精确型值、层板厚度、构件尺寸、五金额定载荷及实船维修间隙未经认证；软件测试通过不等于物理认证。）
- Sailing coefficients are illustrative, not measured polars. Scenarios are conceptual learning sequences, not vessel-specific operating checklists.（航行系数为示意，非实测极线；情景为概念学习，非特定船舶操作清单。）
- Physical iPhone frame rate and sustained thermal behavior remain unmeasured. The initial JavaScript bundle is 1.32 MB / 374 kB gzip; Vite emits a chunk-size advisory. Three.js/R3F emits an upstream Clock deprecation warning; no browser page errors occurred in the interaction test.（实机帧率与持续温升未测；初始 JavaScript 约 1.32 MB／gzip 374 kB，构建工具提示包体较大；上游库有 Clock 弃用提示，交互测试无页面异常。）
- No remote repository exists. CI and deterministic non-closing PR metadata checks are supplied as configuration only. No remote CI run, branch protection, bot review, PR, post-merge acceptance trigger or production deployment is claimed.（无远程仓库；CI 与禁止自动关闭 issue 的元数据检查仅提供配置，未宣称远程运行、保护、审阅、PR、合并后验收触发或生产部署。）

Local implementation and documented automated validation are delivered. Overall production/device acceptance remains open for the explicit unverified items above.（本地实现及已记录自动化验证已交付；上述未验证项的生产／设备验收仍保留。）

## Public-release preparation（公开发布准备）

The production subpath test first failed: root-relative model requests bypassed the configured project base, leaving zero loaded components. Root cause: static public asset paths did not share Vite's deployment base. All model preload/load and audit links now use `import.meta.env.BASE_URL`; the build defaults to a relative base. The new real-browser production test checks all 120 components, audit URLs and HTTP errors under `/atlas/`.（生产子路径测试首先失败：绝对资源路径绕过项目基础路径，加载部件数为零。根因为公共资源路径未共用 Vite 部署基础路径；现已统一修正，并新增真实浏览器生产测试。）

The original local Git history is preserved. Public export uses a new main root commit, generic contributor identity, redacted home-directory paths and private network addresses, and excludes the original request, session research log, local issue files and live development-server log. Model rights clarification and real-iPhone performance remain unresolved; neither is marked complete by sanitization.（保留原本地历史；公开导出使用新的 main 根提交、通用贡献者身份，隐去本机路径与私有网络地址，排除原始请求、会话研究日志、本地 issue 及开发服务器日志。脱敏不代表模型权利或实机性能问题已解决。）

Release preparation rerun（发布准备复测）: 2026-09-17T22:12:17.859575-07:00 — 17 domain/geometry tests, 6 browser groups, 1 production subpath test, lint, formatting and build passed.（17 项领域／几何、6 组浏览器、1 项生产子路径测试及静态检查、格式与构建通过。）
