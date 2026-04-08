import { useState, useMemo } from 'react'
import './App.css'

// ─── Password ────────────────────────────────────────────────────────────────

const ACCESS_PASSWORD = '2026ibm'

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
  { id: 'overview',    label: '總覽類', sublabel: 'Overview / Dashboard', hours: 64, noTier: true },
  { id: 'transaction', label: '交易類', sublabel: 'Transaction',          hours: 40 },
  { id: 'query',       label: '查詢類', sublabel: 'Query',                hours: 28 },
  { id: 'setting',     label: '設定類', sublabel: 'Setting',              hours: 18 },
]

const ADDONS = [
  { id: 'uikit',   label: 'UI Kit 基礎制定｜共用元件盤點', sublabel: '建立共用元件庫與設計基礎規則', minH: 40, maxH: 40, defaultH: 40, required: true },
  { id: 'visual',  label: '視覺風格提案',  sublabel: '以關鍵頁面製作 2 版視覺風格提案',  minH: 80, maxH: 80, defaultH: 80 },
  { id: 'spec',    label: '設計規範產出',  sublabel: '輸出可交付開發的設計規格文件',    minH: 40, maxH: 40, defaultH: 40 },
  { id: 'appicon', label: 'App Icon',      sublabel: '產出 >3 版選擇，包含來回微調', minH: 40, maxH: 40, defaultH: 40 },
  { id: 'splash',  label: 'Splash & Loading', sublabel: '啟動畫面與載入動畫',         minH: 40, maxH: 40, defaultH: 40 },
  { id: 'source',  label: '提供原始檔',   sublabel: '交付可編輯的設計原始檔',         dynamic: true },
]

const DIRECTOR_PRESETS = {
  high:   { label: '高涉入', desc: '涉入工期 2/3 月份，尾月起 20→40→60→80h', factor: 2/3 },
  medium: { label: '中涉入', desc: '涉入工期 1/2 月份，尾月起 20→40→60→80h', factor: 1/2 },
  low:    { label: '低涉入', desc: '涉入工期 1/3 月份，尾月起 20→40→60→80h', factor: 1/3 },
}

const DIR_RAMP = [20, 40, 60, 80]

