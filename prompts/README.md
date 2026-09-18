# Prompts behind Solo Pacific Sailboat Atlas（帆船图谱的提示词）

These are the project-specific prompts supplied by the project owner in the build conversation, shared at their request so others can borrow the approach for similar interactive 3D models. The original brief is followed by the chronological refinements and release requests.（这些是项目所有者在构建对话中提供的项目提示词，应其要求分享，供其他交互式三维模型项目借鉴。先列原始需求，再按顺序列出补充与发布请求。）

The quoted blocks preserve the original languages and wording, including typos. Line wrapping and pasted HTML/escape artifacts have been normalized. The license-choice reply is identified separately from free-form prompts. Authentication exchanges, attachment paths, machine-generated context, plugin catalogs, and personal/global workspace instructions are omitted. No assistant replies or hidden reasoning are included.（引文保留原语言、原措辞及笔误，仅整理换行与粘贴产生的转义标记；许可选项回复单独标识。省略认证交流、附件路径、自动生成上下文、插件目录及个人／全局工作区指令，不包含助手回复或内部推理。）

This is a record of requested behavior, not proof that every request is fully satisfied. See the [validation report](../docs/VALIDATION.md) and [engineering audit](../docs/ENGINEERING-AUDIT.md) for evidence and limitations.（这是需求记录，不代表每项要求均已完全满足；实际证据与限制见验证记录和工程审计。）

These prompt documents are covered by the project's MIT license as original project documentation. Reuse of prompts does not grant rights to third-party drawings or the excluded model assets; see [LICENSE](../LICENSE) and [asset rights](../ASSET-RIGHTS.md).（提示词文档作为原创项目文档适用本项目 MIT 许可；复用提示词不授予第三方图纸或排除模型资产的权利。）

## How to adapt these prompts（如何改用这些提示词）

*Editorial guidance, not an original user prompt（以下为编辑建议，非用户原始提示词）:*

- Replace the subject, reference design, audience and real-world scenario.（替换对象、参考设计、受众与真实使用情景。）
- Define the component hierarchy, physical connections, energy/data/control paths and failure dependencies for that subject.（定义该对象的部件层级、物理连接、能量／数据／控制路径及故障依赖。）
- Keep the evidence classifications, expert-perspective audit, corrections and validation loop. Expert role prompting is not professional certification.（保留证据分类、专业视角审计、修正和验证循环；专业角色提示不等于专业认证。）
- Treat graph arrows as typed relationships, not a single electrical or mechanical chain. For example, battery power and compass feedback have different roles in autopilot operation.（将图谱箭头定义为不同类型关系，不要将它们误作单一电路或机械链；例如电池供电与罗经反馈在自动舵中承担不同作用。）
- Adapt languages, target devices, performance targets and deployment platform. Set publication permissions for your own project; historical publication prompts do not authorize actions on somebody else's accounts.（调整语言、设备、性能目标与部署平台；发布权限需针对自己的项目明确，历史提示词不授权操作他人账户。）

## 1. Original build prompt（原始构建提示词）

