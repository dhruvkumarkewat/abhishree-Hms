import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Printer } from 'lucide-react';
import { get, fmtDate } from '../lib/api';
import { LoadError } from '../components/ui';

function DocHead({ title }: { title: string }) {
  return (
    <div className="text-center border-b-2 border-slate-900 pb-4 mb-5">
      <div className="flex items-center justify-center gap-2.5">
        <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#0e5aa7,#0d9488)' }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M9 3h6v6h6v6h-6v6H9v-6H3V9h6V3z" fill="#fff" /></svg>
        </div>
        <div className="text-left">
          <div className="text-xl font-extrabold tracking-tight">ABHISHREE HOSPITAL</div>
          <div className="text-[11px] text-slate-500 font-medium">14 Health Avenue, Bengaluru · 1800 123 456 · care@abhishree.hospital</div>
        </div>
      </div>
      <div className="mt-3 inline-block text-[12px] font-bold tracking-[.2em] uppercase border border-slate-900 rounded-full px-4 py-1">{title}</div>
    </div>
  );
}

export function PrescriptionDoc() {
  const { id } = useParams();
  const nav = useNavigate();
  const [r, setR] = useState<any>(null);
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const all = await get('/api/prescriptions');
        const found = (Array.isArray(all) ? all : []).find((x: any) => String(x.id) === String(id));
        if (!found) throw new Error('Prescription not found.');
        setR(found);
      } catch (e: any) { setErr(e.message); }
      setLoading(false);
    })();
  }, [id]);

  if (loading) return <div className="card p-6"><div className="skeleton h-64" /></div>;
  if (err || !r) return <div className="card"><LoadError message={err} onRetry={() => nav(-1)} /></div>;

  return (
    <div>
      <div className="flex gap-2 mb-4 no-print">
        <button className="btn btn-ghost btn-sm" onClick={() => nav(-1)}><ArrowLeft size={15} /> Back</button>
        <button className="btn btn-primary btn-sm ml-auto" onClick={() => window.print()}><Printer size={15} /> Print</button>
      </div>
      <div className="print-doc rounded-2xl border p-8 sm:p-10 max-w-3xl mx-auto shadow-sm">
        <DocHead title="OPD Prescription" />
        <div className="grid sm:grid-cols-2 gap-4 text-sm mb-5">
          <div><span className="text-slate-500">Patient: </span><span className="font-bold">{r.patient?.name}</span> <span className="text-slate-500">· {r.patient?.age}y {r.patient?.gender}</span></div>
          <div className="sm:text-right"><span className="text-slate-500">Date: </span><span className="font-bold">{fmtDate((r.created_at || '').slice(0, 10))}</span></div>
          <div><span className="text-slate-500">Doctor: </span><span className="font-bold">{r.doctor_name}</span></div>
          {r.diagnosis && <div className="sm:text-right"><span className="text-slate-500">Diagnosis: </span><span className="font-bold">{r.diagnosis}</span></div>}
        </div>
        <div className="font-display text-3xl mb-2">℞</div>
        <table className="w-full text-sm border-t border-b border-slate-200">
          <thead><tr className="text-left text-[11px] uppercase tracking-wider text-slate-500"><th className="py-2">Medicine</th><th>Dose</th><th>Frequency</th><th>Duration</th></tr></thead>
          <tbody>
            {(r.items || []).map((it: any, i: number) => (
              <tr key={i} className="border-t border-slate-100"><td className="py-2.5 font-bold">{i + 1}. {it.medicine}</td><td>{it.dose}</td><td>{it.frequency}</td><td>{it.duration}</td></tr>
            ))}
          </tbody>
        </table>
        {r.instructions && <div className="text-sm mt-4"><span className="font-bold">Instructions: </span>{r.instructions}</div>}
        <div className="flex justify-between items-end mt-10 text-sm">
          <div className="text-slate-500 text-xs max-w-[240px]">This is a system-generated prescription from AbhiShree Hospital. Follow dosage as directed.</div>
          <div className="text-center"><div className="font-display italic text-lg">{r.doctor_name}</div><div className="text-xs text-slate-500 border-t border-slate-300 pt-1 mt-6 px-6">Doctor's signature</div></div>
        </div>
      </div>
    </div>
  );
}