function computeDirPattern(months, level) {
  if (!months) return []
  const { factor } = DIRECTOR_PRESETS[level]
  const involvedMonths = Math.round(months * factor)
  // 涉入的是前 N 個月，從第 N 月往回填 20, 40, 60, 80；超過 4 個月繼續填 80
  return Array.from({ length: months }, (_, i) => {
    if (i >= involvedMonths) return 0
    const fromInvolvedEnd = involvedMonths - 1 - i  // 0 = 最後涉入月
    return fromInvolvedEnd < DIR_RAMP.length ? DIR_RAMP[fromInvolvedEnd] : 80
  })
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

function calcTiered(count, hoursPerUnit) {
  if (count === 0) return { t1: 0, t2: 0, t3: 0, total: 0 }
  const t1 = Math.ceil(count / 3)
  const t2 = Math.ceil((count - t1) / 2)
  const t3 = count - t1 - t2
  const total = Math.round(t1 * hoursPerUnit + t2 * hoursPerUnit * 0.66 + t3 * hoursPerUnit * 0.33)
  return { t1, t2, t3, total }
}

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

function InfoBtn({ onClick }) {
  return (
    <button className="info-btn" onClick={onClick}>計算說明</button>
  )
}

function Modal({ title, onClose, children }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">{title}</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  )
}

// ─── Main App ────────────────────────────────────────────────────────────────

export default function App() {
  const [unlocked, setUnlocked] = useState(false)
  if (!unlocked) return <LoginGate onUnlock={() => setUnlocked(true)} />
  return <Estimator />
}

function Estimator() {
  const [features, setFeatures] = useState({ overview: 0, transaction: 0, query: 0, setting: 0 })
  const [addons, setAddons] = useState({ uikit: true, visual: false, spec: false, appicon: false, splash: false, source: false })
  const [addonHours, setAddonHours] = useState(
    Object.fromEntries(ADDONS.map(a => [a.id, a.defaultH]))
  )
  const [directorLevel, setDirectorLevel] = useState('medium')
  const showDirector = true
  const [openModal, setOpenModal] = useState(null)
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
  const txHours   = useMemo(() => FEATURE_TYPES.reduce((s, f) => s + (f.noTier ? features[f.id] * f.hours : calcTiered(features[f.id], f.hours).total), 0), [features])
  const sourceH   = Math.round(txHours * 1.5)
  const addHours  = useMemo(() => ADDONS.reduce((s, a) => {
    if (!addons[a.id]) return s
    return s + (a.dynamic ? sourceH : addonHours[a.id])
  }, 0), [addons, addonHours, sourceH])
  const totalH    = txHours + addHours
  const bufferedH = totalH

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

  // 預設分配：B7 優先填 160h，剩餘才給 B6，不超過總工時
  const defaultAlloc = useMemo(() => {
    let remaining = totalH
    const subActiveMonths = Math.round(activeMonths * 2 / 3)
    const result = {}
    const subList = designerList.filter(d => d.key.startsWith('sub-'))
    const mainList = designerList.filter(d => !d.key.startsWith('sub-'))

    // 1. 先填 Sub（前 2/3 工期，每月 80h）
    for (const d of subList) {
      const months = Array(activeMonths).fill(0)
      for (let m = 0; m < subActiveMonths; m++) {
        const h = Math.min(80, Math.max(0, remaining))
        months[m] = h
        remaining -= h
      }
      result[d.key] = months
    }

    // 2. 再填 B7、B6（每月 160h，B7 優先）
    for (const d of mainList) {
      const months = Array(activeMonths).fill(0)
      for (let m = 0; m < activeMonths; m++) {
        const h = Math.min(160, Math.max(0, remaining))
        months[m] = h
        remaining -= h
      }
      result[d.key] = months
    }

    return result
  }, [designerList, totalH, activeMonths])

  const getH = (key) => {
    const arr = allocData[key]
    if (!arr) return defaultAlloc[key] || Array(activeMonths).fill(0)
    return Array.from({ length: activeMonths }, (_, i) => i < arr.length ? arr[i] : (defaultAlloc[key]?.[i] ?? 0))
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
      [key]: Array.from({ length: activeMonths }, (_, i) => i === month ? v : (prev[key]?.[i] ?? (defaultAlloc[key]?.[i] ?? 0))),
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

  function resetAll() {
    setFeatures({ overview: 0, transaction: 0, query: 0, setting: 0 })
    setAddons({ uikit: true, visual: false, spec: false, appicon: false, splash: false, source: false })
    setAddonHours(Object.fromEntries(ADDONS.map(a => [a.id, a.defaultH])))
    setDirectorLevel('medium')
    setB7Count(1)
    setB6Count(1)
    setSubCount(0)
    setSubWeeklyH(20)
    setAllocData({})
  }


  return (
    <div className="app">
      <header className="app-header">
        <h1>設計資源估算工具</h1>
        <p>Design Resource Estimator · 適用於 PM / 業務估案</p>
        <button className="reset-btn" onClick={resetAll}>一鍵清除</button>
      </header>

      {/* ① Feature List */}
      <Card title="① 功能清單" subtitle="涵蓋 SA 內部會議與客戶會議、調整修改、需求訪談、畫面示意提供等 buffer。">
        <div className="row-list">
          {FEATURE_TYPES.map(f => {
            const count = features[f.id]
            const { t1, t2, t3, total } = f.noTier
              ? { t1: 0, t2: 0, t3: 0, total: count * f.hours }
              : calcTiered(count, f.hours)
            return (
              <div key={f.id} className="feature-row-wrap">
                <div className="row-item">
                  <div className="row-label">
                    <strong>{f.label}</strong>
                    <span className="muted">{f.sublabel}</span>
                  </div>
                  <div className="row-mid">
                    <span className="hours-badge">{f.hours} h / 支</span>
                  </div>
                  <input
                    type="number" min="0" step="1"
                    value={count || ''}
                    placeholder="0"
                    onChange={e => setFeatures(p => ({ ...p, [f.id]: Math.max(0, Number(e.target.value) || 0) }))}
                    className="num-input feature-count-input"
                  />
                  <Tag hours={total} active={count > 0} />
                </div>
                {count > 0 && !f.noTier && (
                  <div className="tier-breakdown">
                    <span>前 {t1} 支 × {f.hours}h</span>
                    <span className="tier-arrow">→</span>
                    <span>中 {t2} 支 × {Math.round(f.hours * 0.66)}h</span>
                    <span className="tier-arrow">→</span>
                    <span>後 {t3} 支 × {Math.round(f.hours * 0.33)}h</span>
                  </div>
                )}
              </div>
            )
          })}
        </div>
        <div className="subtotal">
          <span>功能工時小計 {txCount > 0 && <span className="muted">（共 {txCount} 支）</span>}</span>
          <InfoBtn onClick={() => setOpenModal('feature-calc')} />
          <Tag hours={txHours} active />
        </div>
      </Card>

      {/* ② Add-ons */}
      <Card title="② 加購選項" subtitle="視專案需求選擇，將增加對應設計工時。">
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
          <div className="banner-label">設計團隊總工時</div>
          <div className="banner-main">{fmt(bufferedH)}</div>
          <div className="banner-sub">
            功能 {fmt(txHours)} ＋ 加購 {fmt(addHours)}
          </div>
        </div>
      </div>


      {/* ③ Director */}
      <Card title="③ 設計總監涉入" subtitle="設計總監費用獨立計算，不佔功能工時配額。">
        <div className="director-grid">
          {Object.entries(DIRECTOR_PRESETS).map(([key, p]) => (
            <div
              key={key}
              className={`director-card ${directorLevel === key ? 'director-card-active' : ''}`}
              onClick={() => setDirectorLevel(key)}
              role="button"
              tabIndex={0}
              onKeyDown={e => e.key === 'Enter' && setDirectorLevel(key)}
            >
              <div className="director-card-title">{p.label}</div>
              <div className="director-card-pattern">
                {estimatedMonths > 0
                  ? `涉入 ${Math.round(estimatedMonths * p.factor)} 個月（共 ${estimatedMonths} 個月）`
                  : '請先設定人力配置'}
              </div>
              <button
                className="info-btn info-btn-sm"
                onClick={e => { e.stopPropagation(); setOpenModal(`dir-${key}`) }}
              >計算說明</button>
            </div>
          ))}
        </div>
      </Card>

      {/* ④ 人力配置試算 */}
      <Card title="④ 人力配置試算" subtitle={`每人每天有效工時 6.4h，共需消化 ${fmt(totalH)}。`}>

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
              <div className="dur-label">總工時</div>
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

      {/* ⑤ 月度工時分配 */}
      <Card
        title="⑤ 月度工時分配"
        subtitle={`依 ④ 人力設定產生人員列表，手動填入各月工時，右側即時顯示小計工時與金額。`}
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
            <div>加購 {fmt(addHours)}</div>
            <div className="gt-hours-total">總計 {fmt(totalH)}</div>
          </div>
        </div>
      </Card>

      <p className="footer-note">本工具僅供估算參考，實際費用依合約與專案狀況調整。</p>

      {/* Modals */}
      {openModal === 'feature-calc' && (
        <Modal title="功能工時計算說明" onClose={() => setOpenModal(null)}>
          <p>每類功能工時採<strong>遞減分段</strong>計算，反映重複性功能的效率提升：</p>
          <table className="modal-table">
            <thead><tr><th>分段</th><th>佔比</th><th>工時倍率</th></tr></thead>
            <tbody>
              <tr><td>前 ⅓ 支</td><td>首批功能</td><td>× 100%</td></tr>
              <tr><td>中 ⅓ 支</td><td>中段功能</td><td>× 66%</td></tr>
              <tr><td>後 ⅓ 支</td><td>尾段功能</td><td>× 33%</td></tr>
            </tbody>
          </table>
          <p className="modal-note">總覽類不適用遞減，每支固定 60h。</p>
          <p className="modal-note">範例：交易類 30 支（36h / 支）<br/>
            前 10 支 × 36h = 360h<br/>
            中 10 支 × 24h = 240h<br/>
            後 10 支 × 12h = 120h<br/>
            <strong>合計 720h</strong>（vs 平均計算 1,080h）
          </p>
        </Modal>
      )}
      {['high', 'medium', 'low'].map(key => openModal === `dir-${key}` && (
        <Modal key={key} title={`設計總監・${DIRECTOR_PRESETS[key].label}說明`} onClose={() => setOpenModal(null)}>
          <p>{DIRECTOR_PRESETS[key].desc}</p>
          <p>涉入月份為<strong>工期前段</strong>，從最後涉入月往回填入時數：</p>
          <table className="modal-table">
            <thead><tr><th>距涉入結束</th><th>時數</th></tr></thead>
            <tbody>
              <tr><td>最後涉入月（M_n）</td><td>20h</td></tr>
              <tr><td>倒數第 2 月</td><td>40h</td></tr>
              <tr><td>倒數第 3 月</td><td>60h</td></tr>
              <tr><td>倒數第 4 月起</td><td>80h</td></tr>
            </tbody>
          </table>
          {estimatedMonths > 0 && (() => {
            const pat = computeDirPattern(estimatedMonths, key)
            return (
              <div className="modal-pattern">
                <p className="modal-note" style={{ marginBottom: 6 }}>
                  當前工期 {estimatedMonths} 個月，涉入 {Math.round(estimatedMonths * DIRECTOR_PRESETS[key].factor)} 個月：
                </p>
                <div className="modal-month-row">
                  {pat.map((h, i) => (
                    <div key={i} className={`modal-month-cell ${h > 0 ? 'active' : ''}`}>
                      <div className="modal-month-label">M{i + 1}</div>
                      <div className="modal-month-val">{h > 0 ? `${h}h` : '—'}</div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })()}
        </Modal>
      ))}
    </div>
  )
}
