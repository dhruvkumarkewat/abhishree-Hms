import { useEffect, useRef, useState, type ReactNode, type MouseEvent } from 'react';
import { motion, useScroll, useTransform, useSpring, useInView, useMotionValueEvent, AnimatePresence, type MotionValue } from 'framer-motion';
import { ArrowRight, ArrowUpRight } from 'lucide-react';

/* ================= Scroll reveal wrapper ================= */
export function Reveal({ children, delay = 0, y = 28, className = '' }: { children: ReactNode; delay?: number; y?: number; className?: string }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.9, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

/* ================= Mouse-tilt 3D card ================= */
export function TiltCard({ children, className = '', max = 9 }: { children: ReactNode; className?: string; max?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [t, setT] = useState({ rx: 0, ry: 0, gx: 50, gy: 50 });
  const reduced = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const onMove = (e: MouseEvent) => {
    if (reduced || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    setT({ rx: (0.5 - py) * max * 2, ry: (px - 0.5) * max * 2, gx: px * 100, gy: py * 100 });
  };

  return (
    <div className="perspective-1200">
      <div
        ref={ref}
        onMouseMove={onMove}
        onMouseLeave={() => setT({ rx: 0, ry: 0, gx: 50, gy: 50 })}
        className={`tilt-card relative ${className}`}
        style={{ transform: `rotateX(${t.rx}deg) rotateY(${t.ry}deg)` }}
      >
        {children}
        <div
          className="pointer-events-none absolute inset-0 rounded-[inherit] transition-opacity duration-500"
          style={{ background: `radial-gradient(circle at ${t.gx}% ${t.gy}%, rgba(255,255,255,.16), transparent 60%)`, opacity: t.rx === 0 && t.ry === 0 ? 0 : 1 }}
        />
      </div>
    </div>
  );
}

/* ================= Animated counter ================= */
export function CountUp({ to, suffix = '', duration = 1.8 }: { to: number; suffix?: string; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!inView) return;
    let raf = 0;
    const t0 = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / (duration * 1000));
      const eased = 1 - Math.pow(1 - p, 4);
      setVal(Math.round(to * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, to, duration]);
  return <span ref={ref}>{val.toLocaleString('en-IN')}{suffix}</span>;
}

/* ================= PATIENT JOURNEY — 3D scroll carousel ================= */
export interface JourneyStep {
  kicker: string;
  title: string;
  desc: string;
  image: string;
  meta: string;
}

export const JOURNEY_STEPS: JourneyStep[] = [
  { kicker: 'Step 01 · Arrival', title: 'Registration in minutes', desc: 'The front desk registers every patient once — ID, contact, insurance — and that single record follows them across OPD, labs, pharmacy and billing.', image: '/media/reception.jpg', meta: 'Front desk · 2 min average' },
  { kicker: 'Step 02 · OPD', title: 'Appointment & queue token', desc: 'Patients pick a department and doctor. Live tokens and waiting times keep the OPD floor calm instead of chaotic.', image: '/media/consultation.jpg', meta: 'OPD · Live queue' },
  { kicker: 'Step 03 · Diagnosis', title: 'Consultation with context', desc: 'Doctors open the full record — history, allergies, past visits — and capture diagnosis, notes and follow-ups in one screen.', image: '/media/doctor-portrait.jpg', meta: 'Doctor workspace' },
  { kicker: 'Step 04 · Testing', title: 'Labs & imaging, ordered once', desc: 'Tests flow straight to the laboratory queue; scans to radiology. No paper slips, no lost requests, no repeat entry.', image: '/media/lab.jpg', meta: 'Pathology · Radiology' },
  { kicker: 'Step 05 · Treatment', title: 'Care across every ward', desc: 'From day-care procedures to surgery and ICU, vitals, medication and nursing notes stay linked to the same patient file.', image: '/media/surgery.jpg', meta: 'OT · ICU · Wards' },
  { kicker: 'Step 06 · Pharmacy', title: 'Prescription to counter', desc: 'The doctor\'s prescription lands at the dispensary instantly — checked against stock, billed, and handed over with instructions.', image: '/media/pharmacy.jpg', meta: 'Dispensary' },
  { kicker: 'Step 07 · Home', title: 'Bill, discharge, follow-up', desc: 'One consolidated invoice, a printed discharge summary, and a scheduled follow-up. The patient leaves; the record stays ready.', image: '/media/building.jpg', meta: 'Billing · Discharge' },
];

function JourneyCard({ progress, index, total, step }: { progress: MotionValue<number>; index: number; total: number; step: JourneyStep }) {
  const x = useTransform(progress, (p) => {
    const f = p * (total - 1);
    return (index - f) * 130;
  });
  const z = useTransform(progress, (p) => {
    const f = p * (total - 1);
    return -Math.abs(index - f) * 220;
  });
  const rotateY = useTransform(progress, (p) => {
    const f = p * (total - 1);
    const d = index - f;
    return Math.max(-38, Math.min(38, d * -14));
  });
  const opacity = useTransform(progress, (p) => {
    const f = p * (total - 1);
    const d = Math.abs(index - f);
    return d > 2.2 ? 0 : 1 - d * 0.34;
  });
  const scale = useTransform(progress, (p) => {
    const f = p * (total - 1);
    return 1 - Math.min(0.25, Math.abs(index - f) * 0.09);
  });

  return (
    <motion.div
      className="absolute left-1/2 top-1/2 w-[min(520px,78vw)] backface-hidden"
      style={{ x, z, rotateY, opacity, scale, marginLeft: 'min(-260px,-39vw)', marginTop: -190, transformPerspective: 1400 }}
    >
      <div className="rounded-2xl overflow-hidden shadow-[0_40px_90px_rgba(7,17,28,.5)] border border-white/20 bg-ink-950">
        <div className="relative h-[300px] sm:h-[340px]">
          <img src={step.image} alt={step.title} className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(7,17,28,.82), transparent 55%)' }} />
          <div className="absolute top-4 left-4 text-[11px] font-bold tracking-[.18em] uppercase bg-white/15 backdrop-blur-md text-white px-3 py-1.5 rounded-full border border-white/25">
            {step.kicker}
          </div>
          <div className="absolute bottom-0 left-0 right-0 p-5">
            <div className="font-display text-2xl text-white leading-tight">{step.title}</div>
            <div className="text-[13px] text-white/70 mt-1">{step.meta}</div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export function JourneyStory() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] });
  const smooth = useSpring(scrollYProgress, { stiffness: 80, damping: 26 });
  const [active, setActive] = useState(0);
  useMotionValueEvent(smooth, 'change', (v) => {
    setActive(Math.min(JOURNEY_STEPS.length - 1, Math.max(0, Math.round(v * (JOURNEY_STEPS.length - 1)))));
  });

  return (
    <div ref={ref} className="relative" style={{ height: '520vh' }}>
      <div className="hallway-frame bg-ink-950">
        {/* ambient backdrop */}
        <div className="absolute inset-0">
          <img src="/media/icu.jpg" alt="" className="w-full h-full object-cover opacity-[0.14] kenburns" />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg,#0b1c2c 0%,rgba(11,28,44,.4) 50%,#0b1c2c 100%)' }} />
        </div>

        <div className="relative z-10 h-full max-w-7xl mx-auto px-5 sm:px-8 grid lg:grid-cols-[400px_1fr] gap-8 items-center">
          {/* left: narrative */}
          <div className="order-2 lg:order-1 pb-24 lg:pb-0">
            <div className="eyebrow text-teal-300 mb-3">A patient's day at AbhiShree</div>
            <div className="min-h-[220px]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={active}
                  initial={{ opacity: 0, y: 26 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -18 }}
                  transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                >
                  <div className="font-display text-4xl sm:text-5xl text-white leading-[1.05] text-balance">
                    {JOURNEY_STEPS[active].title}
                  </div>
                  <p className="text-white/70 mt-4 leading-relaxed text-[15px]">{JOURNEY_STEPS[active].desc}</p>
                </motion.div>
              </AnimatePresence>
            </div>
            {/* progress rail */}
            <div className="mt-8 hidden lg:block">
              <div className="flex items-center gap-3">
                {JOURNEY_STEPS.map((s, i) => (
                  <div key={s.kicker} className="flex-1">
                    <div className={`h-[3px] rounded-full transition-all duration-500 ${i <= active ? 'bg-teal-400' : 'bg-white/15'}`} />
                    <div className={`chapter-dot mt-2 text-[11px] font-semibold ${i === active ? 'text-white' : 'text-white/35'}`}>
                      0{i + 1}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-5 text-white/50 text-sm">Keep scrolling — the story walks through the hospital with you.</div>
            </div>
            {/* mobile dots */}
            <div className="mt-6 flex gap-2 lg:hidden">
              {JOURNEY_STEPS.map((s, i) => (
                <div key={s.kicker} className={`h-1.5 rounded-full transition-all duration-500 ${i === active ? 'w-8 bg-teal-400' : 'w-1.5 bg-white/20'}`} />
              ))}
            </div>
          </div>

          {/* right: 3D card fan */}
          <div className="order-1 lg:order-2 relative h-[300px] sm:h-[380px] lg:h-[520px] perspective-2000 preserve-3d">
            {JOURNEY_STEPS.map((s, i) => (
              <JourneyCard key={s.kicker} progress={smooth} index={i} total={JOURNEY_STEPS.length} step={s} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ================= HALLWAY — walk-through zoom chapters ================= */
export interface HallChapter { dept: string; title: string; desc: string; image: string; stat: string; statLabel: string; }

export const HALL_CHAPTERS: HallChapter[] = [
  { dept: 'Emergency', title: 'The door that never closes', desc: 'Triage in seconds, priority-coded cases, and live bed + doctor availability — built for the fastest minutes in medicine.', image: '/media/emergency.jpg', stat: '24×7', statLabel: 'Trauma & triage desk' },
  { dept: 'ICU & Critical Care', title: 'Every heartbeat, watched', desc: 'Vitals, medication schedules and escalation notes stream into one monitoring view for nurses and intensivists.', image: '/media/icu.jpg', stat: '< 60s', statLabel: 'Critical escalation' },
  { dept: 'Surgery & OT', title: 'Precision, scheduled calmly', desc: 'Operation theatres, surgeon rosters and post-op beds planned together — no double-booking, no morning chaos.', image: '/media/surgery.jpg', stat: '6', statLabel: 'Modular operation theatres' },
  { dept: 'Wards & Recovery', title: 'Rest, with a safety net', desc: 'General, semi-private and private wards with live occupancy — transfers and discharges in a couple of clicks.', image: '/media/ward.jpg', stat: '240+', statLabel: 'Beds across the tower' },
];

export function HallwayWalk() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] });
  const smooth = useSpring(scrollYProgress, { stiffness: 70, damping: 24 });
  const [active, setActive] = useState(0);
  useMotionValueEvent(smooth, 'change', (v) => {
    setActive(Math.min(HALL_CHAPTERS.length - 1, Math.max(0, Math.floor(v * HALL_CHAPTERS.length))));
  });
  const scale = useTransform(smooth, [0, 1], [1, 1.28]);

  return (
    <div ref={ref} className="relative" style={{ height: '420vh' }}>
      <div className="hallway-frame bg-black">
        <motion.div className="absolute inset-0" style={{ scale }}>
          <AnimatePresence>
            <motion.img
              key={active}
              src={HALL_CHAPTERS[active].image}
              alt={HALL_CHAPTERS[active].dept}
              className="hallway-img"
              initial={{ opacity: 0, scale: 1.06 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.9, ease: 'easeOut' }}
            />
          </AnimatePresence>
        </motion.div>
        <div className="absolute inset-0 vignette" />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(7,17,28,.85) 0%, transparent 45%, rgba(7,17,28,.35) 100%)' }} />

        {/* side chapter rail */}
        <div className="absolute left-5 sm:left-10 top-1/2 -translate-y-1/2 z-20 hidden md:flex flex-col gap-5">
          {HALL_CHAPTERS.map((c, i) => (
            <div key={c.dept} className="flex items-center gap-3">
              <div className={`rounded-full transition-all duration-500 ${i === active ? 'w-2 h-10 bg-teal-400' : 'w-2 h-2 bg-white/30'}`} />
              <div className={`text-xs font-bold tracking-[.16em] uppercase transition-colors duration-500 ${i === active ? 'text-white' : 'text-white/35'}`}>{c.dept}</div>
            </div>
          ))}
        </div>

        {/* chapter text */}
        <div className="absolute inset-x-0 bottom-0 z-20 pb-14 sm:pb-20 px-5 sm:px-10">
          <div className="max-w-7xl mx-auto grid md:grid-cols-[1fr_220px] gap-8 items-end">
            <AnimatePresence mode="wait">
              <motion.div
                key={active}
                initial={{ opacity: 0, y: 34 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -22 }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              >
                <div className="eyebrow text-teal-300 mb-3">{String(active + 1).padStart(2, '0')} — {HALL_CHAPTERS[active].dept}</div>
                <h3 className="font-display text-white text-4xl sm:text-6xl leading-[1.02] text-balance max-w-2xl">{HALL_CHAPTERS[active].title}</h3>
                <p className="text-white/70 mt-4 max-w-xl leading-relaxed">{HALL_CHAPTERS[active].desc}</p>
              </motion.div>
            </AnimatePresence>
            <div className="hidden md:block text-right">
              <div className="font-display text-5xl text-white">{HALL_CHAPTERS[active].stat}</div>
              <div className="text-white/60 text-sm mt-1">{HALL_CHAPTERS[active].statLabel}</div>
            </div>
          </div>
          {/* mobile dots */}
          <div className="flex gap-2 mt-6 md:hidden max-w-7xl mx-auto">
            {HALL_CHAPTERS.map((c, i) => (
              <div key={c.dept} className={`h-1 rounded-full transition-all duration-500 ${i === active ? 'w-10 bg-teal-400' : 'w-4 bg-white/25'}`} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ================= Department 3D card ================= */
export function DeptCard({ image, dept, title, desc, index }: { image: string; dept: string; title: string; desc: string; index: number }) {
  return (
    <Reveal delay={(index % 3) * 0.1}>
      <TiltCard className="rounded-2xl overflow-hidden bg-white dark:bg-ink-900 border hairline group h-full">
        <div className="relative h-52 overflow-hidden">
          <img src={image} alt={title} className="w-full h-full object-cover transition-transform duration-[1.2s] ease-out group-hover:scale-110" loading="lazy" />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(11,28,44,.55), transparent 60%)' }} />
          <div className="absolute bottom-3 left-4 text-[11px] font-bold tracking-[.16em] uppercase text-white/90">{dept}</div>
          <div className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/15 backdrop-blur border border-white/30 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <ArrowUpRight size={16} />
          </div>
        </div>
        <div className="p-5 tilt-inner">
          <div className="text-[17px] font-bold tracking-tight">{title}</div>
          <p className="text-sm opacity-60 mt-1.5 leading-relaxed">{desc}</p>
          <div className="mt-3 flex items-center gap-1.5 text-[13px] font-bold text-med-600 dark:text-sky-300">
            Explore module <ArrowRight size={14} />
          </div>
        </div>
      </TiltCard>
    </Reveal>
  );
}