```text
Build me a production-quality interactive 3D web application called
“Solo Pacific Sailboat Atlas”.
The purpose is to teach me, visually and interactively, how a real
ocean-going monohull sailboat works, using a sailboat suitable for a
singlehanded San Francisco-to-Hawaii passage.
REFERENCE BOAT
Use the Cal 40 as the primary reference boat.
Use real published dimensions, sail plans, photographs, technical
drawings, manuals, class-association information, and other reliable
public sources wherever available.
Do NOT invent technical details merely to make the model look complete.
When exact geometry or internal placement cannot be established from
reliable sources:
1. use a physically plausible representative implementation,
2. clearly mark it as “illustrative / representative”,
3. distinguish it from source-verified geometry.
The assembled boat should accurately preserve the major dimensions,
proportions, hull form, rig geometry, keel, rudder, deck arrangement,
mast and sail plan of the reference design.
3D STRUCTURE
Treat the sailboat like an anatomical atlas.
Every meaningful component should be a separately selectable object or
logical component.
Organize components hierarchically:
Boat
→ Hull & Structure
→ Rigging
→ Sails
→ Steering
→ Propulsion
→ Electrical
→ Navigation & Communications
→ Safety
→ Anchoring
→ Plumbing & Water
→ Interior
→ Deck Hardware
→ Singlehanded Sailing Systems
Examples of individual components include:
hull shell
deck
bulkheads
stringers
keel
lead ballast
rudder
rudder stock
tiller or wheel system
mast
boom
spreaders
forestay
backstay
shrouds
chainplates
turnbuckles
halyards
sheets
blocks
traveler
winches
cleats
mainsail
jib
genoa
spinnaker
reefing hardware
engine
propeller shaft
propeller
fuel tank
batteries
alternator
solar panels
shore-power system
electrical panel
bilge pumps
fresh-water tanks
water pump
head
seacocks
through-hulls
VHF
AIS
GPS/chartplotter
depth sensor
wind instruments
autopilot
windvane self-steering if appropriate
EPIRB
liferaft
jacklines
tethers
PFD
fire extinguishers
anchor
chain
rode
windlass
galley
berths
navigation station
storage spaces
INTERACTION
I must be able to:
- orbit freely around the boat
- pan and zoom
- click any component
- highlight it
- isolate it
- hide it
- make surrounding structures transparent
- read its name
- read a short explanation of what it does
- see which other components it connects to
- search for any component
- select a system and show only that system
EXPLODED VIEW
Add a continuous “Explode Boat” slider.
At 0%, the boat is completely assembled.
As the slider increases, components should move outward smoothly while
preserving understandable spatial relationships.
At 100%, organize components into a readable exploded technical layout.
Do not simply scatter components randomly.
The exploded layout should make it obvious how components fit together.
Allow explosion by system as well:
Rigging Exploded View
Hull Exploded View
Steering Exploded View
Electrical Exploded View
Propulsion Exploded View
Safety Equipment Exploded View
Plumbing Exploded View
Interior Exploded View
CUTAWAY MODE
Add interactive cutaway controls.
Allow the user to:
hide the hull
make the hull semi-transparent
remove the deck
cut the boat longitudinally
cut it transversely
look below the waterline
look inside tanks and structural spaces
RIGGING MODE
Create a special Rigging mode.
Show:
mast
boom
standing rigging
running rigging
halyards
sheets
reefing lines
blocks
winches
traveler
chainplates
Selecting a line should visually trace its complete path through blocks,
winches and attachment points.
Explain what happens mechanically when the sailor pulls that line.
SAILING MODE
Add an educational sailing simulation.
Let me choose:
wind direction
wind speed
point of sail
mainsail trim
headsail trim
reefing state
Visualize:
apparent wind
true wind
sail forces
heel
rudder force
keel lateral force
boat velocity
This does not need to be a high-fidelity CFD simulator, but the physics
must be directionally correct and educational.
SINGLEHANDED PACIFIC MODE
Add a dedicated mode called:
“San Francisco → Hawaii Solo”
Show the boat configured for a real singlehanded ocean passage.
Include the additional systems typically important for solo offshore
sailing:
autopilot
backup steering
reefing controls
jacklines
tethers
AIS
VHF
EPIRB
satellite communications
navigation electronics
battery charging
solar generation
bilge pumping
water storage
food storage
storm sails
droque or emergency steering equipment where appropriate
Create clickable educational scenarios such as:
Reef the mainsail
Change headsail
Autopilot failure
Heavy-weather preparation
Night sailing
Squall approaching
Loss of electrical power
Steering failure
Man-overboard prevention
Entering the trade winds
Preparing for arrival in Hawaii
When a scenario is selected, highlight the components involved and show
the sequence in which a solo sailor would interact with them.
DATA ACCURACY
Before modeling, research the reference boat.
Prefer:
manufacturer or designer drawings
class-association documents
sail plans
technical manuals
credible sailboat databases
photographs of actual boats
reputable sailing organizations
Keep a Sources panel in the application.
For every technical claim or geometry derived from a source, retain the
source attribution.
Never silently convert an assumption into a fact.
VISUAL DESIGN
Make the experience feel like a high-end engineering museum exhibit.
Clean light background.
Large central 3D model.
Minimal interface.
Excellent typography.
Smooth transitions.
Subtle shadows.
Physically plausible materials.
Use restrained colors to identify systems consistently.
For example, different systems should be visually distinguishable
without making the boat look like a toy.
UI
Left sidebar:
system hierarchy and visibility controls
Top:
search
Right side:
selected-component information
Bottom:
Explode Boat slider
Include buttons for:
Assembled
Exploded
Cutaway
Rigging
Below Deck
Electrical
Steering
Safety
Solo Pacific
TECHNICAL IMPLEMENTATION
Build this as a browser-native application.
Prefer React + Three.js / React Three Fiber where appropriate.
Use GLTF/GLB for geometry.
Use geometry instancing/batching and efficient picking so that hundreds
of independently selectable parts remain responsive.
Desktop and mobile must both work.
Target smooth interaction on a modern iPhone and desktop browser.
Do not fake detailed components using flat images if actual 3D geometry
can reasonably be created.
VALIDATION
After building it:
run the application yourself,
inspect it from multiple angles,
test component selection,
test mobile layout,
test the exploded view,
verify that components do not collide badly,
verify that labels correspond to the correct parts,
verify that the boat reassembles correctly.
Fix visible problems before presenting the result.
Finally show me the working interactive application, the source code,
the geometry/data sources you used, and a short report distinguishing:
SOURCE-VERIFIED COMPONENTS
APPROXIMATED COMPONENTS
ILLUSTRATIVE COMPONENTS
```

