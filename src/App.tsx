import { Component, useMemo, useState, type ReactNode } from "react";
import {
  Anchor,
  Search,
  Layers3,
  Compass,
  Eye,
  EyeOff,
  Focus,
  RotateCcw,
  Maximize2,
  Network,
  BookOpen,
  ChevronRight,
  ChevronLeft,
  X,
  Wind,
  Menu,
  Move3D,
  Info,
  ArrowUpRight,
  Check,
  AlertTriangle,
} from "lucide-react";
import { Scene, type SceneState } from "./Scene";
import {
  b,
  t as bilingualText,
  parts,
  byId,
  systems,
  sources,
  edges,
  relationLabels,
  scenarios,
  stepNotes,
  type Bi,
} from "./data";
import { evaluate, sailing, type Status } from "./domain";
import { useLanguage } from "./Language";
const initial: SceneState = {
  selected: "mainsail",
  hidden: [],
  system: "",
  isolate: false,
  ghost: false,
  explode: 0,
  explodeSystem: "",
  mode: "assembled",
  hullMode: "solid",
  deckOff: false,
  section: "none",
  sectionOffset: 0,
  tanksOpen: false,
  headsail: "jib",
  wind: 16,
  angle: 60,
  main: 25,
  jib: 25,
  reef: 0,
  rudder: 0,
  focus: 0,
  camera: "default",
  labels: false,
  highlights: [],
};
const modes = [
  ["assembled", "Assembled", "整船"],
  ["exploded", "Exploded", "拆解"],
  ["cutaway", "Cutaway", "剖视"],
  ["rig", "Rigging", "索具"],
  ["below", "Below deck", "舱内"],
  ["electrical", "Electrical", "电气"],
  ["steering", "Steering", "操舵"],
  ["safety", "Safety", "安全"],
  ["sailing", "Sailing lab", "航行实验"],
  ["solo", "Solo Pacific", "独航太平洋"],
];
const statusNames = {
  operating: b("Operating", "正常"),
  failed: b("Failed", "失效"),
  degraded: b("Degraded", "降级"),
  conditional: b("Conditional", "待确认"),
};
class Boundary extends Component<{ children: ReactNode }, { error: boolean }> {
  state = { error: false };
  static getDerivedStateFromError() {
    return { error: true };
  }
  render() {
    return this.state.error ? <SceneError /> : this.props.children;
  }
}
function SceneError() {
  const { text } = useLanguage();
  return (
    <div className="scene-error">
      <AlertTriangle />
      <h2>{text("3D view could not load", "三维视图无法加载")}</h2>
      <p>
        {text(
          "Reload the page or use the component catalog. WebGL must be available.",
          "请刷新页面或使用部件目录；三维视图需要 WebGL。",
        )}
      </p>
    </div>
  );
}
function Label({ value }: { value: Bi }) {
  const { bilingual } = useLanguage();
  return (
    <>
      {value.en}
      {bilingual && (
        <span className="zh" lang="zh-CN">
          （{value.zh}）
        </span>
      )}
    </>
  );
}
function Range({
  label,
  value,
  min = 0,
  max = 100,
  step = 1,
  onChange,
  suffix = "",
}: {
  label: Bi;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange: (v: number) => void;
  suffix?: string;
}) {
  const { t } = useLanguage();
  return (
    <label className="range">
      <span>
        <Label value={label} />
        <strong>
          {value}
          {suffix}
        </strong>
      </span>
      <input
        aria-label={t(label)}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(+e.target.value)}
      />
    </label>
  );
}
function KnowledgeGraph({
  selected,
  onSelect,
  onEdge,
  depth,
  statuses,
}: {
  selected: string;
  onSelect: (id: string) => void;
  onEdge: (i: number) => void;
  depth: number;
  statuses: Record<string, Status>;
}) {
  const { text } = useLanguage();
  const direct = edges.filter((e) => e.from === selected || e.to === selected);
  const ids = new Set([selected, ...direct.flatMap((e) => [e.from, e.to])]);
  if (depth === 2) {
    const near = new Set(ids);
    edges
      .filter((e) => near.has(e.from) || near.has(e.to))
      .forEach((e) => {
        ids.add(e.from);
        ids.add(e.to);
      });
  }
  const learningCases: Record<string, string[]> = {
    autopilot: [
      "autopilot",
      "drive",
      "tiller-arm",
      "rudder-stock",
      "rudder",
      "heading",
      "imu",
      "panel",
      "bus-wire",
      "fuse",
      "battery",
      "controller",
      "solar",
    ],
    mainsheet: [
      "mainsheet",
      "block-upper",
      "block-lower",
      "traveler-car",
      "traveler",
      "boom",
      "mainsail",
      "aero-force",
    ],
    battery: [
      "battery",
      "fuse",
      "bus-wire",
      "panel",
      "autopilot",
      "ais",
      "vhf",
      "gps",
      "handheld",
      "backup-gps",
      "communication",
      "navigation",
      "controller",
      "solar",
    ],
  };
  const nodes =
    depth === 1 && learningCases[selected]
      ? learningCases[selected]
      : [...ids].slice(0, 24);
  const compact = window.matchMedia("(max-width:600px)").matches;
  const cols = compact ? 2 : Math.ceil(Math.sqrt(nodes.length));
  const w = compact ? 350 : 760,
    h = Math.max(300, Math.ceil(nodes.length / cols) * 95);
  const positions = Object.fromEntries(
    nodes.map((id, i) => [
      id,
      {
        x: 30 + (i % cols) * ((w - 60) / cols),
        y: 30 + Math.floor(i / cols) * 95,
      },
    ]),
  );
  const bw = (w - 60) / cols - 15;
  return (
    <svg
      className="knowledge-svg"
      viewBox={`0 0 ${w} ${h}`}
      role="group"
      aria-label={text("Interactive knowledge graph", "交互式知识图谱")}
    >
      <defs>
        <marker
          id="arrow"
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="5"
          markerHeight="5"
          orient="auto-start-reverse"
        >
          <path d="M0 0 L10 5 L0 10z" fill="#a3b2ad" />
        </marker>
      </defs>
      {edges.map((e, i) => {
        const a = positions[e.from],
          z = positions[e.to];
        return a && z ? (
          <path
            key={i}
            className="graph-edge"
            d={`M${a.x + bw / 2},${a.y + 49} Q${(a.x + z.x + bw) / 2 + 20},${(a.y + z.y) / 2 + 80} ${z.x + bw / 2},${z.y}`}
            markerEnd="url(#arrow)"
            onClick={() => onEdge(i)}
          >
            <title>
              {text(relationLabels[e.type].en, relationLabels[e.type].zh)}
            </title>
          </path>
        ) : null;
      })}
      {nodes.map((id) => {
        const p = positions[id];
        return (
          <foreignObject x={p.x} y={p.y} width={bw} height={66} key={id}>
            <button
              className={`graph-node ${statuses[id].state} ${selected === id ? "active" : ""}`}
              onClick={() => onSelect(id)}
            >
              <Label value={byId[id].name} />
            </button>
          </foreignObject>
        );
      })}
    </svg>
  );
}
export default function App() {
  const { t, text, bilingual, setBilingual } = useLanguage();
  const [collapsed, setCollapsed] = useState({
    left: false,
    top: false,
    bottom: false,
  });
  const [state, setState] = useState<SceneState>(initial),
    [query, setQuery] = useState(""),
    [expanded, setExpanded] = useState<string[]>(["rig", "sails"]),
    [tab, setTab] = useState("component"),
    [showSources, setShowSources] = useState(false),
    [graph, setGraph] = useState(false),
    [depth, setDepth] = useState(1),
    [edgeIndex, setEdgeIndex] = useState<number | null>(null),
    [failure, setFailure] = useState(""),
    [backup, setBackup] = useState(true),
    [scenario, setScenario] = useState(""),
    [step, setStep] = useState(0),
    [sidebar, setSidebar] = useState(false),
    [inspector, setInspector] = useState(true);
  const update = (s: Partial<SceneState>) => setState((p) => ({ ...p, ...s }));
  const selected = byId[state.selected];
  const sys = systems.find((s) => s.id === selected.system)!;
  const related = useMemo(
    () =>
      edges.filter((e) => e.from === state.selected || e.to === state.selected),
    [state.selected],
  );
  const statuses = useMemo(() => evaluate(failure, backup), [failure, backup]);
  const sim = sailing(
    state.wind,
    state.angle,
    state.main,
    state.jib,
    state.reef,
    state.rudder,
    state.headsail,
  );
  const selectedScenario = scenarios.find((s) => s.id === scenario);
  function select(id: string) {
    if (["autopilot", "mainsheet", "battery"].includes(id)) setGraph(true);
    const p = byId[id];
    update({
      selected: id,
      hidden: state.hidden.filter((x) => x !== id),
      system: state.system && state.system !== p.system ? "" : state.system,
      ghost:
        ["electrical", "propulsion", "plumbing", "interior"].includes(
          p.system,
        ) || state.ghost,
      highlights: edges
        .filter((e) => e.from === id || e.to === id)
        .flatMap((e) => [e.from, e.to]),
      ...(p.system === "sails" && !p.abstract && id !== "mainsail"
        ? { headsail: id }
        : {}),
    });
    if (window.matchMedia("(max-width: 900px)").matches) setInspector(true);
    setEdgeIndex(null);
  }
  function mode(id: string) {
    setFailure("");
    setScenario("");
    setStep(0);
    setGraph(false);
    setTab(id === "solo" ? "scenarios" : "component");
    setState((p) => ({
      ...initial,
      selected:
        (
          {
            electrical: "battery",
            steering: "rudder",
            safety: "epirb",
            below: "galley",
            rig: "mainsheet",
            sailing: "mainsail",
            solo: "autopilot",
          } as Record<string, string>
        )[id] || p.selected,
      mode: id,
      explode: id === "exploded" ? 1 : 0,
      hullMode: ["cutaway", "below"].includes(id) ? "transparent" : "solid",
      deckOff: ["cutaway", "below"].includes(id),
      system: ["electrical", "steering", "safety"].includes(id) ? id : "",
      focus: p.focus + 1,
      camera: "default",
      ghost: false,
    }));
  }
  function startScenario(id: string) {
    const s = scenarios.find((s) => s.id === id)!;
    setScenario(id);
    setStep(0);
    setFailure(
      id === "power"
        ? "battery"
        : id === "pilot"
          ? "autopilot"
          : id === "steering"
            ? "rudder-stock"
            : "",
    );
    update({
      mode: "solo",
      system: "",
      isolate: false,
      selected: s.steps[0],
      highlights: s.steps,
      ghost: true,
      explode: 0,
      focus: state.focus + 1,
      camera: "focus",
    });
  }
  function goStep(n: number) {
    if (!selectedScenario) return;
    setStep(n);
    update({
      selected: selectedScenario.steps[n],
      highlights: selectedScenario.steps,
      focus: state.focus + 1,
      camera: "focus",
    });
  }
  const filtered = parts.filter((p) =>
    `${p.id} ${bilingualText(p.name)} ${bilingualText(p.description)}`
      .toLowerCase()
      .includes(query.toLowerCase()),
  );
  const currentStatus = statuses[state.selected];
  return (
    <div
      className={`atlas-app ${collapsed.left ? "left-collapsed" : ""} ${collapsed.top ? "top-collapsed" : ""} ${collapsed.bottom ? "bottom-collapsed" : ""}`}
    >
      <div
        className="display-controls"
        role="group"
        aria-label={text("Display controls", "显示控制")}
      >
        <label className="language-switch">
          <input
            type="checkbox"
            role="switch"
            checked={bilingual}
            onChange={(e) => setBilingual(e.target.checked)}
          />
          {text("Bilingual text", "双语文字")}
        </label>
        <div
          className="panel-toggles"
          role="group"
          aria-label={text("Panel visibility", "面板可见性")}
        >
          {(
            [
              ["left", "Left", "左侧"],
              ["right", "Right", "右侧"],
              ["top", "Top", "顶部"],
              ["bottom", "Bottom", "底部"],
            ] as const
          ).map(([side, en, zh]) => {
            const open = side === "right" ? inspector : !collapsed[side];
            const label = text(
              `${open ? "Collapse" : "Expand"} ${side} panel`,
              `${open ? "收起" : "展开"}${zh}面板`,
            );
            return (
              <button
                key={side}
                aria-label={label}
                title={label}
                aria-expanded={open}
                aria-controls={`${side}-panel`}
                onClick={() =>
                  side === "right"
                    ? setInspector(!inspector)
                    : setCollapsed((current) => ({
                        ...current,
                        [side]: !current[side],
                      }))
                }
              >
                {open ? <EyeOff size={14} /> : <Eye size={14} />}
                <Label value={b(en, zh)} />
              </button>
            );
          })}
        </div>
      </div>
      <div id="top-panel" className="top-panels">
        <header className="topbar">
          <button
            className="brand"
            onClick={() => mode("assembled")}
            aria-label={text("Home", "首页")}
          >
            <span className="brand-icon">
              <Anchor size={23} />
            </span>
            <span>
              <strong>
                SOLO PACIFIC
                {bilingual && (
                  <span className="brand-cn" lang="zh-CN">
                    独航太平洋
                  </span>
                )}
              </strong>
              <small>{text("SAILBOAT ATLAS", "帆船知识图谱")}</small>
            </span>
          </button>
          <div className="searchbox">
            <Search size={17} />
            <input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSidebar(true);
                setCollapsed((current) => ({ ...current, left: false }));
              }}
              placeholder={text("Find a component or system", "搜索部件或系统")}
              aria-label={text("Search components", "搜索部件")}
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                aria-label={text("Clear search", "清空搜索")}
              >
                <X size={14} />
              </button>
            )}
          </div>
          <button
            className="source-button"
            onClick={() => setShowSources(true)}
          >
            <BookOpen size={16} />
            {text("Sources & accuracy", "来源与精度")}
            <ArrowUpRight size={14} />
          </button>
        </header>
        <nav className="modebar" aria-label={text("View modes", "视图模式")}>
          {modes.map(([id, en, zh]) => (
            <button
              key={id}
              className={state.mode === id ? "active" : ""}
              onClick={() => mode(id)}
            >
              {id === "solo" ? (
                <Compass size={15} />
              ) : id === "sailing" ? (
                <Wind size={15} />
              ) : null}
              <Label value={b(en, zh)} />
            </button>
          ))}
        </nav>
      </div>
      <div className="workspace">
        <aside
          id="left-panel"
          className={`sidebar ${sidebar ? "mobile-open" : ""}`}
        >
          <div className="panel-heading">
            <span className="eyebrow">01 / {text("EXPLORE", "探索")}</span>
            <button
              className="mobile-close"
              onClick={() => setSidebar(false)}
              aria-label={text("Close hierarchy", "关闭层级列表")}
            >
              <X size={16} />
            </button>
          </div>
          <div className="tree-title">
            <h2>{text("Anatomy of a sailboat", "帆船解剖")}</h2>
            <span>{parts.filter((p) => !p.abstract).length}</span>
          </div>
          <p className="muted small">
            {text(
              "Every part has a purpose. Follow its connections.",
              "每个部件都有用途。沿连接理解整船。",
            )}
          </p>
          <button
            className={`tree-all ${!state.system ? "selected" : ""}`}
            onClick={() => update({ system: "", hidden: [], isolate: false })}
          >
            <Layers3 size={16} />
            {text("Complete boat", "完整帆船")}
            <span>{systems.length}</span>
          </button>
          <div
            className="tree"
            role="tree"
            aria-label={text("System hierarchy", "系统层级")}
          >
            {systems.map((s) => {
              const ps = filtered.filter((p) => p.system === s.id);
              if (!ps.length) return null;
              const open = expanded.includes(s.id) || !!query;
              return (
                <div className="tree-system" key={s.id}>
                  <div className="system-row">
                    <button
                      onClick={() =>
                        setExpanded((p) =>
                          open ? p.filter((x) => x !== s.id) : [...p, s.id],
                        )
                      }
                      aria-expanded={open}
                      aria-label={`${text("Expand", "展开")} ${t(s.name)}`}
                    >
                      <ChevronRight
                        size={13}
                        className={open ? "turned" : ""}
                      />
                    </button>
                    <button
                      className={`system-name ${state.system === s.id ? "selected" : ""}`}
                      onClick={() =>
                        update({
                          system: state.system === s.id ? "" : s.id,
                          focus: state.focus + 1,
                        })
                      }
                    >
                      <i style={{ background: s.color }} />
                      <Label value={s.name} />
                    </button>
                    <button
                      aria-label={`${text("Toggle visibility", "切换可见性")} ${t(s.name)}`}
                      onClick={() => {
                        const ids = parts
                            .filter((p) => p.system === s.id)
                            .map((p) => p.id),
                          all = ids.every((id) => state.hidden.includes(id));
                        update({
                          hidden: all
                            ? state.hidden.filter((id) => !ids.includes(id))
                            : [...new Set([...state.hidden, ...ids])],
                        });
                      }}
                    >
                      <Eye size={13} />
                    </button>
                  </div>
                  {open && (
                    <div className="system-parts">
                      {ps.map((p) => (
                        <div
                          className={`part-row ${state.selected === p.id ? "active" : ""}`}
                          key={p.id}
                        >
                          <button
                            data-part={p.id}
                            onClick={() => {
                              select(p.id);
                              setSidebar(false);
                            }}
                          >
                            <span className="part-dot" />
                            <Label value={p.name} />
                          </button>
                          <button
                            aria-label={`${text("Hide or show", "隐藏或显示")} ${t(p.name)}`}
                            onClick={() =>
                              update({
                                hidden: state.hidden.includes(p.id)
                                  ? state.hidden.filter((id) => id !== p.id)
                                  : [...state.hidden, p.id],
                              })
                            }
                          >
                            {state.hidden.includes(p.id) ? (
                              <EyeOff size={12} />
                            ) : (
                              <Eye size={12} />
                            )}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <div className="sidebar-footer">
            <span className="live-dot" />
            {text("Reference + representative refit", "参考船型＋示意改装")}
            <p>Cal 40 · C. William Lapworth</p>
          </div>
        </aside>
        <main className="viewport">
          <div className="viewport-heading">
            <div>
              <span className="eyebrow">CAL 40 / 1963</span>
              <h1>
                {state.mode === "solo"
                  ? text("San Francisco → Hawaii", "旧金山 → 夏威夷")
                  : state.mode === "sailing"
                    ? text("The physics of sailing", "帆船如何航行")
                    : text(
                        "A boat. A connected system.",
                        "一条船，一个相联系的系统。",
                      )}
              </h1>
              <p>
                {text(
                  "Explore the structure. Understand the connections.",
                  "探索结构，理解连接。",
                )}
              </p>
            </div>
            <span className="reference-tag">
              {text("Learning model", "教学模型")}
            </span>
          </div>
          <div className="scene-surface">
            <Boundary>
              <Scene
                state={{
                  ...state,
                  failedIds: failure
                    ? Object.keys(statuses).filter(
                        (id) => statuses[id].state === "failed",
                      )
                    : [],
                }}
                onSelect={select}
              />
            </Boundary>
          </div>
          <div className="canvas-actions">
            <button
              onClick={() =>
                update({ camera: "default", focus: state.focus + 1 })
              }
              title={text("Reset camera", "重置视角")}
              aria-label={text("Reset camera", "重置视角")}
            >
              <RotateCcw size={17} />
            </button>
            <button
              onClick={() =>
                update({ camera: "focus", focus: state.focus + 1 })
              }
              title={text("Focus selected", "聚焦选中部件")}
              aria-label={text("Focus selected", "聚焦选中部件")}
            >
              <Focus size={17} />
            </button>
            <button
              className={graph ? "active" : ""}
              onClick={() => setGraph(!graph)}
              title={text("Knowledge graph", "知识图谱")}
              aria-label={text("Knowledge graph", "知识图谱")}
            >
              <Network size={17} />
            </button>
            <button
              onClick={() => update({ labels: !state.labels })}
              title={text("Selected label", "选中标签")}
              aria-label={text("Selected label", "选中标签")}
            >
              <Info size={17} />
            </button>
            <button
              onClick={() => setInspector(!inspector)}
              title={text("Component inspector", "部件详情")}
              aria-label={text("Component inspector", "部件详情")}
            >
              <Layers3 size={17} />
            </button>
          </div>
          <div className="view-presets">
            <select
              aria-label={text("Camera angle", "观察角度")}
              value={state.camera === "focus" ? "default" : state.camera}
              onChange={(e) =>
                update({ camera: e.target.value, focus: state.focus + 1 })
              }
            >
              {[
                ["default", "Perspective", "透视"],
                ["bow", "Bow", "船首"],
                ["stern", "Stern", "船尾"],
                ["port", "Port", "左舷"],
                ["starboard", "Starboard", "右舷"],
                ["top", "Above", "俯视"],
                ["underwater", "Below waterline", "水线下"],
              ].map(([id, en, zh]) => (
                <option value={id} key={id}>
                  {text(en, zh)}
                </option>
              ))}
            </select>
          </div>
          <div className="model-caption">
            <span className="crosshair">+</span>
            <strong>
              11.99 <small>m</small>
            </strong>
            <span>{text("Length overall", "船体总长")}</span>
            <div className="caption-rule" />
            <span>
              {text("Reconstructed geometry", "重建几何")}
              <br />
              {text("See claim-level sources", "查看逐项来源")}
            </span>
          </div>
          <div className="interaction-hint">
            <Move3D size={13} />
            {text(
              "Drag to orbit · Pinch or scroll to zoom",
              "拖动旋转 · 双指或滚轮缩放",
            )}
          </div>
          <button className="mobile-tree" onClick={() => setSidebar(true)}>
            <Menu size={16} />
            {text("Systems", "系统")}
          </button>
          {graph && (
            <section className="graph-overlay">
              <header>
                <div>
                  <span className="eyebrow">
                    {text("KNOWLEDGE GRAPH", "知识图谱")}
                  </span>
                  <h3>
                    <Label value={selected.name} />
                  </h3>
                </div>
                <div>
                  <button onClick={() => setDepth(depth === 1 ? 2 : 1)}>
                    {depth === 1
                      ? text("Expand context", "扩展关系")
                      : text("Local context", "局部关系")}
                  </button>
                  <button
                    onClick={() => setGraph(false)}
                    aria-label={text("Close graph", "关闭图谱")}
                  >
                    <X size={17} />
                  </button>
                </div>
              </header>
              <KnowledgeGraph
                selected={state.selected}
                onSelect={select}
                depth={depth}
                statuses={statuses}
                onEdge={setEdgeIndex}
              />
              {edgeIndex !== null && (
                <p className="edge-note">
                  <Label value={edges[edgeIndex].note} />{" "}
                  <span> · {text("Evidence", "证据")}: </span>
                  <a
                    href={
                      sources.find((s) => s.id === edges[edgeIndex].source)
                        ?.url || undefined
                    }
                    target="_blank"
                    rel="noreferrer"
                  >
                    {t(
                      sources.find((s) => s.id === edges[edgeIndex].source)!
                        .name,
                    )}
                  </a>
                </p>
              )}
              <p className="small muted">
                {text(
                  "Click a node to select in 3D; click an arrow to inspect its meaning.",
                  "点击节点选中三维部件；点击箭头查看关系含义。",
                )}
              </p>
            </section>
          )}
        </main>
        {inspector && (
          <aside id="right-panel" className="inspector">
            <div className="inspector-tabs">
              <button
                className={tab === "component" ? "active" : ""}
                onClick={() => setTab("component")}
              >
                {text("Understand", "理解")}
              </button>
              <button
                className={tab === "scenarios" ? "active" : ""}
                onClick={() => setTab("scenarios")}
              >
                {text("Scenarios", "情景")}
              </button>
            </div>
            {["cutaway", "below"].includes(state.mode) && (
              <section className="control-card">
                <h3>{text("Section controls", "剖面控制")}</h3>
                <label>
                  {text("Hull", "船壳")}
                  <select
                    value={state.hullMode}
                    onChange={(e) => update({ hullMode: e.target.value })}
                    aria-label={text("Hull display", "船壳显示")}
                  >
                    {[
                      ["solid", "Solid", "实体"],
                      ["transparent", "Transparent", "透明"],
                      ["hidden", "Hidden", "隐藏"],
                    ].map(([id, en, zh]) => (
                      <option value={id} key={id}>
                        {text(en, zh)}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="check">
                  <input
                    type="checkbox"
                    checked={state.deckOff}
                    onChange={(e) => update({ deckOff: e.target.checked })}
                  />
                  {text("Remove deck & roof", "移除甲板与舱顶")}
                </label>
                <select
                  value={state.section}
                  aria-label={text("Cutting plane", "切割平面")}
                  onChange={(e) => update({ section: e.target.value })}
                >
                  {[
                    ["none", "No section", "无剖切"],
                    ["longitudinal", "Longitudinal", "纵剖"],
                    ["transverse", "Transverse", "横剖"],
                  ].map(([id, en, zh]) => (
                    <option value={id} key={id}>
                      {text(en, zh)}
                    </option>
                  ))}
                </select>
                {state.section !== "none" && (
                  <Range
                    label={b("Section position", "剖面位置")}
                    value={state.sectionOffset}
                    min={-6}
                    max={6}
                    step={0.1}
                    onChange={(v) => update({ sectionOffset: v })}
                    suffix=" m"
                  />
                )}
                <label className="check">
                  <input
                    type="checkbox"
                    checked={state.tanksOpen}
                    onChange={(e) => update({ tanksOpen: e.target.checked })}
                  />
                  {text("Open tank lids", "打开水箱盖")}
                </label>
              </section>
            )}
            {state.mode === "sailing" && (
              <section className="control-card sailing-controls">
                <h3>{text("Sailing laboratory", "航行实验室")}</h3>
                <p className="small muted">
                  {text(
                    "Educational coefficients; not measured Cal 40 performance.",
                    "采用教学系数，非 Cal 40 实测性能。",
                  )}
                </p>
                <Range
                  label={b("True wind", "真风")}
                  value={state.wind}
                  max={40}
                  onChange={(v) => update({ wind: v })}
                  suffix=" kn"
                />
                <Range
                  label={b("Wind angle to bow", "风相对船首角度")}
                  value={state.angle}
                  min={-180}
                  max={180}
                  onChange={(v) => update({ angle: v })}
                  suffix="°"
                />
                <select
                  aria-label={text("Point of sail", "航行风向角")}
                  value=""
                  onChange={(e) => update({ angle: +e.target.value })}
                >
                  <option value="" disabled>
                    {text("Choose a point of sail", "选择航行风向角")}
                  </option>
                  {[
                    [0, "Head to wind", "迎风"],
                    [45, "Close hauled", "近迎风"],
                    [90, "Beam reach", "横风"],
                    [135, "Broad reach", "侧顺风"],
                    [180, "Run", "正顺风"],
                  ].map(([v, en, zh]) => (
                    <option value={v} key={v}>
                      {text(en as string, zh as string)}
                    </option>
                  ))}
                </select>
                <Range
                  label={b("Mainsail trim", "主帆调整")}
                  value={state.main}
                  max={85}
                  onChange={(v) => update({ main: v })}
                  suffix="°"
                />
                <Range
                  label={b("Headsail trim", "前帆调整")}
                  value={state.jib}
                  max={85}
                  onChange={(v) => update({ jib: v })}
                  suffix="°"
                />
                <Range
                  label={b("Reefing state", "缩帆级别")}
                  value={state.reef}
                  max={2}
                  onChange={(v) => update({ reef: v })}
                />
                <Range
                  label={b("Rudder angle", "舵角")}
                  value={state.rudder}
                  min={-30}
                  max={30}
                  onChange={(v) => update({ rudder: v })}
                  suffix="°"
                />
                <div className="readouts">
                  <div>
                    <strong>{sim.speed.toFixed(1)} kn</strong>
                    {text("Boat speed", "船速")}
                  </div>
                  <div>
                    <strong>{sim.heel.toFixed(1)}°</strong>
                    {text("Heel", "横倾")}
                  </div>
                  <div>
                    <strong>{sim.apparent.toFixed(1)} kn</strong>
                    {text("Apparent wind", "视风")}
                  </div>
                  <div>
                    <strong>{sim.drive.toFixed(0)} N</strong>
                    {text("Driving force", "推进力")}
                  </div>
                </div>
                {sim.noGo && (
                  <p className="warning">
                    {text(
                      "No-go zone: sails cannot drive directly into the wind.",
                      "禁航角：帆不能驱动船直接逆风前进。",
                    )}
                  </p>
                )}
                <p className="small muted">
                  {text(
                    "Arrow lengths are normalized; direction is meaningful, lengths are not to scale.",
                    "箭头长度已归一化；方向有物理意义，长度不按比例。",
                  )}
                </p>
              </section>
            )}

            {tab === "component" ? (
              <>
                <div className="component-heading">
                  <span className="eyebrow" style={{ color: sys.color }}>
                    02 / <Label value={sys.name} />
                  </span>
                  <h2>
                    <Label value={selected.name} />
                  </h2>
                  <span className={`evidence ${selected.evidence}`}>
                    {selected.evidence === "approximated"
                      ? text("Approximated geometry", "近似重建几何")
                      : text(
                          "Illustrative / representative",
                          "示意／代表性配置",
                        )}
                  </span>
                  <p className="description">
                    <Label value={selected.description} />
                  </p>
                </div>
                <div className="selection-tools">
                  <button
                    className={state.isolate ? "active" : ""}
                    onClick={() =>
                      update({ isolate: !state.isolate, highlights: [] })
                    }
                  >
                    <Maximize2 size={14} />
                    {text("Isolate", "单独显示")}
                  </button>
                  <button
                    onClick={() =>
                      update({ hidden: [...state.hidden, state.selected] })
                    }
                  >
                    <EyeOff size={14} />
                    {text("Hide", "隐藏")}
                  </button>
                  <button
                    className={state.ghost ? "active" : ""}
                    onClick={() => update({ ghost: !state.ghost })}
                  >
                    <Layers3 size={14} />
                    {text("X-ray", "透视")}
                  </button>
                </div>
                <section className="connections">
                  <div className="section-title">
                    <h3>{text("How it connects", "如何连接")}</h3>
                    <button
                      onClick={() => setGraph(true)}
                      aria-label={text("Open graph", "打开图谱")}
                    >
                      <Network size={17} />
                    </button>
                  </div>
                  {related.length ? (
                    related.map((e, i) => {
                      const outgoing = e.from === state.selected,
                        id = outgoing ? e.to : e.from;
                      return (
                        <button
                          key={i}
                          className="connection"
                          onClick={() => select(id)}
                        >
                          <span className="relation">
                            <span>{outgoing ? "↗" : "↙"}</span>
                            <Label value={relationLabels[e.type]} />
                          </span>
                          <strong>
                            <Label value={byId[id].name} />
                          </strong>
                          <ChevronRight size={14} />
                        </button>
                      );
                    })
                  ) : (
                    <p className="small muted">
                      {text(
                        "Explore this component through its system hierarchy.",
                        "通过系统层级探索此部件。",
                      )}
                    </p>
                  )}
                  <button
                    className="subtle-link"
                    onClick={() => setShowSources(true)}
                  >
                    <BookOpen size={13} />
                    {text("Inspect relationship evidence", "查看关系证据")}
                  </button>
                </section>
                <section className="failure-card">
                  <div className="section-title">
                    <h3>{text("What if it fails?", "如果它失效？")}</h3>
                    <AlertTriangle size={15} />
                  </div>
                  <select
                    aria-label={text("Inject failure", "注入故障")}
                    value={failure}
                    onChange={(e) => {
                      setFailure(e.target.value);
                      if (e.target.value) {
                        select(
                          e.target.value === "low-charge"
                            ? "battery"
                            : e.target.value,
                        );
                        update({ ghost: true });
                      }
                    }}
                  >
                    <option value="">
                      {text("All systems nominal", "所有系统正常")}
                    </option>
                    {[
                      "battery",
                      "fuse",
                      "autopilot",
                      "drive",
                      "imu",
                      "ais",
                      "vhf",
                      "gps",
                      "rudder-stock",
                    ].map((id) => (
                      <option value={id} key={id}>
                        {t(byId[id].name)}
                      </option>
                    ))}
                    <option value="low-charge">
                      {text("Low charge / unknown reserve", "低电量／余量未知")}
                    </option>
                  </select>
                  <button
                    className="subtle-link"
                    onClick={() => setFailure(state.selected)}
                  >
                    {text("Fail selected component", "使选中部件失效")}
                  </button>
                  <label className="check">
                    <input
                      type="checkbox"
                      checked={backup}
                      onChange={(e) => setBackup(e.target.checked)}
                    />
                    {text("Independent handheld backups", "独立手持备用设备")}
                  </label>
                  {failure && (
                    <>
                      <div className="status-grid">
                        {[
                          "autopilot",
                          "ais",
                          "communication",
                          "navigation",
                        ].map((id) => (
                          <button
                            key={id}
                            className={`status-item ${statuses[id].state}`}
                            onClick={() => select(id)}
                          >
                            <span>
                              <Label value={byId[id].name} />
                            </span>
                            <strong>
                              {statuses[id].state === "failed"
                                ? "✕ "
                                : statuses[id].state === "conditional"
                                  ? "? "
                                  : "● "}
                              <Label value={statusNames[statuses[id].state]} />
                            </strong>
                          </button>
                        ))}
                      </div>
                      <p className="small">
                        <Label value={currentStatus.reason} />
                      </p>
                      {currentStatus.path.length > 0 && (
                        <p className="causal-path">
                          {currentStatus.path
                            .map((id) => (byId[id] ? t(byId[id].name) : id))
                            .join(" → ")}
                        </p>
                      )}
                      <button
                        className="subtle-link"
                        onClick={() => setFailure("")}
                      >
                        <RotateCcw size={13} />
                        {text("Restore systems", "恢复系统")}
                      </button>
                    </>
                  )}
                </section>
              </>
            ) : (
              <section className="scenarios">
                <span className="eyebrow">
                  03 / {text("SOLO PACIFIC", "独航太平洋")}
                </span>
                <h2>{text("Think through the passage", "推演远洋航程")}</h2>
                <p className="small muted">
                  {text(
                    "Conceptual learning sequences; verify procedures against the installed equipment.",
                    "概念学习顺序；实际步骤需依据所安装设备核实。",
                  )}
                </p>
                {selectedScenario ? (
                  <>
                    <button
                      className="subtle-link"
                      onClick={() => {
                        setScenario("");
                        update({ ghost: false, highlights: [] });
                        setFailure("");
                      }}
                    >
                      <ChevronLeft size={14} />
                      {text("All scenarios", "全部情景")}
                    </button>
                    <h3>
                      <Label value={selectedScenario.name} />
                    </h3>
                    <div className="step-count">
                      {step + 1} / {selectedScenario.steps.length}
                    </div>
                    {selectedScenario.steps.map((id, i) => (
                      <button
                        key={id}
                        className={`scenario-step ${step === i ? "active" : ""}`}
                        onClick={() => goStep(i)}
                      >
                        <span>
                          {i < step ? (
                            <Check size={14} />
                          ) : (
                            String(i + 1).padStart(2, "0")
                          )}
                        </span>
                        <Label value={byId[id].name} />
                      </button>
                    ))}
                    <div className="step-detail">
                      <strong>
                        <Label
                          value={byId[selectedScenario.steps[step]].name}
                        />
                      </strong>
                      <p>
                        <Label
                          value={
                            stepNotes[selectedScenario.steps[step]] ||
                            byId[selectedScenario.steps[step]].description
                          }
                        />
                      </p>
                      <button
                        className="primary"
                        onClick={() =>
                          step < selectedScenario.steps.length - 1
                            ? goStep(step + 1)
                            : (setScenario(""),
                              setFailure(""),
                              update({ ghost: false, highlights: [] }))
                        }
                      >
                        {step < selectedScenario.steps.length - 1
                          ? text("Next connection", "下一个连接")
                          : text("Finish walkthrough", "结束演示")}
                        <ChevronRight size={15} />
                      </button>
                    </div>
                  </>
                ) : (
                  scenarios.map((s, i) => (
                    <button
                      className="scenario-card"
                      key={s.id}
                      onClick={() => startScenario(s.id)}
                    >
                      <span>{String(i + 1).padStart(2, "0")}</span>
                      <Label value={s.name} />
                      <ChevronRight size={15} />
                    </button>
                  ))
                )}
              </section>
            )}
            <section className="inspector-bottom">
              <label>
                {text("Headsail configuration", "前帆配置")}
                <select
                  aria-label={text("Headsail configuration", "前帆配置")}
                  value={state.headsail}
                  onChange={(e) => update({ headsail: e.target.value })}
                >
                  {["jib", "genoa", "spinnaker", "storm-jib"].map((id) => (
                    <option value={id} key={id}>
                      {t(byId[id].name)}
                    </option>
                  ))}
                </select>
              </label>
              <button
                className="subtle-link"
                onClick={() => setShowSources(true)}
              >
                <BookOpen size={13} />
                {text("Sources for this component", "本部件来源")}
              </button>
            </section>
          </aside>
        )}
      </div>
      <footer id="bottom-panel" className="explode-bar">
        <div className="explode-title">
          <Layers3 size={18} />
          <span>
            <strong>{text("Explode boat", "拆解整船")}</strong>
            <small>
              {text("Reveal how it fits together", "查看部件如何装配")}
            </small>
          </span>
        </div>
        <div className="explode-slider">
          <span>{text("Assembled", "装配")}</span>
          <input
            type="range"
            min={0}
            max={100}
            value={Math.round(state.explode * 100)}
            aria-label={text("Explode boat", "拆解整船")}
            onChange={(e) => update({ explode: +e.target.value / 100 })}
          />
          <strong>{Math.round(state.explode * 100)}%</strong>
          <span>{text("Exploded", "拆解")}</span>
        </div>
        <select
          aria-label={text("Explode by system", "按系统拆解")}
          value={state.explodeSystem}
          onChange={(e) => update({ explodeSystem: e.target.value })}
        >
          <option value="">{text("All systems", "所有系统")}</option>
          {systems.map((s) => (
            <option value={s.id} key={s.id}>
              {t(s.name)}
            </option>
          ))}
        </select>
        <button
          onClick={() => {
            setState({ ...initial, focus: state.focus + 1 });
            setFailure("");
            setScenario("");
            setGraph(false);
          }}
        >
          <RotateCcw size={15} />
          {text("Reset all", "全部重置")}
        </button>
      </footer>
      {showSources && (
        <div className="modal-backdrop" onClick={() => setShowSources(false)}>
          <section
            className="source-modal"
            role="dialog"
            aria-modal="true"
            aria-label={text("Sources and accuracy", "来源与精度")}
            onClick={(e) => e.stopPropagation()}
          >
            <header>
              <div>
                <span className="eyebrow">
                  {text("EVIDENCE, NOT ASSUMPTION", "证据与假设分明")}
                </span>
                <h2>{text("Sources & model accuracy", "来源与模型精度")}</h2>
              </div>
              <button
                onClick={() => setShowSources(false)}
                aria-label={text("Close sources", "关闭来源")}
              >
                <X />
              </button>
            </header>
            <div className="accuracy-summary">
              <article>
                <strong>{text("Source-verified facts", "来源核实事实")}</strong>
                <p>
                  {text(
                    "Published principal dimensions and documented component functions, each tied to its source.",
                    "已公布的主要尺寸与文献支持的部件功能，逐项关联来源。",
                  )}
                </p>
              </article>
              <article>
                <strong>
                  {text("Approximated components", "近似重建部件")}
                </strong>
                <p>
                  {text(
                    "Hull, keel, rudder, cabin and sails reconstructed from inspected drawings. Exact offsets are not certified.",
                    "船体、龙骨、舵、舱室和帆由查阅图纸重建；不保证精确型值。",
                  )}
                </p>
              </article>
              <article>
                <strong>{text("Illustrative components", "示意部件")}</strong>
                <p>
                  {text(
                    "Modern refit equipment, hidden structure, circuits, routing and simulation coefficients.",
                    "现代改装设备、隐藏结构、电路、路径及模拟系数。",
                  )}
                </p>
              </article>
            </div>
            <p className="small">
              {text(
                "Mechanical correctness takes priority over appearance. Geometry is a teaching reconstruction, not a survey or an installation specification.",
                "机械正确性优先于外观；几何为教学重建，不是检验报告或安装规范。",
              )}
            </p>
            <p>
              <a
                href={`${import.meta.env.BASE_URL}audit.md`}
                target="_blank"
                rel="noreferrer"
              >
                {text("Read the engineering audit", "阅读工程审计报告")}
              </a>{" "}
              ·{" "}
              <a
                href={`${import.meta.env.BASE_URL}audit.json`}
                target="_blank"
                rel="noreferrer"
              >
                {text("Component audit ledger", "逐部件审计台账")}
              </a>
            </p>
            <h3>{text("Selected component references", "选中部件参考")}</h3>
            <p>
              {selected.sources
                .map((id) => t(sources.find((s) => s.id === id)!.name))
                .join(" · ")}
            </p>
            {sources.map((s) => (
              <article className="source-entry" key={s.id}>
                <h3>
                  {s.url ? (
                    <a href={s.url} target="_blank" rel="noreferrer">
                      <Label value={s.name} />
                      <ArrowUpRight size={15} />
                    </a>
                  ) : (
                    <Label value={s.name} />
                  )}
                </h3>
                <small>
                  <Label value={s.locator} />
                </small>
                <p>
                  <Label value={s.note} />
                </p>
              </article>
            ))}
            <p className="small muted">
              {text(
                "References inspected 17 September 2026. Use the bilingual text switch to show or hide Simplified Chinese alongside English.",
                "参考资料查阅日期：2026 年 9 月 17 日。使用双语文字开关，可显示或隐藏英文旁的简体中文。",
              )}
            </p>
          </section>
        </div>
      )}
    </div>
  );
}
