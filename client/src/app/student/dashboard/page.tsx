'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Plus, Clock, CheckCircle2, LogOut, BookOpen } from 'lucide-react';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { subscribeToPush } from '@/lib/pushUtils';
import BelongingsList from '@/components/BelongingsList';
import styles from './dashboard.module.css';

interface Session {
  _id: string;
  status: 'pending' | 'active' | 'exiting' | 'completed' | 'flagged';
  belongings: { description: string; type: string }[];
  createdAt: string;
  entryTime?: string;
  exitTime?: string;
  flagNotes?: string;
  guard?: { name: string };
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending approval',
  active: 'Inside library',
  exiting: 'Exit requested',
  completed: 'Completed',
  flagged: 'Flagged',
};

const fadeUp: any = { initial: { opacity: 0, y: 14 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.4, ease: 'easeOut' } };

export default function StudentDashboard() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmingExit, setConfirmingExit] = useState<string | null>(null);

  useEffect(() => {
    if (!user) { router.replace('/login'); return; }
    if (user.role !== 'student') { router.replace('/guard/dashboard'); return; }
  }, [user, router]);

  const fetchSessions = useCallback(async () => {
    try {
      const { data } = await api.get('/sessions/mine');
      setSessions(data.sessions);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchSessions(); }, [fetchSessions]);
  useEffect(() => { const t = setInterval(fetchSessions, 10000); return () => clearInterval(t); }, [fetchSessions]);

  const handleConfirmExit = async (sessionId: string) => {
    setConfirmingExit(sessionId);
    try { await api.put(`/sessions/${sessionId}/exit-confirm`); fetchSessions(); }
    finally { setConfirmingExit(null); }
  };

  const active = sessions.find((s) => ['active', 'exiting', 'pending'].includes(s.status));
  const past = sessions.filter((s) => ['completed', 'flagged'].includes(s.status));

  if (!user) return null;

  return (
    <div className="page">
      {/* Header */}
      <motion.div className={styles.header} {...fadeUp}>
        <div>
          <h1>Good day, {user.name.split(' ')[0]}</h1>
          <div className={styles.studentMeta}>
            {user.rollNumber && <span className={styles.rollBadge}>{user.rollNumber}</span>}
            {user.department && <span className="text-muted text-sm">{user.department}</span>}
          </div>
        </div>
        <div className={styles.headerActions}>
          <motion.button whileTap={{ scale: 0.97 }} className="btn btn-ghost btn-sm" onClick={() => subscribeToPush()}>
            <Bell size={14} strokeWidth={1.5} /> Notifications
          </motion.button>
          <motion.button whileTap={{ scale: 0.97 }} id="new-request-btn" className="btn btn-primary btn-sm" onClick={() => router.push('/student/request')}>
            <Plus size={14} strokeWidth={2} /> New Request
          </motion.button>
        </div>
      </motion.div>

      {/* Active session */}
      <AnimatePresence>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
            <div className="spinner spinner-dark" />
          </div>
        ) : active ? (
          <motion.div
            key="active"
            className={styles.activeCard}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <div className={styles.activeTop}>
              <div>
                <span className={`badge badge-${active.status}`}>
                  <span className="badge-dot" />
                  {STATUS_LABELS[active.status]}
                </span>
                <p className="text-xs text-muted" style={{ marginTop: '.5rem' }}>
                  <Clock size={11} strokeWidth={1.5} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />
                  {new Date(active.createdAt).toLocaleString('en-IE', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>

              {active.status === 'exiting' && (
                <motion.div
                  className={styles.exitPrompt}
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <LogOut size={15} strokeWidth={1.5} />
                  <span>Guard has initiated your exit — please confirm</span>
                  <motion.button
                    id="confirm-exit-btn"
                    whileTap={{ scale: 0.96 }}
                    className={`btn btn-primary btn-sm`}
                    disabled={confirmingExit === active._id}
                    onClick={() => handleConfirmExit(active._id)}
                  >
                    {confirmingExit === active._id ? <><div className="spinner" />Confirming</> : <>Confirm Exit</>}
                  </motion.button>
                </motion.div>
              )}

              {active.status === 'pending' && (
                <div className={styles.pendingNote}>
                  <Clock size={14} strokeWidth={1.5} />
                  Awaiting guard approval
                </div>
              )}
            </div>

            <div className="divider" />
            <BelongingsList
              belongings={active.belongings}
              sessionId={active._id}
              editable={['pending', 'active'].includes(active.status)}
              onUpdate={fetchSessions}
            />
          </motion.div>
        ) : (
          <motion.div
            key="empty"
            className={styles.emptyState}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <BookOpen size={32} strokeWidth={1} className={styles.emptyIcon} />
            <h3>No active session</h3>
            <p className="text-muted text-sm" style={{ marginTop: '.375rem' }}>Create a pre-visit request before heading to the library.</p>
            <motion.button whileTap={{ scale: 0.97 }} id="create-request-btn" className="btn btn-primary" style={{ marginTop: '1.5rem' }} onClick={() => router.push('/student/request')}>
              <Plus size={15} strokeWidth={2} /> New Request
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Past sessions */}
      {past.length > 0 && (
        <motion.div style={{ marginTop: '2.5rem' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
          <p className={styles.sectionTitle}>Past Visits</p>
          <div className={styles.pastList}>
            {past.map((s, i) => (
              <motion.div
                key={s._id}
                className={styles.pastItem}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.06 }}
              >
                <div className="flex items-center gap-3">
                  <CheckCircle2 size={15} strokeWidth={1.5} style={{ color: s.status === 'flagged' ? 'var(--flagged-text)' : 'var(--active-text)', flexShrink: 0 }} />
                  <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--charcoal)' }}>
                      {new Date(s.createdAt).toLocaleDateString('en-IE', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                    <p className="text-xs text-muted">{s.belongings.length} item{s.belongings.length !== 1 ? 's' : ''}</p>
                  </div>
                </div>
                <span className={`badge badge-${s.status}`}>{s.status === 'completed' ? 'Completed' : 'Flagged'}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
