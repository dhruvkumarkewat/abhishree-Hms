import supabase from './db-client.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();
  try {
    const date = req.query?.date || new Date().toISOString().slice(0, 10);
    const [patients, appointments, admissions, beds, invoices, labs, prescriptions, emergency, medicines, doctors, radiology] = await Promise.all([
      supabase.from('patients').select('id,registration_date,status'),
      supabase.from('appointments').select('id,date,status,department'),
      supabase.from('admissions').select('id,status,admission_date,discharge_date'),
      supabase.from('beds').select('id,status,category'),
      supabase.from('invoices').select('id,total,paid,balance,status,created_at'),
      supabase.from('lab_tests').select('id,status'),
      supabase.from('prescriptions').select('id,status'),
      supabase.from('emergency_cases').select('id,status,triage_level'),
      supabase.from('medicines').select('id,stock_quantity,reorder_level,expiry_date'),
      supabase.from('doctors').select('id,status'),
      supabase.from('radiology').select('id,status'),
    ]);
    const P = patients.data || [];
    const A = appointments.data || [];
    const AD = admissions.data || [];
    const B = beds.data || [];
    const I = invoices.data || [];
    const L = labs.data || [];
    const RX = prescriptions.data || [];
    const E = emergency.data || [];
    const M = medicines.data || [];
    const todayAppts = A.filter((a) => a.date === date);
    const totalRevenue = I.reduce((s, r) => s + Number(r.paid || 0), 0);
    const pendingBills = I.filter((r) => r.status !== 'Paid').length;
    const pendingAmount = I.reduce((s, r) => s + Number(r.balance || 0), 0);
    const occupied = B.filter((b) => b.status === 'Occupied').length;
    const byCategory = {};
    B.forEach((b) => {
      byCategory[b.category] = byCategory[b.category] || { total: 0, occupied: 0 };
      byCategory[b.category].total += 1;
      if (b.status === 'Occupied') byCategory[b.category].occupied += 1;
    });
    const deptLoad = {};
    todayAppts.forEach((a) => { deptLoad[a.department || 'General'] = (deptLoad[a.department || 'General'] || 0) + 1; });
    const apptStatus = {};
    todayAppts.forEach((a) => { apptStatus[a.status] = (apptStatus[a.status] || 0) + 1; });
    const last7 = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(date);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      last7.push({ date: key, label: d.toLocaleDateString('en-IN', { weekday: 'short' }), appointments: A.filter((a) => a.date === key).length });
    }
    const alerts = [];
    const icu = byCategory['ICU'];
    if (icu && icu.total && icu.occupied / icu.total >= 0.8) alerts.push({ level: 'danger', text: `ICU at ${Math.round((icu.occupied / icu.total) * 100)}% occupancy` });
    const lowStock = M.filter((m) => Number(m.stock_quantity) <= Number(m.reorder_level));
    if (lowStock.length) alerts.push({ level: 'warning', text: `${lowStock.length} medicines below reorder level` });
    const pendingLabs = L.filter((l) => !['Completed', 'Verified'].includes(l.status)).length;
    if (pendingLabs) alerts.push({ level: 'info', text: `${pendingLabs} lab reports awaiting processing / verification` });
    const activeEmerg = E.filter((e) => !['Discharged', 'Admitted', 'Resolved'].includes(e.status)).length;
    if (activeEmerg) alerts.push({ level: 'danger', text: `${activeEmerg} active emergency cases need attention` });
    return res.status(200).json({
      date,
      kpis: {
        totalPatients: P.length,
        todayAppointments: todayAppts.length,
        activeAdmissions: AD.filter((a) => a.status === 'Admitted').length,
        availableBeds: B.length - occupied,
        totalBeds: B.length,
        occupancyRate: B.length ? Math.round((occupied / B.length) * 100) : 0,
        emergencyActive: activeEmerg,
        todayRevenue: totalRevenue,
        pendingBills,
        pendingAmount,
        pendingLabs,
        pendingPrescriptions: RX.filter((r) => r.status === 'Pending').length,
        doctorsAvailable: (doctors.data || []).filter((d) => d.status === 'Available').length,
        pendingRadiology: (radiology.data || []).filter((r) => r.status !== 'Reported').length,
      },
      todayOps: {
        appointments: todayAppts.length,
        admissions: AD.filter((a) => a.admission_date === date).length,
        discharges: AD.filter((a) => a.discharge_date === date).length,
        emergency: activeEmerg,
      },
      apptStatus,
      deptLoad,
      bedByCategory: byCategory,
      weeklyTrend: last7,
      alerts,
    });
  } catch (err) {
    console.error('API error (dashboard):', err);
    res.status(500).json({ error: err.message });
  }
}
