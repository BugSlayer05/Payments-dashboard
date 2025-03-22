import React, { useState } from 'react';
import { transactionsApi } from '../services/api';
import { Upload, Plus } from 'lucide-react';

const EMPTY_TX = {
  reference: '',
  account: '',
  date: '',
  amount: '',
  type: 'inflow' as 'inflow' | 'outflow',
  category: '',
};

const SAMPLE_BULK = JSON.stringify(
  {
    transactions: [
      { reference: '000051', account: 'S00099', date: '2020-01-13', amount: '-51.13', type: 'outflow', category: 'groceries' },
      { reference: '000052', account: 'C00099', date: '2020-01-14', amount: '2500.72', type: 'inflow', category: 'salary' },
      { reference: '000053', account: 'S00012', date: '2020-01-15', amount: '150.72', type: 'inflow', category: 'savings' },
      { reference: '000054', account: 'C00099', date: '2020-01-16', amount: '-560.00', type: 'outflow', category: 'rent' },
      { reference: '000055', account: 'C00099', date: '2020-01-17', amount: '-150.72', type: 'outflow', category: 'transfer' },
    ],
  },
  null,
  2,
);

export default function IngestPage() {
  // Single
  const [single, setSingle] = useState({ ...EMPTY_TX });
  const [singleLoading, setSingleLoading] = useState(false);
  const [singleMsg, setSingleMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Bulk
  const [bulkJson, setBulkJson] = useState(SAMPLE_BULK);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkMsg, setBulkMsg] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  const submitSingle = async () => {
    if (!single.reference || !single.account || !single.date || !single.amount || !single.category) {
      setSingleMsg({ type: 'error', text: 'All fields are required' });
      return;
    }
    const amountNum = Number(single.amount);
    if (Number.isNaN(amountNum)) {
      setSingleMsg({ type: 'error', text: 'Amount must be a valid number' });
      return;
    }
    setSingleLoading(true);
    setSingleMsg(null);
    try {
      const tx = await transactionsApi.create({
        ...single,
        amount: amountNum,
      });
      setSingleMsg({ type: 'success', text: `Transaction ${tx.reference} saved` });
      setSingle({ ...EMPTY_TX });
    } catch (e: any) {
      setSingleMsg({ type: 'error', text: e?.response?.data?.message || 'Failed to save transaction' });
    } finally {
      setSingleLoading(false);
    }
  };

  const submitBulk = async () => {
    let parsed: any;
    try {
      parsed = JSON.parse(bulkJson);
    } catch {
      setBulkMsg({ type: 'error', text: 'Invalid JSON — please check the format' });
      return;
    }
    setBulkLoading(true);
    setBulkMsg(null);
    try {
      const result = await transactionsApi.createBulk(parsed.transactions ?? parsed);
      const errText = result.errors.length ? ` | Errors: ${result.errors.join(', ')}` : '';
      setBulkMsg({
        type: result.errors.length ? 'info' : 'success',
        text: `Created: ${result.created} · Skipped (duplicates): ${result.skipped}${errText}`,
      });
    } catch (e: any) {
      setBulkMsg({ type: 'error', text: e?.response?.data?.message || 'Bulk ingest failed' });
    } finally {
      setBulkLoading(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Ingest Transactions</h1>
        <p className="page-subtitle">Add single or bulk transactions via the API (requires API key)</p>
      </div>

      <div className="two-col">
        {/* Single transaction */}
        <div className="card">
          <div className="card-title">Single Transaction</div>
          {singleMsg && <div className={`alert alert-${singleMsg.type}`}>{singleMsg.text}</div>}

          <div className="form-group">
            <label className="form-label">Reference</label>
            <input className="form-input" placeholder="000051" value={single.reference}
              onChange={e => setSingle(s => ({ ...s, reference: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Account</label>
            <input className="form-input" placeholder="S00099" value={single.account}
              onChange={e => setSingle(s => ({ ...s, account: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Date</label>
            <input className="form-input" type="date" value={single.date}
              onChange={e => setSingle(s => ({ ...s, date: e.target.value }))} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label className="form-label">Type</label>
              <select className="form-select" value={single.type}
                onChange={e => setSingle(s => ({ ...s, type: e.target.value as 'inflow' | 'outflow' }))}>
                <option value="inflow">inflow</option>
                <option value="outflow">outflow</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Amount</label>
              <input className="form-input" placeholder={single.type === 'outflow' ? '-51.13' : '100.00'}
                value={single.amount}
                onChange={e => setSingle(s => ({ ...s, amount: e.target.value }))} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Category</label>
            <input className="form-input" placeholder="groceries, salary, rent…" value={single.category}
              onChange={e => setSingle(s => ({ ...s, category: e.target.value }))} />
          </div>
          <button className="btn btn-primary" onClick={submitSingle} disabled={singleLoading}>
            <Plus size={14} />
            {singleLoading ? 'Saving…' : 'Save Transaction'}
          </button>
        </div>

        {/* Bulk */}
        <div className="card">
          <div className="card-title">Bulk Ingest (JSON)</div>
          {bulkMsg && <div className={`alert alert-${bulkMsg.type}`}>{bulkMsg.text}</div>}
          <div className="form-group">
            <label className="form-label">Payload</label>
            <textarea
              className="form-input"
              rows={18}
              style={{ resize: 'vertical', fontFamily: 'var(--font-mono)', fontSize: 12, lineHeight: 1.5 }}
              value={bulkJson}
              onChange={e => setBulkJson(e.target.value)}
            />
          </div>
          <button className="btn btn-primary" onClick={submitBulk} disabled={bulkLoading}>
            <Upload size={14} />
            {bulkLoading ? 'Ingesting…' : 'Bulk Ingest'}
          </button>
          <p style={{ color: 'var(--text-muted)', fontSize: 11, marginTop: 10 }}>
            Duplicate references are silently skipped (idempotent).
          </p>
        </div>
      </div>
    </div>
  );
}