export function InvoiceDoc() {
  const { id } = useParams();
  const nav = useNavigate();
  const [inv, setInv] = useState<any>(null);
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const all = await get('/api/invoices');
        const found = (Array.isArray(all) ? all : []).find((x: any) => String(x.id) === String(id));
        if (!found) throw new Error('Invoice not found.');
        setInv(found);
      } catch (e: any) { setErr(e.message); }
      setLoading(false);
    })();
  }, [id]);

  if (loading) return <div className="card p-6"><div className="skeleton h-64" /></div>;
  if (err || !inv) return <div className="card"><LoadError message={err} onRetry={() => nav(-1)} /></div>;
  const inr = (n: any) => '₹' + Number(n || 0).toLocaleString('en-IN');

  return (
    <div>
      <div className="flex gap-2 mb-4 no-print">
        <button className="btn btn-ghost btn-sm" onClick={() => nav(-1)}><ArrowLeft size={15} /> Back</button>
        <button className="btn btn-primary btn-sm ml-auto" onClick={() => window.print()}><Printer size={15} /> Print</button>
      </div>
      <div className="print-doc rounded-2xl border p-8 sm:p-10 max-w-3xl mx-auto shadow-sm">
        <DocHead title="Patient Invoice" />
        <div className="grid sm:grid-cols-3 gap-4 text-sm mb-5">
          <div><div className="text-[11px] uppercase tracking-wider text-slate-500 font-bold">Billed to</div><div className="font-bold mt-0.5">{inv.patient?.name}</div><div className="text-slate-500 text-[13px]">{inv.patient?.phone}</div></div>
          <div><div className="text-[11px] uppercase tracking-wider text-slate-500 font-bold">Invoice no.</div><div className="font-bold mt-0.5 font-mono">{inv.invoice_number}</div></div>
          <div className="sm:text-right"><div className="text-[11px] uppercase tracking-wider text-slate-500 font-bold">Date</div><div className="font-bold mt-0.5">{fmtDate(inv.invoice_date || (inv.created_at || '').slice(0, 10))}</div><div className="mt-1 inline-block text-xs font-bold px-2.5 py-1 rounded-full bg-slate-100">{inv.status}</div></div>
        </div>
        <table className="w-full text-sm border-t border-b border-slate-200">
          <thead><tr className="text-left text-[11px] uppercase tracking-wider text-slate-500"><th className="py-2">Service</th><th>Description</th><th className="text-right">Amount</th></tr></thead>
          <tbody>
            {(inv.items || []).map((it: any, i: number) => (
              <tr key={i} className="border-t border-slate-100"><td className="py-2.5 text-slate-500">{it.category}</td><td className="font-semibold">{it.description}</td><td className="text-right font-semibold">{inr(it.amount)}</td></tr>
            ))}
          </tbody>
        </table>
        <div className="flex justify-end mt-4">
          <div className="w-64 text-sm space-y-1.5">
            <div className="flex justify-between"><span className="text-slate-500">Subtotal</span><span className="font-semibold">{inr(inv.subtotal)}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Discount</span><span className="font-semibold">− {inr(inv.discount)}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Tax</span><span className="font-semibold">{inr(inv.tax)}</span></div>
            <div className="flex justify-between text-base border-t border-slate-200 pt-2"><span className="font-bold">Total</span><span className="font-bold">{inr(inv.total)}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Paid</span><span className="font-semibold text-emerald-700">{inr(inv.paid)}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Balance</span><span className="font-bold text-red-700">{inr(inv.balance)}</span></div>
          </div>
        </div>
        <div className="text-xs text-slate-500 mt-8 text-center">Thank you for choosing AbhiShree Hospital · This is a computer-generated invoice.</div>
      </div>
    </div>
  );
}

export function LabReportDoc() {
  const { id } = useParams();
  const nav = useNavigate();
  const [t, setT] = useState<any>(null);
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const all = await get('/api/lab');
        const found = (Array.isArray(all) ? all : []).find((x: any) => String(x.id) === String(id));
        if (!found) throw new Error('Report not found.');
        setT(found);
      } catch (e: any) { setErr(e.message); }
      setLoading(false);
    })();
  }, [id]);

  if (loading) return <div className="card p-6"><div className="skeleton h-64" /></div>;
  if (err || !t) return <div className="card"><LoadError message={err} onRetry={() => nav(-1)} /></div>;

  return (
    <div>
      <div className="flex gap-2 mb-4 no-print">
        <button className="btn btn-ghost btn-sm" onClick={() => nav(-1)}><ArrowLeft size={15} /> Back</button>
        <button className="btn btn-primary btn-sm ml-auto" onClick={() => window.print()}><Printer size={15} /> Print</button>
      </div>
      <div className="print-doc rounded-2xl border p-8 sm:p-10 max-w-3xl mx-auto shadow-sm">
        <DocHead title="Laboratory Report" />
        <div className="grid sm:grid-cols-2 gap-4 text-sm mb-5">
          <div><span className="text-slate-500">Patient: </span><span className="font-bold">{t.patient?.name}</span> <span className="text-slate-500">· {t.patient?.age}y {t.patient?.gender}</span></div>
          <div className="sm:text-right"><span className="text-slate-500">Reported: </span><span className="font-bold">{fmtDate(t.result_date || t.ordered_date)}</span></div>
          <div><span className="text-slate-500">Test: </span><span className="font-bold">{t.test_name}</span></div>
          <div className="sm:text-right"><span className="text-slate-500">Ordered by: </span><span className="font-bold">{t.ordered_by || '—'}</span></div>
        </div>
        <div className="rounded-xl bg-slate-50 border border-slate-200 p-5">
          <div className="text-[11px] uppercase tracking-wider text-slate-500 font-bold mb-2">Result</div>
          <div className="text-[15px] font-semibold leading-relaxed whitespace-pre-wrap">{t.result || 'Awaiting verification.'}</div>
        </div>
        <div className="flex justify-between items-end mt-10 text-sm">
          <div className="text-slate-500 text-xs max-w-[260px]">Verified by the Department of Pathology, AbhiShree Hospital. Please correlate clinically.</div>
          <div className="text-center"><div className="text-xs text-slate-500 border-t border-slate-300 pt-1 mt-8 px-8">Authorised signatory</div></div>
        </div>
      </div>
    </div>
  );
}
