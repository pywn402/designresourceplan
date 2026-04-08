import { useState, useMemo } from 'react'
import './App.css'

// ─── Password ────────────────────────────────────────────────────────────────

const ACCESS_PASSWORD = 'design2025'

function LoginGate({ onUnlock }) {
  const [input, setInput] = useState('')
  const [error, setError] = useState(false)

  function handleSubmit(e) {
    e.preventDefault()
    if (input === ACCESS_PASSWORD) {
      onUnlock()
    } else {
      setError(true)
      setInput('')
    }
  }

  return (
    <div className="login-wrap">
      <div className="login-card">
        <h1 className="login-title">設計資源估算工具</h1>
        <p className="login-sub">Design Resource Estimator</p>
        <form onSubmit={handleSubmit} className="login-form">
          <input
            type="password"
            className={`login-input ${error ? 'login-input-error' : ''}`}
            placeholder="請輸入通行密碼"
            value={input}
            autoFocus
            onChange={e => { setInput(e.target.value); setError(false) }}
          />
          {error && <p className="login-error">密碼錯誤，請再試一次</p>}
          <button type="submit" className="login-btn">進入</button>
        </form>
      </div>
    </div>
  )
}

// ─── Constants ───────────────────────────────────────────────────────────────

const FEATURE_TYPES = [
  { id: 'overview',    label: '總覽類', sublabel: 'Overview / Dashboard', hours: 40 },
  { id: 'transaction', label: '交易類', sublabel: 'Transaction',          hours: 28 },
  { id: 'query',       label: '查詢類', sublabel: 'Query',                hours: 16 },
  { id: 'setting',     label: '設定類', sublabel: 'Setting',              hours: 14 },
]

// 每批次的固定成本項目（小時為每批次）
const BATCH_COSTS = [
  { id: 'sa',   label: 'SA 會議',     note: '至少 2 場，含會前準備與會後整理，一場至少 4hr', minH: 8, maxH: 10, defaultH: 10 },
  { id: 'client', label: '客戶會議', note: '至少 2 場，含會議紀錄整理，一場至少 3hr',       minH: 6, maxH: 8,  defaultH: 8  },
  { id: 'disc', label: '內部設計討論', note: '含查詢與交易類功能討論',                       minH: 6, maxH: 8,  defaultH: 8  },
]

const ADDONS = [
  { id: 'uikit',  label: 'UI Kit 基礎制定｜共用元件盤點', sublabel: 'UI Kit & Component Inventory', minH: 48, maxH: 48, defaultH: 48, required: true },
  { id: 'visual', label: '視覺風格設計', sublabel: 'Visual Style Design', minH: 40, maxH: 56, defaultH: 48 },
  { id: 'spec',   label: '設計規範產出', sublabel: 'Design Specification', minH: 40, maxH: 40, defaultH: 40 },
  { id: 'source', label: '提供原始檔',  sublabel: 'Source File Delivery',  dynamic: true },
]

const DIRECTOR_PRESETS = {
  high:   { label: '高涉入', desc: '工期 × 75%，完整月 80h／不足月 40h', factor: 0.75, fullH: 80, partialH: 40 },
  medium: { label: '中涉入', desc: '工期 × 50%，完整月 60h／不足月 40h', factor: 0.50, fullH: 60, partialH: 40 },
  low:    { label: '低涉入', desc: '工期 × 50%，完整月 40h／不足月 20h', factor: 0.50, fullH: 40, partialH: 20 },
}

function computeDirPattern(months, level) {
  if (!months) return []
  const { factor, fullH, partialH } = DIRECTOR_PRESETS[level]
  const total    = months * factor
  const fullMths = Math.floor(total)
  const hasPartial = total % 1 > 0
  return Array.from({ length: months }, (_, i) =>
    i < fullMths ? fullH : (i === fullMths && hasPartial) ? partialH : 0
  )
}

const DESIGNER_LEVELS = [
  { id: 'senior', label: 'B7 資深設計師', sublabel: 'Senior Designer', rate: 1743.67 },
  { id: 'junior', label: 'B6 設計師',     sublabel: 'Designer',        rate: 1333.06 },
  { id: 'sub',    label: 'Sub 設計師',    sublabel: 'Part-time',        rate: 972 },
]

const SUB_RATE = 972

const DIRECTOR_RATE = 2503.26

