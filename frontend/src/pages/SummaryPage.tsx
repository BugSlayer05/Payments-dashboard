import React, { useState } from 'react';
import { useApi } from '../hooks/useApi';
import { summaryApi } from '../services/api';
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid,
} from 'recharts';

function fmt(v: string | number) {
  return parseFloat(String(v)).toLocaleString('es-MX', { minimumFractionDigits: 2 });
}

const COLORS = ['#5b6af0', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899'];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border-2)', borderRadius: 6, padding: '10px 14px' }}>
      <p style={{ color: 'var(--text-muted)', fontSize: 11, marginBottom: 6 }}>{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color, fontFamily: 'var(--font-mono)', fontSize: 13 }}>
          {p.name}: ${fmt(Math.abs(p.value))}
        </p>
      ))}
    </div>
  );
};

// Tooltip for Pie charts (inflow/outflow). We color the full "category: $value"
// text to match the hovered slice color.
const PieCategoryTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;

  const p0 = payload[0];
  const data = p0?.payload ?? {};
  const color = data?.color ?? p0?.color ?? 'var(--text)';
  const name = data?.name ?? '';
  const value = data?.value ?? p0?.value ?? 0;

  return (
    <div
      style={{
        background: 'var(--surface-2)',
        border: '1px solid var(--border-2)',
        borderRadius: 6,
        padding: '10px 14px',
      }}
    >
      <p style={{ color, fontFamily: 'var(--font-mono)', fontSize: 13, margin: 0 }}>
        {name}: ${fmt(value)}
      </p>
    </div>
  );
};

export default function SummaryPage() {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [applied, setApplied] = useState<{ startDate?: string; endDate?: string }>({});

  const { data: accounts, loading: loadingAcc } = useApi(() => summaryApi.accounts(applied), [applied]);
  const { data: categories, loading: loadingCat } = useApi(() => summaryApi.categories(applied), [applied]);

  const apply = () => setApplied({ startDate: startDate || undefined, endDate: endDate || undefined });
  const reset = () => { setStartDate(''); setEndDate(''); setApplied({}); };

  // Build pie data for outflow categories
  const outflowPie = Object.entries(categories?.outflow ?? {}).map(([name, val], i) => ({
    name,
    value: Math.abs(parseFloat(val)),
    color: COLORS[i % COLORS.length],
  }));

  const inflowPie = Object.entries(categories?.inflow ?? {}).map(([name, val], i) => ({
    name,
    value: parseFloat(val),
    color: name === 'salary' ? '#F59E0B' : COLORS[i % COLORS.length],
  }));

  // Account bar data
  const accountData = accounts?.map(a => ({
    account: a.account,
    inflow: parseFloat(a.total_inflow),
    outflow: Math.abs(parseFloat(a.total_outflow)),
    balance: parseFloat(a.balance),
  })) ?? [];

  const loading = loadingAcc || loadingCat;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Summary</h1>
        <p className="page-subtitle">Account and category breakdowns</p>
      </div>

      {/* Date filters */}
      <div className="card">
        <div className="card-title">Date Range</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto auto', gap: 12, alignItems: 'flex-end' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Start Date</label>
            <input className="form-input" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">End Date</label>
            <input className="form-input" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
          </div>
          <button className="btn btn-primary" onClick={apply}>Apply</button>
          <button className="btn btn-ghost" onClick={reset}>Reset</button>
        </div>
      </div>

      {loading ? (
        <div className="loading"><div className="spinner" /> Loading…</div>
      ) : (
        <>
          {/* Account Summary Table */}
          <div className="card">
            <div className="card-title">Account Summary</div>
            {!accounts?.length ? (
              <div className="empty">No data</div>
            ) : (
              <>
                <div className="table-wrap" style={{ marginBottom: 24 }}>
                  <table>
                    <thead>
                      <tr>
                        <th>Account</th>
                        <th>Total Inflow</th>
                        <th>Total Outflow</th>
                        <th>Balance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {accounts.map(a => (
                        <tr key={a.account}>
                          <td className="mono">{a.account}</td>
                          <td className="amount-positive">${fmt(a.total_inflow)}</td>
                          <td className="amount-negative">${fmt(Math.abs(parseFloat(a.total_outflow)))}</td>
                          <td className={parseFloat(a.balance) >= 0 ? 'amount-positive' : 'amount-negative'}>
                            ${fmt(a.balance)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={accountData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="account" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} />
                    <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 10 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: 11, color: 'var(--text-muted)' }} />
                    <Bar dataKey="inflow" fill="#22c55e" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="outflow" fill="#ef4444" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </>
            )}
          </div>

          {/* Category breakdown */}
          <div className="two-col">
            <div className="card">
              <div className="card-title">Inflow by Category</div>
              {!inflowPie.length ? <div className="empty">No data</div> : (
                <>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={inflowPie} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={75} strokeWidth={0}>
                        {inflowPie.map((e, i) => <Cell key={i} fill={e.color} />)}
                      </Pie>
                      <Tooltip content={<PieCategoryTooltip />} />
                      <Legend wrapperStyle={{ fontSize: 11, color: 'var(--text-muted)' }} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div style={{ marginTop: 12 }}>
                    {Object.entries(categories?.inflow ?? {}).map(([cat, val]) => (
                      <div key={cat} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
                        <span className="badge badge-neutral">{cat}</span>
                        <span className="amount-positive">${fmt(val)}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            <div className="card">
              <div className="card-title">Outflow by Category</div>
              {!outflowPie.length ? <div className="empty">No data</div> : (
                <>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={outflowPie} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={75} strokeWidth={0}>
                        {outflowPie.map((e, i) => <Cell key={i} fill={e.color} />)}
                      </Pie>
                      <Tooltip content={<PieCategoryTooltip />} />
                      <Legend wrapperStyle={{ fontSize: 11, color: 'var(--text-muted)' }} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div style={{ marginTop: 12 }}>
                    {Object.entries(categories?.outflow ?? {}).map(([cat, val]) => (
                      <div key={cat} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
                        <span className="badge badge-neutral">{cat}</span>
                        <span className="amount-negative">${fmt(Math.abs(parseFloat(val)))}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
