import React, { useState } from 'react';
import { useApi } from '../hooks/useApi';
import { transactionsApi, Transaction } from '../services/api';

function fmt(v: string | number) {
  return parseFloat(String(v)).toLocaleString('es-MX', { minimumFractionDigits: 2 });
}

export default function TransactionsPage() {
  const [account, setAccount] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [applied, setApplied] = useState<{ account?: string; startDate?: string; endDate?: string }>({});

  const { data: txs, loading, error } = useApi(
    () => transactionsApi.list(applied),
    [applied],
  );

  const apply = () => setApplied({ account: account || undefined, startDate: startDate || undefined, endDate: endDate || undefined });
  const reset = () => { setAccount(''); setStartDate(''); setEndDate(''); setApplied({}); };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Transactions</h1>
        <p className="page-subtitle">Browse and filter all transaction records</p>
      </div>

      <div className="card">
        <div className="card-title">Filters</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto auto', gap: 12, alignItems: 'flex-end' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Account</label>
            <input className="form-input" placeholder="e.g. S00099" value={account} onChange={e => setAccount(e.target.value)} />
          </div>
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

      <div className="card">
        <div className="card-title">
          {txs ? `${txs.length} transactions` : 'Transactions'}
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        {loading ? (
          <div className="loading"><div className="spinner" /> Loading…</div>
        ) : !txs?.length ? (
          <div className="empty">No transactions found</div>
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
                {txs.map((tx: Transaction) => (
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
    </div>
  );
}