const HOURS_PER_MONTH = 160

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmt(h) { return `${Math.round(h).toLocaleString()} h` }
function money(n) { return `NT$ ${Math.round(n).toLocaleString()}` }

// ─── Sub-components ──────────────────────────────────────────────────────────

function Card({ title, subtitle, children }) {
  return (
    <div className="card">
      <div className="card-header">
        <h2>{title}</h2>
        {subtitle && <p className="subtitle">{subtitle}</p>}
      </div>
      {children}
    </div>
  )
}

function Toggle({ checked, onChange }) {
  return (
    <button
      className={`toggle ${checked ? 'toggle-on' : ''}`}
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
    >
      <span className="toggle-knob" />
    </button>
  )
}

function Stepper({ value, onChange }) {
  return (
    <div className="stepper">
      <button className="step-btn" onClick={() => onChange(Math.max(0, value - 1))}>−</button>
      <span className="step-val">{value}</span>
      <button className="step-btn" onClick={() => onChange(Math.min(99, value + 1))}>+</button>
    </div>
  )
}

function Tag({ hours, active }) {
  return <span className={`tag ${active ? 'tag-active' : ''}`}>{fmt(hours)}</span>
}

// ─── Main App ────────────────────────────────────────────────────────────────

export default function App() {
  const [unlocked, setUnlocked] = useState(false)
  if (!unlocked) return <LoginGate onUnlock={() => setUnlocked(true)} />
  return <Estimator />
}