## 2. Engineering and offshore-sailing audit（工程与远洋独航审计）

```text
add into the plan: when the model is done, audit the model as a marine engineer and experienced singlehanded offshore sailor.
Find every component whose geometry, placement, mechanical connection, rigging path or function is likely inaccurate.
For each questionable item, find better primary or authoritative reference material, correct the model, and rerun the validation.
Prioritize mechanical correctness over visual beauty.
```

## 3. Knowledge graph, not just geometry（知识图谱与三维模型）

```text
不要只做“帆船 3D 模型”，而是做“帆船知识图谱 + 3D 模型”。
比如点 autopilot，不只是把 autopilot 高亮，而是显示：
Autopilot → rudder → boat heading → compass/IMU → battery → solar panel
点 mainsheet：
mainsheet → block → traveler → boom → mainsail → aerodynamic force
点 battery failure：
battery → autopilot ✕ → AIS ✕ → VHF ? → navigation ? → emergency alternatives
这样它就开始从“漂亮的 3D demo”变成真正帮助用户理解一条船怎么工作的工具。
```

## 4. Bilingual text and execution（双语文字与实施）

```text
all text in the model should be side by side bilingual English (Simplified Chinese), the execute the plan
```

## 5. Git milestones（Git 里程碑）

```text
use git to save intermediate results and milestones.
```

## 6. Public-repository assessment（公开仓库评估）

```text
看看这个git repo 适合发步到github publicly 不？
```

## 7. Completion and sanitization（完成与脱敏）

```text
is the repo ready to be sanitized for public releasing? if not , finish it based on its plan, then sanitize.
```

## 8. Application-code license choice（应用代码许可选择）

Reply to the application-code license selection; model assets were explicitly excluded pending rights clarification.（针对应用代码许可证选择的回复；模型资产在权利确认前明确排除。）

```text
MIT for application code
```

## 9. Hosting assessment（托管评估）

```text
is Cloudflare Workers suitable for deployment?
```

## 10. Publication and deployment（公开发布与部署）

```text
push the sanitized repo to github , then deploy to cloudflare. make best decisions if you need to. or ask me if I am really needed.
```

## 11. Share this prompt history（分享本提示词历史）

```text
share all my prompts used so others can borrow my ideas to build similar 3D models. the prompts can be put into some readme file I guess
```
