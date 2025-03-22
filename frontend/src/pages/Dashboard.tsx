import React from 'react';
import { useApi } from '../hooks/useApi';
import { summaryApi, transactionsApi, AccountSummary, Transaction } from '../services/api';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import { TrendingUp, TrendingDown, Wallet, Activity } from 'lucide-react';

function fmt(v: string | number) {
  return parseFloat(String(v)).toLocaleString('es-MX', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border-2)', borderRadius: 6, padding: '10px 14px' }}>
      <p style={{ color: 'var(--text-muted)', fontSize: 11, marginBottom: 6 }}>{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color, fontFamily: 'var(--font-mono)', fontSize: 13 }}>
          {p.name}: {fmt(p.value)}
        </p>
      ))}
    </div>
  );
};

export default function Dashboard() {
  const { data: accounts, loading: loadingAcc } = useApi(() => summaryApi.accounts());
  const { data: txs, loading: loadingTx } = useApi(() => transactionsApi.list());

  const totalBalance = accounts?.reduce((s, a) => s + parseFloat(a.balance), 0) ?? 0;
  const totalInflow = accounts?.reduce((s, a) => s + parseFloat(a.total_inflow), 0) ?? 0;
  const totalOutflow = accounts?.reduce((s, a) => s + parseFloat(a.total_outflow), 0) ?? 0;
  const txCount = txs?.length ?? 0;

  // Build monthly chart data from transactions
  const monthlyMap: Record<string, { month: string; inflow: number; outflow: number }> = {};
  txs?.forEach((tx: Transaction) => {
    const m = tx.date.slice(0, 7);
    if (!monthlyMap[m]) monthlyMap[m] = { month: m, inflow: 0, outflow: 0 };
    if (tx.type === 'inflow') monthlyMap[m].inflow += Math.abs(parseFloat(String(tx.amount)));
    else monthlyMap[m].outflow += Math.abs(parseFloat(String(tx.amount)));
  });
  const monthlyData = Object.values(monthlyMap).sort((a, b) => a.month.localeCompare(b.month)).slice(-6);

  const loading = loadingAcc || loadingTx;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Payments Dashboard</h1>
        <p className="page-subtitle">Real-time transaction overview for the Mexican market</p>
      </div>

      {loading ? (
        <div className="loading"><div className="spinner" /> Loading data…</div>
      ) : (
        <>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-label">Total Balance</div>
              <div className={`stat-value ${totalBalance >= 0 ? 'positive' : 'negative'}`}>
                ${fmt(totalBalance)}
              </div>
              <div className="stat-sub">MXN · all accounts</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Total Inflow</div>
              <div className="stat-value positive">${fmt(totalInflow)}</div>
              <div className="stat-sub" style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                <TrendingUp size={11} color="var(--green)" /> incoming
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Total Outflow</div>
              <div className="stat-value negative">${fmt(Math.abs(totalOutflow))}</div>
              <div className="stat-sub" style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                <TrendingDown size={11} color="var(--red)" /> outgoing
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Transactions</div>
              <div className="stat-value">{txCount.toLocaleString()}</div>
              <div className="stat-sub" style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                <Activity size={11} /> total records
              </div>
            </div>
          </div>

          <div className="two-col">
            <div className="card">
              <div className="card-title">Monthly Flow</div>
              {monthlyData.length === 0 ? (
                <div className="empty">No data yet</div>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={monthlyData}>
                    <defs>
                      <linearGradient id="gi" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="go" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="month" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} />
                    <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 10 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="inflow" stroke="#22c55e" fill="url(#gi)" strokeWidth={2} />
                    <Area type="monotone" dataKey="outflow" stroke="#ef4444" fill="url(#go)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="card">
              <div className="card-title">Account Balances</div>
              {!accounts?.length ? (
                <div className="empty">No accounts yet</div>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={accounts.map(a => ({ account: a.account, balance: parseFloat(a.balance) }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="account" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} />
                    <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 10 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="balance" fill="var(--accent)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="card">
            <div className="card-title">Recent Transactions</div>
            {!txs?.length ? (
              <div className="empty">No transactions yet</div>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Reference</th>
                      <th>Account</th>
                      <th>Date</th>
                      <th>Category</th>
                      <th>Type</th>
                      <th>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {txs.slice(0, 10).map((tx: Transaction) => (
                      <tr key={tx.id}>
                        <td className="mono" style={{ color: 'var(--text-muted)' }}>{tx.reference}</td>
                        <td className="mono">{tx.account}</td>
                        <td className="mono" style={{ color: 'var(--text-muted)' }}>{tx.date}</td>
                        <td><span className="badge badge-neutral">{tx.category}</span></td>
                        <td><span className={`badge badge-${tx.type}`}>{tx.type}</span></td>
                        <td className={parseFloat(String(tx.amount)) >= 0 ? 'amount-positive' : 'amount-negative'}>
                          ${fmt(tx.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
