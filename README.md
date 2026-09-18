# Solo Pacific Sailboat Atlas（独航太平洋帆船知识图谱）

A bilingual Cal 40 learning application: 120 selectable 3D components, 13 systems, a 124-node / 124-edge knowledge graph, configuration-aware failure propagation, and eleven solo-passage walkthroughs.（双语 Cal 40 学习应用：120 个可选择三维部件、13 个系统、124 节点／124 关系知识图谱、考虑配置的故障传播及 11 个独航情景。）

## Build a similar 3D atlas（构建类似三维图谱）

Read the [complete project prompt history](prompts/README.md): the original build brief, engineering audit requirements, knowledge-graph examples, bilingual UI instruction, Git milestones, and release/deployment follow-ups. The prompts are shared for reuse and adaptation; documented implementation limits still apply.（查看完整项目提示词历史：原始需求、工程审计、知识图谱示例、双语界面、Git 里程碑及发布／部署补充。可复用与改编，但仍需参考已记录的实现限制。）

## Run（运行）

Requires Node.js 22.12+ or 24+ and npm.（需要 Node.js 22.12+ 或 24+ 及 npm。）

```sh
npm ci
npm run dev -- --host 127.0.0.1 --port 5173 --strictPort
```

Open `http://127.0.0.1:5173`. （在浏览器打开此地址。）

```sh
npm run format:check
npm run lint
npm test
npm run build
npx playwright install chromium
npm run test:e2e
npm run preview -- --host 127.0.0.1 --port 4179 --strictPort
```

## Explore（探索）

- Select a physical part in the canvas or searchable system tree. Hide, isolate, make transparent, or focus it. Drag to orbit, right-drag to pan, scroll/pinch to zoom.（通过模型或系统目录选择部件，隐藏、隔离、透明或聚焦；拖动旋转，右键拖动平移，滚轮／双指缩放。）
- Select autopilot, mainsheet, or battery to open their complete learning chain. Click graph nodes to select the corresponding 3D component; click edges for typed relationships and evidence.（选择自动舵、主帆缭绳或电池，打开完整学习链；图节点联动三维部件，关系线显示类型与依据。）
- Inject failures and compare independent handheld backups. Charging is not treated as an independent battery replacement.（注入故障并比较独立手持备用设备；充电来源不被视为电池的独立替代品。）
- Use continuous whole-boat or system explosion, hull/deck removal, adjustable section planes, and tank opening. Reset restores original assembly coordinates exactly.（连续拆解整船或系统，移除船壳／甲板、调整剖面并打开水箱；重置精确恢复装配坐标。）
- Explore wind, trim, reefs and steering in the sailing lab; follow all eleven Solo Pacific scenarios.（在航行实验中探索风、调帆、缩帆与操舵，并体验 11 个独航情景。）

## Evidence and accuracy（依据与精度）

**Source-verified facts（来源核实事实）:** published principal dimensions and explicitly cited functional relationships. Verification applies to the fact, not every surface of a component.（公布主尺度及明确引用的功能关系；核实针对具体事实，不代表整个部件曲面已核实。）

**Approximated geometry（近似几何）:** hull, keel, rudder, sails and accommodation reconstructed from inspected Lapworth drawings.（依据查阅的拉普沃思图纸重建船体、龙骨、舵、帆及舱室。）

**Illustrative equipment（示意设备）:** representative modern refit, detailed hardware, circuits, plumbing routes and simulation coefficients.（现代改装配置、细部五金、电路、管路及模拟系数为示意。）

Read [engineering audit](docs/ENGINEERING-AUDIT.md), [machine-readable component ledger](public/audit.json), and [validation evidence](docs/VALIDATION.md). Sources and audit links are also inside the app. This is an educational reconstruction, not a survey, installation specification, race-compliance certification or measured Cal 40 performance predictor.（查看工程审计、逐部件台账与验证证据；应用内也可查阅。本作品为教学重建，不是实船测绘、安装规范、赛事认证或实测性能预测。）

## Source map（代码导览）

| File（文件） | Responsibility（职责） |
| --- | --- |
| `src/data.ts` | Bilingual catalog, evidence, typed graph and scenarios（双语目录、依据、类型化图谱与情景） |
| `src/domain.ts` | Dependency propagation and educational dynamics（依赖传播与教学动力学） |
| `src/geometry.ts` | Procedural geometry and deterministic assembly/explosion（程序化几何与确定性装配／拆解） |
| `src/kinematics.ts` | Sail/stock pivots and connected line paths（帆／舵轴旋转与连接索路） |
| `src/Scene.tsx` | GLB display, picking, clipping, movement, recovery（模型显示、拾取、剖切、运动与恢复） |
| `src/App.tsx` | Bilingual interface and graph interaction（双语界面与图谱交互） |
| `public/models/cal40.glb` | Generated local 3D asset（生成的本地三维资产） |
| `scripts/generate.ts` | Regenerate GLB and manifest: `npm run geometry`（重新生成模型及清单） |
| `scripts/audit.ts` | Regenerate coverage and audit: `npm run audit`（重新生成覆盖台账与审计） |


## Release status（发布状态）

This is a sanitized educational prototype snapshot. Application code is MIT; model-related rights remain unresolved under ASSET-RIGHTS.md. The source is published on GitHub; deployment uses Cloudflare Workers Static Assets.（这是脱敏的教学原型快照；应用代码采用 MIT，模型相关权利仍待确认。源码发布于 GitHub，部署使用 Cloudflare Workers 静态资产托管。）

## Licensing and deployment（许可与部署）

Original application software is MIT: see [LICENSE](LICENSE). Model-related files are excluded pending rights clarification: see [ASSET-RIGHTS.md](ASSET-RIGHTS.md). Dependency and font notices are in [THIRD-PARTY-NOTICES.md](THIRD-PARTY-NOTICES.md).（应用软件采用 MIT；模型相关文件在权利确认前排除在外，依赖与字体声明另列。）

For project-path hosting, build with `npm run build -- --base=/repository-name/`. Verify with `npm run test:release`.（项目子路径托管请指定基础路径并运行发布测试。）

## Cloudflare deployment（Cloudflare 部署）

Build output only is uploaded; no backend, database or paid storage is required.（只上传构建产物，不需要后端、数据库或付费存储。）

```sh
npm ci
npm run deploy:check
npx wrangler login
npm run deploy
```

Authenticate locally; never commit tokens or account credentials. `wrangler.jsonc` uses the account's workers.dev subdomain.（在本机认证，不提交令牌或账户凭据；配置使用账户的 workers.dev 子域。）