function Estimator() {
  const [features, setFeatures] = useState({ overview: 0, transaction: 0, query: 0, setting: 0 })
  const [addons, setAddons] = useState({ uikit: true, visual: false, spec: false, source: false })
  const [addonHours, setAddonHours] = useState(
    Object.fromEntries(ADDONS.map(a => [a.id, a.defaultH]))
  )
  const [batches, setBatches] = useState(1)
  const [batchHours, setBatchHours] = useState(
    Object.fromEntries(BATCH_COSTS.map(b => [b.id, b.defaultH]))
  )

  const [directorLevel, setDirectorLevel] = useState('medium')
  const [showDirector, setShowDirector] = useState(true)
  // 人力配置
  const [b7Count,  setB7Count]  = useState(1)
  const [b6Count,  setB6Count]  = useState(1)
  const [subCount, setSubCount] = useState(0)
  const [subWeeklyH, setSubWeeklyH] = useState(20)
  const workDays = 22
  // 月度工時分配（按人頭）
  const [allocData, setAllocData] = useState({})

  // Calculations
  const txCount   = useMemo(() => FEATURE_TYPES.reduce((s, f) => s + features[f.id], 0), [features])
  const txHours   = useMemo(() => FEATURE_TYPES.reduce((s, f) => s + features[f.id] * f.hours, 0), [features])
  const perBatchH = useMemo(() => BATCH_COSTS.reduce((s, b) => s + batchHours[b.id], 0), [batchHours])
  const fixHours  = perBatchH * batches
  const sourceH   = Math.round(txHours * 1.5)
  const addHours  = useMemo(() => ADDONS.reduce((s, a) => {
    if (!addons[a.id]) return s
    return s + (a.dynamic ? sourceH : addonHours[a.id])
  }, 0), [addons, addonHours, sourceH])
  const totalH    = txHours + fixHours + addHours
  const bufferedH = Math.round(totalH * 1.1)

  // 人頭清單（由 ⑥ 人數衍生）
  const designerList = useMemo(() => [
    ...Array.from({ length: b7Count }, (_, i) => ({
      key: `b7-${i}`,
      rate: DESIGNER_LEVELS[0].rate,
      label: b7Count > 1 ? `B7 資深設計師 ${i + 1}` : 'B7 資深設計師',
    })),
    ...Array.from({ length: b6Count }, (_, i) => ({
      key: `b6-${i}`,
      rate: DESIGNER_LEVELS[1].rate,
      label: b6Count > 1 ? `B6 設計師 ${i + 1}` : 'B6 設計師',
    })),
    ...Array.from({ length: subCount }, (_, i) => ({
      key: `sub-${i}`,
      rate: SUB_RATE,
      label: subCount > 1 ? `Sub 設計師 ${i + 1}` : 'Sub 設計師',
    })),
  ], [b7Count, b6Count, subCount])

  // 人力試算（先算 estimatedMonths 再算 dirPat）
  const effHPerPerson   = parseFloat((6.4 * workDays).toFixed(1))
  const b7MonthlyH      = b7Count * effHPerPerson
  const b6MonthlyH      = b6Count * effHPerPerson
  const subMonthlyH     = parseFloat((subWeeklyH * 22 / 5).toFixed(1))
  const teamMonthlyH    = b7MonthlyH + b6MonthlyH + subCount * subMonthlyH
  const estimatedMonths = teamMonthlyH > 0 ? Math.ceil(bufferedH / teamMonthlyH) : 0
  const activeMonths    = Math.max(1, estimatedMonths)
  const dirPat = useMemo(() => computeDirPattern(estimatedMonths, directorLevel), [estimatedMonths, directorLevel])

  const getH = (key) => {
    const arr = allocData[key] || []
    return Array.from({ length: activeMonths }, (_, i) => arr[i] || 0)
  }

  // 月度手動分配計算（依賴 dirPat，需在後面）
  const allocTotal = useMemo(() =>
    designerList.reduce((s, d) => s + getH(d.key).reduce((a, b) => a + b, 0), 0)
  , [designerList, allocData])
  const remaining = bufferedH - allocTotal

  const allocMonthlyCosts = useMemo(() => Array.from({ length: activeMonths }, (_, m) => {
    const des = designerList.reduce((s, d) => s + getH(d.key)[m] * d.rate, 0)
    const dir = showDirector ? (dirPat[m] ?? 0) * DIRECTOR_RATE : 0
    return { des, dir, total: des + dir }
  }), [designerList, allocData, dirPat, showDirector, activeMonths])

  const allocGrandTotal = allocMonthlyCosts.reduce((s, m) => s + m.total, 0)
  const allocDirTotal   = allocMonthlyCosts.reduce((s, m) => s + m.dir,   0)
  const allocDesTotal   = allocMonthlyCosts.reduce((s, m) => s + m.des,   0)
  const allocSubTotal   = useMemo(() =>
    designerList.filter(d => d.key.startsWith('sub-'))
      .reduce((s, d) => s + getH(d.key).reduce((a, b) => a + b, 0) * d.rate, 0)
  , [designerList, allocData])

  function setAllocMonth(key, month, val) {
    const v = Math.max(0, Math.min(HOURS_PER_MONTH, Number(val) || 0))
    setAllocData(prev => ({
      ...prev,
      [key]: Array.from({ length: activeMonths }, (_, i) => i === month ? v : (prev[key]?.[i] || 0)),
    }))
  }
  function autoDistribute() {
    const totalCap = designerList.length * activeMonths * HOURS_PER_MONTH
    const h = Math.round(HOURS_PER_MONTH * Math.min(1, bufferedH / totalCap))
    const next = {}
    designerList.forEach(d => { next[d.key] = Array(activeMonths).fill(h) })
    setAllocData(next)
  }
  function clearAllocation() { setAllocData({}) }
  const monthlyDesCost  = b7MonthlyH * DESIGNER_LEVELS[0].rate + b6MonthlyH * DESIGNER_LEVELS[1].rate


  return (
    <div className="app">
      <header className="app-header">
        <h1>設計資源估算工具</h1>
        <p>Design Resource Estimator · 適用於 PM / 業務估案</p>
      </header>

      {/* ① Feature List */}
      <Card title="① 功能清單" subtitle="每類功能涵蓋：研究 + 整理競品｜設計執行｜基礎修改（至少 1 輪）。工時固定：總覽類 40h、交易類 28h、查詢類 16h、設定類 14h。">
        <div className="row-list">
          {FEATURE_TYPES.map(f => (
            <div key={f.id} className="row-item">
              <div className="row-label">
                <strong>{f.label}</strong>
                <span className="muted">{f.sublabel}</span>
              </div>
              <div className="row-mid">
                <span className="hours-badge">{f.hours} h / 支</span>
              </div>
              <input
                type="number" min="0" step="1"
                value={features[f.id] || ''}
                placeholder="0"
                onChange={e => setFeatures(p => ({ ...p, [f.id]: Math.max(0, Number(e.target.value) || 0) }))}
                className="num-input feature-count-input"
              />
              <Tag hours={features[f.id] * f.hours} active={features[f.id] > 0} />
            </div>
          ))}
        </div>
        <div className="subtotal">
          <span>功能工時小計 {txCount > 0 && <span className="muted">（共 {txCount} 支）</span>}</span>
          <Tag hours={txHours} active />
        </div>
      </Card>

      {/* ② Fixed Costs */}
      <Card title="② 固定成本（依批次計算）" subtitle="每個設計批次包含以下固定會議成本，可調整各項小時數。">

        {/* 批次數輸入 */}
        <div className="batch-header">
          <div className="batch-header-left">
            <span className="batch-label">預計設計批次數</span>
            <span className="muted small">每批次小計 {perBatchH} h</span>
          </div>
          <Stepper value={batches} onChange={v => setBatches(Math.max(1, v))} />
        </div>

        {/* 每批次項目 */}
        <div className="row-list" style={{ marginTop: 14 }}>
          {BATCH_COSTS.map(b => (
            <div key={b.id} className="row-item">
              <div className="row-label">
                <strong>{b.label}</strong>
                <span className="muted small">{b.note}</span>
              </div>
              <div className="batch-range-wrap">
                <span className="muted small">範圍 {b.minH}–{b.maxH}h</span>
                <input
                  type="number"
                  min={b.minH} max={b.maxH} step={1}
                  value={batchHours[b.id]}
                  onChange={e => setBatchHours(p => ({
                    ...p,
                    [b.id]: Math.min(b.maxH, Math.max(b.minH, Number(e.target.value)))
                  }))}
                  className="num-input"
                />
                <span className="muted small">h</span>
              </div>
            </div>
          ))}
        </div>

        <div className="subtotal">
          <span>固定成本小計（{batches} 批次 × {perBatchH} h）</span>
          <Tag hours={fixHours} active />
        </div>
      </Card>

      {/* ③ Add-ons */}
      <Card title="③ 加購選項" subtitle="視專案需求選擇，將增加對應設計工時。">
        <div className="row-list">
          {ADDONS.map(a => (
            <div key={a.id} className="row-item">
              <Toggle checked={addons[a.id]} onChange={a.required ? () => {} : v => setAddons(p => ({ ...p, [a.id]: v }))} />
              <div className="row-label">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <strong>{a.label}</strong>
                  {a.required && <span className="required-badge">必選</span>}
                </div>
                <span className="muted">{a.sublabel}</span>
              </div>
              <div style={{ flex: 1 }} />
              {a.dynamic ? (
                <div className="batch-range-wrap">
                  <span className="muted small">功能工時 × 1.5</span>
                  <Tag hours={sourceH} active={addons[a.id]} />
                </div>
              ) : a.minH < a.maxH ? (
                <div className="batch-range-wrap">
                  {addons[a.id] && <span className="muted small">範圍 {a.minH}–{a.maxH}h</span>}
                  <input
                    type="number"
                    min={a.minH} max={a.maxH} step={1}
                    value={addonHours[a.id]}
                    disabled={!addons[a.id]}
                    onChange={e => setAddonHours(p => ({
                      ...p,
                      [a.id]: Math.min(a.maxH, Math.max(a.minH, Number(e.target.value)))
                    }))}
                    className="num-input"
                  />
                  <span className="muted small">h</span>
                </div>
              ) : (
                <Tag hours={addonHours[a.id]} active={addons[a.id]} />
              )}
            </div>
          ))}
        </div>
        <div className="subtotal">
          <span>加購工時小計</span>
          <Tag hours={addHours} active />
        </div>
      </Card>

      {/* Hours Summary Banner */}
      <div className="summary-banner">
        <div>
          <div className="banner-label">設計團隊總工時（含 10% buffer）</div>
          <div className="banner-main">{fmt(bufferedH)}</div>
          <div className="banner-sub">
            基礎 {fmt(totalH)}（功能 {fmt(txHours)} ＋ 固定 {fmt(fixHours)} ＋ 加購 {fmt(addHours)}）× 1.1
          </div>
        </div>
      </div>


      {/* ④ Director */}
      <Card title="④ 設計總監涉入" subtitle="設計總監費用獨立計算，不佔功能工時配額。">
        <div className="row-item" style={{ marginBottom: 16 }}>
          <Toggle checked={showDirector} onChange={setShowDirector} />
          <strong>B8 設計總監</strong>
          <div style={{ flex: 1 }} />
          <span className="rate-fixed">NT$ {DIRECTOR_RATE.toLocaleString()} /h</span>
        </div>

        {showDirector && (
          <>
            <div className="director-grid">
              {Object.entries(DIRECTOR_PRESETS).map(([key, p]) => (
                <button
                  key={key}
                  className={`director-card ${directorLevel === key ? 'director-card-active' : ''}`}
                  onClick={() => setDirectorLevel(key)}
                >
                  <div className="director-card-title">{p.label}</div>
                  <div className="director-card-desc">{p.desc}</div>
                  <div className="director-card-pattern">
                    完整月 {p.fullH}h · 不足月 {p.partialH}h
                    {estimatedMonths > 0 && (
                      <span style={{ display: 'block', marginTop: 3 }}>
                        ≈ {(estimatedMonths * p.factor).toFixed(1)} 個月涉入
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </>
        )}
      </Card>

      {/* ⑤ 人力配置試算 */}
      <Card title="⑤ 人力配置試算" subtitle={`每人每天有效工時 6.4h，共需消化 ${fmt(bufferedH)}（含 10% buffer）。`}>

        {/* 人力輸入 */}
        <div className="team-grid">
          {[
            { label: 'B7 資深設計師', count: b7Count, set: setB7Count },
            { label: 'B6 設計師',     count: b6Count, set: setB6Count },
          ].map(({ label, count, set }) => (
            <div key={label} className="team-card">
              <div className="team-card-label">{label}</div>
              <div className="team-card-row">
                <span className="muted small">人數</span>
                <input
                  type="number" min="0" step="1"
                  value={count || ''}
                  placeholder="0"
                  onChange={e => set(Math.max(0, Number(e.target.value) || 0))}
                  className="num-input feature-count-input"
                />
              </div>
              <div className="team-card-cap muted small">
                {count} 人 × {effHPerPerson}h = <strong>{(count * effHPerPerson).toFixed(1)}h</strong> / 月
              </div>
            </div>
          ))}
          <div className="team-card team-card-days">
            <div className="team-card-label">每月有效工時</div>
            <div className="team-card-cap muted small" style={{ marginTop: 4 }}>
              22 天 × 6.4h = <strong>{effHPerPerson}h</strong> / 人 / 月
            </div>
          </div>
        </div>

        {/* Sub 設計師（兼職合作） */}
        <div className="row-item" style={{ marginBottom: 10 }}>
          <div className="row-label">
            <strong>Sub 設計師</strong>
            <span className="muted small">兼職合作，每週工時可調整</span>
          </div>
          <span className="muted small">人數</span>
          <input
            type="number" min="0" step="1"
            value={subCount || ''}
            placeholder="0"
            onChange={e => setSubCount(Math.max(0, Number(e.target.value) || 0))}
            className="num-input feature-count-input"
          />
          <span className="muted small">每週</span>
          <input
            type="number" min="16" max="24" step="1"
            value={subWeeklyH}
            onChange={e => setSubWeeklyH(Math.min(24, Math.max(16, Number(e.target.value) || 16)))}
            className="num-input"
          />
          <span className="muted small">h</span>
          {subCount > 0 && (
            <span className="hours-badge">≈ {subMonthlyH}h / 月 / 人</span>
          )}
        </div>

        {/* 工期摘要 */}
        {teamMonthlyH > 0 && (
          <div className="duration-summary">
            <div className="dur-item">
              <div className="dur-label">團隊每月可消化</div>
              <div className="dur-value">{teamMonthlyH.toFixed(1)} h</div>
            </div>
            <div className="dur-divider">÷</div>
            <div className="dur-item">
              <div className="dur-label">總工時（含 buffer）</div>
              <div className="dur-value">{fmt(bufferedH)}</div>
            </div>
            <div className="dur-divider">=</div>
            <div className="dur-item dur-result">
              <div className="dur-label">預估工期</div>
              <div className="dur-value highlight">{estimatedMonths} 個月</div>
            </div>
          </div>
        )}


        {teamMonthlyH === 0 && (
          <div className="status-badge status-warn" style={{ marginTop: 16 }}>請輸入至少一位設計師人數</div>
        )}
      </Card>

      {/* ⑥ 月度工時分配 */}
      <Card
        title="⑥ 月度工時分配"
        subtitle={`依 ⑤ 人力設定產生人員列表，手動填入各月工時，右側即時顯示小計工時與金額。`}
      >
        <div className="alloc-toolbar">
          <button className="btn btn-primary" onClick={autoDistribute}>自動均分</button>
          <button className="btn btn-ghost" onClick={clearAllocation}>清除</button>
          <div style={{ flex: 1 }} />
          <div className={`status-badge ${Math.abs(remaining) < 1 ? 'status-ok' : remaining < 0 ? 'status-over' : 'status-warn'}`}>
            {Math.abs(remaining) < 1
              ? '✓ 工時已全部分配'
              : remaining > 0 ? `剩餘 ${fmt(remaining)} 未分配` : `超出 ${fmt(-remaining)}`}
          </div>
        </div>

        <div className="table-wrap">
          <table className="alloc-table">
            <thead>
              <tr>
                <th className="th-left">人員</th>
                {Array.from({ length: activeMonths }, (_, i) => <th key={i}>M{i + 1}</th>)}
                <th className="th-right">小計 h</th>
                <th className="th-right">金額</th>
              </tr>
            </thead>
            <tbody>
              {/* 設計師人員列（由 ⑥ 人數動態產生） */}
              {designerList.map(d => {
                const hrs = getH(d.key)
                const rowH = hrs.reduce((a, b) => a + b, 0)
                const rowCost = rowH * d.rate
                return (
                  <tr key={d.key}>
                    <td className="td-label">
                      <div><strong>{d.label}</strong></div>
                      <div className="muted small">NT$ {d.rate.toLocaleString()} /h</div>
                    </td>
                    {hrs.map((h, m) => (
                      <td key={m} className="td-cell">
                        <input
                          type="number" min="0" max={HOURS_PER_MONTH} step="8"
                          value={h || ''}
                          placeholder="0"
                          onChange={e => setAllocMonth(d.key, m, e.target.value)}
                          className="cell-input"
                        />
                      </td>
                    ))}
                    <td className="td-right mono small">{rowH > 0 ? fmt(rowH) : '—'}</td>
                    <td className="td-right mono small bold">{rowCost > 0 ? money(rowCost) : '—'}</td>
                  </tr>
                )
              })}

              {/* 設計總監（唯讀） */}
              {showDirector && (() => {
                const dirH = dirPat.reduce((a, b) => a + b, 0)
                const dirCost = dirH * DIRECTOR_RATE
                return (
                  <tr className="tr-director">
                    <td className="td-label">
                      <div><strong>B8 設計總監</strong></div>
                      <div className="muted small">NT$ {DIRECTOR_RATE.toLocaleString()} /h · {DIRECTOR_PRESETS[directorLevel].label}</div>
                    </td>
                    {dirPat.map((h, m) => (
                      <td key={m} className="td-cell mono small amber">{h > 0 ? `${h}h` : '—'}</td>
                    ))}
                    <td className="td-right mono small amber">{fmt(dirH)}</td>
                    <td className="td-right mono small bold amber">{money(dirCost)}</td>
                  </tr>
                )
              })()}

              {/* 月合計列 */}
              <tr className="tr-total">
                <td className="td-label bold">月小計</td>
                {Array.from({ length: activeMonths }, (_, m) => {
                  const colH  = designerList.reduce((s, d) => s + getH(d.key)[m], 0)
                  const colDir = showDirector ? (dirPat[m] ?? 0) : 0
                  const colCost = allocMonthlyCosts[m].total
                  const over = colH > HOURS_PER_MONTH
                  return (
                    <td key={m} className={`td-cell ${over ? 'over' : ''}`}>
                      <div className="mono small bold">{money(colCost)}</div>
                      <div className={`mono small muted`}>{colH + colDir}h</div>
                    </td>
                  )
                })}
                <td className="td-right mono small">{fmt(allocTotal)}</td>
                <td className="td-right mono small bold">{money(allocGrandTotal)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="grand-total">
          <div>
            <div className="gt-label">專案設計費用總計</div>
            <div className="gt-amount">{money(allocGrandTotal)}</div>
            <div className="gt-sub">
              <span>設計團隊費用：{money(allocDesTotal - allocSubTotal + allocDirTotal)}</span>
              {subCount > 0 && <span> ／ Sub 設計師：{money(allocSubTotal)}</span>}
            </div>
          </div>
          <div className="gt-hours">
            <div>功能工時 {fmt(txHours)}</div>
            <div>固定成本 {fmt(fixHours)}</div>
            <div>加購 {fmt(addHours)}</div>
            <div>基礎小計 {fmt(totalH)}</div>
            <div className="gt-hours-total">含 buffer {fmt(bufferedH)}</div>
          </div>
        </div>
      </Card>

      <p className="footer-note">本工具僅供估算參考，實際費用依合約與專案狀況調整。</p>
    </div>
  )
}
