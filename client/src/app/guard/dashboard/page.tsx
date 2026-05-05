'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
// NEW: Added ArrowLeft for the mobile back button
import { Users, Clock, LogOut, AlertTriangle, CheckCircle, ClipboardList, Laptop, BookOpen, Briefcase, Smartphone, Package, ArrowLeft } from 'lucide-react';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import BelongingsList from '@/components/BelongingsList';
import styles from './dashboard.module.css';

interface Student { _id: string; name: string; email: string; rollNumber?: string; department?: string; }
interface Session {
  _id: string; status: string;
  belongings: { _id?: string; description: string; type: string; status?: string }[];
  createdAt: string; entryTime?: string;
  student: Student; guard?: { name: string }; flagNotes?: string;
}

const fadeUp: any = { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.35 } };

export default function GuardDashboard() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [pending, setPending] = useState<Session[]>([]);
  const [active, setActive] = useState<Session[]>([]);
  const [selected, setSelected] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [flagNotes, setFlagNotes] = useState('');
  const [showFlag, setShowFlag] = useState(false);
  const [tab, setTab] = useState<'pending' | 'active'>('pending');

  useEffect(() => {
    if (!user) { router.replace('/login'); return; }
    if (user.role !== 'guard') { router.replace('/student/dashboard'); return; }
  }, [user, router]);

  const fetchAll = useCallback(async () => {
    try {
      const [p, a] = await Promise.all([api.get('/sessions/pending'), api.get('/sessions/active')]);
      setPending(p.data.sessions); setActive(a.data.sessions);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);
  useEffect(() => { const t = setInterval(fetchAll, 8000); return () => clearInterval(t); }, [fetchAll]);

  const doEntry = async () => {
    if (!selected) return;
    setActionLoading(true);
    try { await api.put(`/sessions/${selected._id}/entry`); setSelected(null); fetchAll(); }
    finally { setActionLoading(false); }
  };

  const doExit = async () => {
    if (!selected) return;
    setActionLoading(true);
    try { await api.put(`/sessions/${selected._id}/exit`); setSelected(null); fetchAll(); }
    finally { setActionLoading(false); }
  };

  const doFlag = async () => {
    if (!selected) return;
    setActionLoading(true);
    try {
      await api.put(`/sessions/${selected._id}/flag`, { flagNotes: flagNotes || 'Belongings mismatch' });
      setSelected(null); setShowFlag(false); setFlagNotes(''); fetchAll();
    } finally { setActionLoading(false); }
  };

  const list = tab === 'pending' ? pending : active;

  return (
    <div className="page">
      {/* Stats - Stays at the top */}
      <motion.div className={styles.stats} {...fadeUp}>
        <div className={styles.stat}>
          <div className={styles.statNum}>{active.length}</div>
          <div className={styles.statLabel}><span className={styles.dot} style={{ background: 'var(--active-text)' }} /> Inside library</div>
        </div>
        <div className={styles.statDivider} />
        <div className={styles.stat}>
          <div className={styles.statNum}>{pending.length}</div>
          <div className={styles.statLabel}><span className={styles.dot} style={{ background: 'var(--pending-text)' }} /> Pending</div>
        </div>
        <div className={styles.statDivider} />
        <div className={styles.stat}>
          <div className={styles.statNum}>{active.filter(s => s.status === 'exiting').length}</div>
          <div className={styles.statLabel}><span className={styles.dot} style={{ background: 'var(--exiting-text)' }} /> Exiting</div>
        </div>
        <motion.button whileTap={{ scale: 0.96 }} id="view-records-btn" onClick={() => router.push('/guard/records')} className={`btn btn-ghost btn-sm ${styles.recordsBtn}`}>
          <ClipboardList size={14} strokeWidth={1.5} /> Records
        </motion.button>
      </motion.div>

      {/* NEW: Added hasSelected class for mobile toggling */}
      <motion.div className={`${styles.layout} ${selected ? styles.hasSelected : ''}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1, duration: 0.4 }}>
        
        {/* Sidebar (List View) */}
        <div className={styles.sidebar}>
          <div className={styles.tabs}>
            <button id="tab-pending" className={`${styles.tab} ${tab === 'pending' ? styles.tabActive : ''}`} onClick={() => setTab('pending')}>
              Pending <span className={styles.count}>{pending.length}</span>
            </button>
            <button id="tab-active" className={`${styles.tab} ${tab === 'active' ? styles.tabActive : ''}`} onClick={() => setTab('active')}>
              Active <span className={styles.count}>{active.length}</span>
            </button>
          </div>

          {loading && <div style={{ padding: '2.5rem', display: 'flex', justifyContent: 'center' }}><div className="spinner spinner-dark" /></div>}
          {!loading && list.length === 0 && (
            <div className={styles.emptyList}>
              {tab === 'pending' ? 'No pending requests' : 'Library is empty'}
            </div>
          )}

          <div className={styles.sessionList}>
            <AnimatePresence>
              {list.map((s, i) => (
                <motion.button
                  key={s._id}
                  id={`session-${s._id}`}
                  className={`${styles.sessionItem} ${selected?._id === s._id ? styles.selectedItem : ''}`}
                  onClick={() => { setSelected(s); setShowFlag(false); }}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                >
                  <div className={styles.initials}>
                    {s.student.name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                  <div className={styles.sessionInfo}>
                    <div className={styles.sessionName}>{s.student.name}</div>
                    <div className={styles.sessionMeta}>{s.student.rollNumber} · {s.belongings.length} items</div>
                  </div>
                  <span className={`badge badge-${s.status}`} style={{ fontSize: '.65rem', flexShrink: 0 }}>
                    <span className="badge-dot" />{s.status}
                  </span>
                </motion.button>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Detail Panel */}
        <div className={styles.main}>
          <AnimatePresence mode="wait">
            {!selected ? (
              <motion.div key="empty" className={styles.emptyMain} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <Users size={28} strokeWidth={1} style={{ color: 'var(--border-dark)', marginBottom: '1rem' }} />
                <h3 style={{ fontWeight: 400 }}>Select a session</h3>
                <p className="text-muted text-sm" style={{ marginTop: '.375rem' }}>Choose from the list to view details.</p>
              </motion.div>
            ) : (
              <motion.div key={selected._id} className={styles.detail} initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
                
                {/* NEW: Mobile Back Button */}
                <button className={styles.mobileBack} onClick={() => setSelected(null)}>
                  <ArrowLeft size={16} strokeWidth={1.5} /> Back to List
                </button>

                {/* Student header */}
                <div className={styles.studentHeader}>
                  <div className={styles.studentInitials}>
                    {selected.student.name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                  <div style={{ flex: 1 }}>
                    <h2 style={{ fontWeight: 400 }}>{selected.student.name}</h2>
                    <p className="text-sm text-muted" style={{ marginTop: '.25rem' }}>{selected.student.email}</p>
                    <div className="flex gap-2 mt-2">
                      {selected.student.rollNumber && <span className={styles.rollChip}>{selected.student.rollNumber}</span>}
                      {selected.student.department && <span className="text-sm text-muted">{selected.student.department}</span>}
                    </div>
                  </div>
                  <span className={`badge badge-${selected.status}`}><span className="badge-dot" />{selected.status}</span>
                </div>

                <div className="divider" />

                {/* Belongings List */}
                <BelongingsList
                  belongings={selected.belongings}
                  sessionId={selected._id}
                  editable={selected.status === 'pending' || selected.status === 'active'}
                  onUpdate={async () => {
                    await fetchAll();
                    try {
                      const res = await api.get(`/sessions/${selected._id}`);
                      setSelected(res.data.session);
                    } catch (err) { console.error(err); }
                  }}
                />

                {selected.flagNotes && (
                  <div className="alert alert-error" style={{ marginTop: '1rem' }}>
                    <AlertTriangle size={14} strokeWidth={1.5} /> {selected.flagNotes}
                  </div>
                )}

                {/* Actions - NEW: Removed btn-lg to make them compact */}
                <div className={styles.actions}>
                  {selected.status === 'pending' && (
                    <motion.button id="approve-entry-btn" whileTap={{ scale: 0.97 }} className="btn btn-primary" disabled={actionLoading} onClick={doEntry}>
                      {actionLoading ? <><div className="spinner" />Processing</> : <><CheckCircle size={15} strokeWidth={1.5} /> Approve Entry</>}
                    </motion.button>
                  )}
                  {selected.status === 'active' && (
                    <>
                      <motion.button id="initiate-exit-btn" whileTap={{ scale: 0.97 }} className="btn btn-primary" disabled={actionLoading} onClick={doExit}>
                        {actionLoading ? <><div className="spinner" />Processing</> : <><LogOut size={15} strokeWidth={1.5} /> Initiate Exit</>}
                      </motion.button>
                      <motion.button id="flag-btn" whileTap={{ scale: 0.97 }} className="btn btn-danger" disabled={actionLoading} onClick={() => setShowFlag(v => !v)}>
                        <AlertTriangle size={15} strokeWidth={1.5} /> Flag Mismatch
                      </motion.button>
                    </>
                  )}
                  {selected.status === 'exiting' && (
                    <div className="alert alert-info" style={{ flex: 1 }}>
                      <Clock size={14} strokeWidth={1.5} /> Waiting for student confirm
                    </div>
                  )}
                </div>

                {/* Flag form */}
                <AnimatePresence>
                  {showFlag && (
                    <motion.div
                      className={styles.flagForm}
                      initial={{ opacity: 0, y: -8, height: 0 }}
                      animate={{ opacity: 1, y: 0, height: 'auto' }}
                      exit={{ opacity: 0, y: -8, height: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                        <input id="flag-notes-input" className="form-input" placeholder="e.g. Undeclared laptop found" value={flagNotes} onChange={e => setFlagNotes(e.target.value)} />
                      </div>
                      <motion.button id="confirm-flag-btn" whileTap={{ scale: 0.97 }} className="btn btn-danger" disabled={actionLoading} onClick={doFlag}>
                        Confirm
                      </motion.button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}