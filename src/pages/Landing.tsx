import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import {
  ArrowRight, ShieldCheck, CalendarCheck, FlaskConical, Pill, BedDouble,
  Siren, Receipt, HeartPulse, ChevronDown, Phone, MapPin, Stethoscope,
  ClipboardList, Bell, Lock, FileText, Play,
} from 'lucide-react';
import Logo from '../components/Logo';
import { Reveal, CountUp, TiltCard, JourneyStory, HallwayWalk, DeptCard } from '../components/Story3D';

function Nav() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40);
    fn();
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);
  return (
    <header className={`fixed top-0 inset-x-0 z-50 transition-all duration-500 ${scrolled ? 'bg-ink-950/85 backdrop-blur-md border-b border-white/10 py-3' : 'bg-transparent py-5'}`}>
      <div className="max-w-7xl mx-auto px-5 sm:px-8 flex items-center justify-between">
        <Link to="/"><Logo light /></Link>
        <nav className="hidden lg:flex items-center gap-8 text-[14px] font-medium text-white/75">
          <a href="#journey" className="hover:text-white transition-colors">Patient journey</a>
          <a href="#departments" className="hover:text-white transition-colors">Departments</a>
          <a href="#hospital" className="hover:text-white transition-colors">Inside the hospital</a>
          <a href="#security" className="hover:text-white transition-colors">Security</a>
        </nav>
        <div className="flex items-center gap-3">
          <a href="tel:+911800123456" className="hidden md:flex items-center gap-2 text-white/80 text-sm font-semibold hover:text-white">
            <Phone size={15} /> 1800 123 456
          </a>
          <Link to="/login" className="btn btn-sm !bg-white !text-ink-950 hover:!bg-med-100 font-bold">Access Hospital Portal <ArrowRight size={15} /></Link>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], ['0%', '22%']);
  const opacity = useTransform(scrollYProgress, [0, 0.85], [1, 0]);

  return (
    <div ref={ref} className="relative min-h-[108vh] flex items-end overflow-hidden bg-ink-950">
      <motion.div style={{ y }} className="absolute inset-0">
        <video autoPlay muted loop playsInline poster="/media/building.jpg" className="w-full h-full object-cover">
          <source src="/media/hero-hospital.mp4" type="video/mp4" />
          <source src="/media/hero-team.mp4" type="video/mp4" />
        </video>
      </motion.div>
      <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(7,17,28,.62) 0%, rgba(7,17,28,.25) 40%, rgba(7,17,28,.88) 82%, #0b1c2c 100%)' }} />

      <motion.div style={{ opacity }} className="relative z-10 w-full max-w-7xl mx-auto px-5 sm:px-8 pb-28 pt-40">
        <motion.div initial={{ opacity: 0, y: 26 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}>
          <div className="flex items-center gap-3 mb-6">
            <span className="w-10 h-[2px] bg-teal-400 inline-block" />
            <span className="eyebrow text-teal-300">AbhiShree Hospital · Hospital Management System</span>
          </div>
          <h1 className="font-display text-white text-[13vw] sm:text-7xl lg:text-[92px] leading-[0.98] tracking-tight max-w-4xl text-balance">
            Healthcare, connected around <em className="not-italic text-teal-300">you.</em>
          </h1>
          <p className="text-white/70 text-lg mt-6 max-w-xl leading-relaxed">
            AbhiShree Hospital brings patient care, clinical services and hospital operations together through one secure digital platform.
          </p>
          <div className="flex flex-wrap gap-3 mt-9">
            <Link to="/login" className="btn !bg-white !text-ink-950 hover:!bg-med-100 !px-7 !py-3.5 !text-[15px] font-bold">
              Access Hospital Portal <ArrowRight size={17} />
            </Link>
            <a href="#journey" className="btn !bg-white/10 !text-white border !border-white/25 backdrop-blur hover:!bg-white/20 !px-7 !py-3.5 !text-[15px] font-semibold">
              <Play size={16} /> Watch the journey
            </a>
          </div>
        </motion.div>

        {/* hero stat strip */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="mt-14 grid grid-cols-2 md:grid-cols-4 gap-px bg-white/15 rounded-2xl overflow-hidden border border-white/15 max-w-3xl"
        >
          {[
            { v: 240, s: '+', l: 'Beds, one live map' },
            { v: 48, s: '', l: 'Specialist doctors' },
            { v: 9, s: '', l: 'Clinical departments' },
            { v: 24, s: '×7', l: 'Emergency & ICU' },
          ].map((st) => (
            <div key={st.l} className="bg-ink-950/60 backdrop-blur px-5 py-4">
              <div className="font-display text-3xl text-white"><CountUp to={st.v} suffix={st.s} /></div>
              <div className="text-white/55 text-xs mt-1 font-medium">{st.l}</div>
            </div>
          ))}
        </motion.div>
      </motion.div>

      <motion.a href="#journey" style={{ opacity }} className="absolute bottom-24 right-6 sm:right-10 z-10 hidden md:flex flex-col items-center gap-2 text-white/50 hover:text-white transition-colors" aria-label="Scroll to journey">
        <span className="text-[11px] font-bold tracking-[.2em] uppercase" style={{ writingMode: 'vertical-rl' }}>Scroll</span>
        <ChevronDown size={18} className="animate-bounce" />
      </motion.a>

      {/* ECG pulse line */}
      <div className="absolute bottom-0 inset-x-0 z-10 opacity-40">
        <svg viewBox="0 0 1200 60" preserveAspectRatio="none" className="w-full h-[54px]">
          <path className="ecg" d="M0 32 H420 L440 32 L452 12 L464 50 L476 32 H640 L652 32 L660 24 L668 32 H1200" fill="none" stroke="#5fd8cc" strokeWidth="2" />
        </svg>
      </div>
    </div>
  );
}

function ConnectedStrip() {
  const items = [
    { icon: <CalendarCheck size={20} />, t: 'OPD & Appointments', d: 'Tokens, queues and doctor schedules in real time.' },
    { icon: <FlaskConical size={20} />, t: 'Laboratory', d: 'Ordered → sampled → verified → reported.' },
    { icon: <Pill size={20} />, t: 'Pharmacy', d: 'Prescriptions flow straight to the counter.' },
    { icon: <BedDouble size={20} />, t: 'IPD & Beds', d: 'Admissions, transfers and discharge, visualised.' },
    { icon: <Siren size={20} />, t: 'Emergency', d: 'Triage-coded cases with live capacity.' },
    { icon: <Receipt size={20} />, t: 'Billing & Insurance', d: 'One invoice, claims tracked to settlement.' },
  ];
  return (
    <section className="bg-ink-950 py-24 sm:py-28 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <div className="grid lg:grid-cols-[1fr_1.4fr] gap-10 items-end mb-14">
          <Reveal>
            <div className="eyebrow text-teal-300 mb-4">One connected hospital</div>
            <h2 className="font-display text-white text-4xl sm:text-5xl leading-[1.05] text-balance">Every department reads from the same page.</h2>
          </Reveal>
          <Reveal delay={0.12}>
            <p className="text-white/60 leading-relaxed max-w-xl lg:ml-auto">
              When reception registers a patient, the doctor, lab, pharmacy and billing desk all see the same record instantly.
              Nothing is re-typed. Nothing is lost between counters.
            </p>
          </Reveal>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((it, i) => (
            <Reveal key={it.t} delay={(i % 3) * 0.08}>
              <TiltCard max={6} className="rounded-2xl bg-white/[0.05] border border-white/10 p-6 h-full hover:bg-white/[0.08] transition-colors">
                <div className="w-11 h-11 rounded-xl bg-teal-400/15 text-teal-300 flex items-center justify-center mb-4">{it.icon}</div>
                <div className="text-white font-bold text-[16px]">{it.t}</div>
                <p className="text-white/55 text-sm mt-1.5 leading-relaxed">{it.d}</p>
              </TiltCard>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function CareSplit() {
  return (
    <section className="paper py-24 sm:py-32">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          <div className="relative">
            <Reveal>
              <TiltCard className="rounded-2xl overflow-hidden shadow-2xl">
                <img src="/media/consultation.jpg" alt="Doctor consulting a patient" className="w-full h-[420px] sm:h-[520px] object-cover" loading="lazy" />
              </TiltCard>
            </Reveal>
            <Reveal delay={0.2} className="absolute -bottom-8 -right-2 sm:right-8">
              <div className="card !rounded-2xl p-5 shadow-xl w-[240px]">
                <div className="flex items-center gap-2 text-emerald-600 text-xs font-bold uppercase tracking-wider"><HeartPulse size={15} /> Live vitals</div>
                <div className="mt-2 flex items-end gap-1.5">
                  <span className="font-display text-4xl">72</span>
                  <span className="text-sm opacity-60 mb-1">bpm · stable</span>
                </div>
                <svg viewBox="0 0 200 44" className="w-full h-10 mt-2">
                  <path className="ecg" d="M0 24 H60 L70 24 L78 8 L86 38 L94 24 H140 L148 24 L154 16 L160 24 H200" fill="none" stroke="#0d9488" strokeWidth="2" />
                </svg>
              </div>
            </Reveal>
          </div>
          <div>
            <Reveal>
              <div className="eyebrow text-med-600 dark:text-teal-300 mb-4">Clinical care</div>
              <h2 className="font-display text-4xl sm:text-[54px] leading-[1.02] tracking-tight text-balance">Built around the bedside, not the spreadsheet.</h2>
              <p className="mt-5 text-[16px] leading-relaxed opacity-70">
                Doctors consult with full history beside them. Nurses record vitals and medications in seconds.
                Lab and pharmacy work from the same orders — so care moves at the speed of need.
              </p>
            </Reveal>
            <div className="mt-8 space-y-5">
              {[
                { icon: <Stethoscope size={18} />, t: 'Doctor workspace', d: 'Queue, consultation notes, prescriptions, lab orders and discharge summaries.' },
                { icon: <ClipboardList size={18} />, t: 'Nursing station', d: 'Assigned patients, vitals, medication rounds and escalation flags.' },
                { icon: <FileText size={18} />, t: 'Electronic records', d: 'A chronological medical timeline for every patient — allergies to reports.' },
              ].map((r, i) => (
                <Reveal key={r.t} delay={0.1 + i * 0.08}>
                  <div className="flex gap-4 items-start">
                    <div className="w-10 h-10 rounded-xl bg-ink-900 dark:bg-sky-900 text-white flex items-center justify-center shrink-0">{r.icon}</div>
                    <div>
                      <div className="font-bold">{r.t}</div>
                      <div className="text-sm opacity-60 mt-0.5">{r.d}</div>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
            <Reveal delay={0.3}>
              <Link to="/login" className="btn btn-dark mt-9 !px-6 !py-3">Open a role workspace <ArrowRight size={16} /></Link>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}

function Departments() {
  const depts = [
    { image: '/media/emergency.jpg', dept: 'Emergency', title: 'Triage that thinks fast', desc: 'Priority-coded arrivals, live bed and doctor availability, observation tracking.' },
    { image: '/media/icu.jpg', dept: 'ICU', title: 'Critical care monitoring', desc: 'Vitals flow, medication schedules and escalation flags for every critical bed.' },
    { image: '/media/lab.jpg', dept: 'Laboratory', title: 'From sample to report', desc: 'Order tracking, result entry, verification and instant doctor access.' },
    { image: '/media/pharmacy.jpg', dept: 'Pharmacy', title: 'Stock-aware dispensing', desc: 'Prescriptions matched to inventory with low-stock and expiry alerts.' },
    { image: '/media/radiology.jpg', dept: 'Radiology', title: 'Imaging, scheduled', desc: 'X-ray, CT, MRI and ultrasound requests with reporting workflow.' },
    { image: '/media/ward.jpg', dept: 'Wards', title: 'Beds you can see', desc: 'A live visual map of ICU, general, private, pediatric and maternity beds.' },
  ];
  return (
    <section id="departments" className="py-24 sm:py-32 bg-[#eef2f7] dark:bg-[#081322]">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <Reveal>
            <div className="eyebrow text-med-600 dark:text-teal-300 mb-4">Departments</div>
            <h2 className="font-display text-4xl sm:text-[54px] leading-[1.02] tracking-tight text-balance">Nine departments. One pulse.</h2>
            <p className="mt-4 opacity-60 leading-relaxed">Each module is designed with the people who use it every day — hover to feel the depth.</p>
          </Reveal>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {depts.map((d, i) => (
            <DeptCard key={d.title} image={d.image} dept={d.dept} title={d.title} desc={d.desc} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

function OpsNumbers() {
  const ops = [
    { v: 1200, s: '+', l: 'Outpatients every day' },
    { v: 98, s: '%', l: 'Reports delivered on time' },
    { v: 15, s: ' min', l: 'Average OPD waiting time' },
    { v: 40, s: '+', l: 'Insurance partners' },
  ];
  return (
    <section className="py-24 sm:py-28 paper border-y hairline">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <div className="grid lg:grid-cols-[1fr_1fr] gap-12 items-center">
          <Reveal>
            <div className="eyebrow text-med-600 dark:text-teal-300 mb-4">Hospital operations</div>
            <h2 className="font-display text-4xl sm:text-[54px] leading-[1.02] tracking-tight text-balance">The quiet machinery behind calm corridors.</h2>
            <p className="mt-5 opacity-70 leading-relaxed max-w-md">Beds, appointments, emergency load, billing and inventory — watched on one operations view, so small problems never become waiting-room problems.</p>
            <Link to="/login" className="btn btn-ghost mt-7">See the operations dashboard <ArrowRight size={16} /></Link>
          </Reveal>
          <div className="grid grid-cols-2 gap-4">
            {ops.map((o, i) => (
              <Reveal key={o.l} delay={i * 0.08}>
                <div className="card p-6 !rounded-2xl">
                  <div className="font-display text-4xl sm:text-5xl text-ink-900 dark:text-white"><CountUp to={o.v} suffix={o.s} /></div>
                  <div className="text-sm opacity-60 mt-2 font-medium">{o.l}</div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function Security() {
  const pts = [
    { icon: <Lock size={18} />, t: 'Role-based access', d: 'Doctors see clinical records; accountants see billing. Every login opens only what that role needs.' },
    { icon: <Bell size={18} />, t: 'Audit trail', d: 'Every record change is logged — who did what, when, and in which module.' },
    { icon: <ShieldCheck size={18} />, t: 'Patient privacy first', d: 'Patients see only their own reports, prescriptions and bills. Nothing more.' },
  ];
  return (
    <section id="security" className="bg-ink-950 py-24 sm:py-32 relative overflow-hidden">
      <img src="/media/surgery.jpg" alt="" className="absolute inset-0 w-full h-full object-cover opacity-[0.1]" loading="lazy" />
      <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg,#0b1c2c 0%,rgba(11,28,44,.75) 50%,#0b1c2c 100%)' }} />
      <div className="relative max-w-7xl mx-auto px-5 sm:px-8 grid lg:grid-cols-2 gap-12 items-center">
        <Reveal>
          <div className="eyebrow text-teal-300 mb-4">Security & trust</div>
          <h2 className="font-display text-white text-4xl sm:text-[54px] leading-[1.02] text-balance">A hospital runs on trust. So does its software.</h2>
          <p className="text-white/60 mt-5 leading-relaxed max-w-md">Secure sign-in, role-scoped workspaces and a complete audit log keep patient data protected and every action accountable.</p>
        </Reveal>
        <div className="space-y-4">
          {pts.map((p, i) => (
            <Reveal key={p.t} delay={i * 0.1}>
              <div className="flex gap-4 bg-white/[0.05] border border-white/10 rounded-2xl p-5 backdrop-blur">
                <div className="w-10 h-10 rounded-xl bg-teal-400/15 text-teal-300 flex items-center justify-center shrink-0">{p.icon}</div>
                <div>
                  <div className="text-white font-bold">{p.t}</div>
                  <div className="text-white/55 text-sm mt-1 leading-relaxed">{p.d}</div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section className="relative py-28 sm:py-36 overflow-hidden">
      <img src="/media/building.jpg" alt="AbhiShree Hospital at night" className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
      <div className="absolute inset-0 bg-ink-950/78" />
      <div className="relative max-w-4xl mx-auto px-5 text-center">
        <Reveal>
          <div className="eyebrow text-teal-300 mb-5">Begin here</div>
          <h2 className="font-display text-white text-4xl sm:text-6xl leading-[1.02] text-balance">Step inside AbhiShree Hospital.</h2>
          <p className="text-white/65 mt-5 max-w-xl mx-auto leading-relaxed">Eight role workspaces — admin, doctor, nurse, reception, pharmacy, lab, accounts and patient — each opening onto the same live hospital.</p>
          <div className="flex flex-wrap justify-center gap-3 mt-9">
            <Link to="/login" className="btn !bg-white !text-ink-950 hover:!bg-med-100 !px-8 !py-3.5 !text-[15px] font-bold">Access Hospital Portal <ArrowRight size={17} /></Link>
          </div>
          <div className="mt-8 flex items-center justify-center gap-2 text-white/50 text-sm">
            <MapPin size={14} /> 14 Health Avenue, Bengaluru · <Phone size={14} className="ml-2" /> Emergency: 1800 123 456
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="bg-[#071120] text-white/55 py-12 border-t border-white/10">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-3">
          <Logo light />
          <span className="text-xs leading-relaxed">Connected care.<br />Simplified hospital operations.</span>
        </div>
        <div className="flex flex-wrap gap-x-8 gap-y-2 text-sm font-medium">
          <a href="#journey" className="hover:text-white">Patient journey</a>
          <a href="#departments" className="hover:text-white">Departments</a>
          <a href="#hospital" className="hover:text-white">Inside the hospital</a>
          <Link to="/login" className="hover:text-white">Staff sign in</Link>
        </div>
        <div className="text-xs">© 2026 AbhiShree Hospital · Hospital Management System</div>
      </div>
    </footer>
  );
}

export default function Landing() {
  const nav = useNavigate();
  useEffect(() => {
    const hash = window.location.hash || '';
    const search = window.location.search || '';
    if (hash.includes('type=recovery') || search.includes('type=recovery')) {
      nav('/reset-password' + hash + (search && !hash.includes(search) ? search : ''), { replace: true });
    }
  }, [nav]);

  return (
    <div className="grain bg-ink-950">
      <Nav />
      <Hero />
      <div id="journey" className="scroll-mt-0"><JourneyStory /></div>
      <ConnectedStrip />
      <div id="hospital" className="scroll-mt-0"><HallwayWalk /></div>
      <CareSplit />
      <Departments />
      <OpsNumbers />
      <Security />
      <CTA />
      <Footer />
    </div>
  );
}
