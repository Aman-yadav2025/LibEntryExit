'use client';
import { useEffect, useState, useCallback, Fragment } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ArrowLeft, ChevronDown, ChevronUp, AlertTriangle, Laptop, BookOpen, Briefcase, Smartphone, Package } from 'lucide-react';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import styles from './records.module.css';

interface Session {
  _id: string; status: string;
  belongings: { description: string; type: string }[];
  createdAt: string; entryTime?: string; exitTime?: string; flagNotes?: string;
  student: { name: string; email: string; rollNumber?: string; department?: string };
  guard?: { name: string };
}

const ICON_MAP: Record<string, any> = {
  laptop: Laptop, book: BookOpen, bag: Briefcase, device: Smartphone, other: Package,
};
const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending', active: 'Active', exiting: 'Exiting', completed: 'Completed', flagged: 'Flagged',
};

const fmt = (d?: string) => d ? new Date(d).toLocaleString('en-IE', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—';
const dur = (e?: string, x?: string) => {
  if (!e || !x) return '—';
  const m = Math.round((new Date(x).getTime() - new Date(e).getTime()) / 60000);
  return m >= 60 ? `${Math.floor(m/60)}h ${m%60}m` : `${m}m`;
};

// Helper to get today's date in YYYY-MM-DD format based on local timezone
const getTodayString = () => new Date().toLocaleDateString('en-CA');

export default function GuardRecordsPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  // Initialize date filter with today's date
  const [dateFilter, setDateFilter] = useState<string>(getTodayString());
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    if (!user) { router.replace('/login'); return; }
    if (user.role !== 'guard') { router.replace('/student/dashboard'); return; }
  }, [user, router]);

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('q', search);
      if (statusFilter) params.set('status', statusFilter);
      if (dateFilter) params.set('date', dateFilter);
      const { data } = await api.get(`/sessions?${params}`);
      setSessions(data.sessions);
    } finally { setLoading(false); }
  }, [search, statusFilter, dateFilter]);

  useEffect(() => { const t = setTimeout(fetchRecords, 350); return () => clearTimeout(t); }, [fetchRecords]);

  // Handle the transition of a flagged session to rechecked status
  const handleMarkRechecked = async (sessionId: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Avoid triggering details card collapse
    if (!window.confirm('Are you sure you want to mark this flagged session as rechecked?')) return;
    
    try {
      await api.put(`/sessions/${sessionId}/recheck`);
      fetchRecords(); // Reload the data
    } catch (err) {
      console.error('Failed to submit recheck status:', err);
      alert('Failed to process recheck. Please check console logs.');
    }
  };

  return (
    <div className="page">
      {/* Header */}
      <motion.div
        className={styles.header}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <div>
          <h1>Records</h1>
          <p className="text-muted" style={{ marginTop: '.375rem', fontWeight: 300, fontSize: '.875rem' }}>
            {sessions.length} session{sessions.length !== 1 ? 's' : ''} found
          </p>
        </div>
        <motion.button whileTap={{ scale: 0.96 }} onClick={() => router.push('/guard/dashboard')} className="btn btn-ghost btn-sm">
          <ArrowLeft size={14} strokeWidth={1.5} /> Dashboard
        </motion.button>
      </motion.div>

      {/* Filters */}
      <motion.div
        className={styles.filters}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08, duration: 0.35 }}
      >
        <div className={styles.searchWrap}>
          <Search size={15} strokeWidth={1.5} className={styles.searchIcon} />
          <input
            id="search-input"
            className={`form-input ${styles.searchInput}`}
            placeholder="Search by name, roll number or email"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select id="status-filter" className={`form-select ${styles.filterSelect}`} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">All statuses</option>
          {Object.entries(STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <input id="date-filter" type="date" className={`form-input ${styles.filterSelect}`} value={dateFilter} onChange={e => setDateFilter(e.target.value)} />
        {(search || statusFilter || dateFilter) && (
          <button id="clear-filters-btn" className="btn btn-ghost btn-sm" onClick={() => { setSearch(''); setStatusFilter(''); setDateFilter(''); }}>
            Clear
          </button>
        )}
      </motion.div>

      {/* List Layout */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem' }}>
          <div className="spinner spinner-dark" style={{ margin: '0 auto' }} />
        </div>
      ) : sessions.length === 0 ? (
        <div className={styles.emptyState}>No sessions found matching your filters.</div>
      ) : (
        <motion.div 
          className={styles.recordList}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15, duration: 0.4 }}
        >
          {sessions.map((s) => {
            const isExpanded = expanded === s._id;

            return (
              /* ✨ Dynamic global class 'card-theme-[status]' added here to dye the entire card background */
              <div key={s._id} className={`${styles.recordCard} card-theme-${s.status}`}>
                {/* Collapsed Header Row */}
                <div 
                  className={styles.recordHeader} 
                  onClick={() => setExpanded(isExpanded ? null : s._id)}
                >
                  <div className={styles.headerLeft}>
                    <span className={styles.studentName}>{s.student.name}</span>
                    <span className={styles.rollChip}>{s.student.rollNumber || 'No Roll Number'}</span>
                  </div>
                  
                  <div className={styles.headerRight}>
                    <div className={styles.entryTime}>
                      <div className={styles.entryLabel}>Entry Time</div>
                      <div>{fmt(s.entryTime)}</div>
                    </div>
                    <div className={styles.caret}>
                      {isExpanded ? <ChevronUp size={18} strokeWidth={2} /> : <ChevronDown size={18} strokeWidth={2} />}
                    </div>
                  </div>
                </div>

                {/* Expanded Details Section */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div 
                      className={styles.recordDetails}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      {/* Meta Information Grid */}
                      <div className={styles.detailGrid}>
                        <div className={styles.detailItem}>
                          <span className={styles.detailLabel}>Email</span>
                          <span className={styles.detailValue}>{s.student.email}</span>
                        </div>
                        <div className={styles.detailItem}>
                          <span className={styles.detailLabel}>Department</span>
                          <span className={styles.detailValue}>{s.student.department || '—'}</span>
                        </div>
                        <div className={styles.detailItem}>
                          <span className={styles.detailLabel}>Status</span>
                          <span className={`badge badge-${s.status}`} style={{ width: 'fit-content' }}>
                            <span className="badge-dot" />{STATUS_LABELS[s.status]}
                          </span>
                        </div>
                        <div className={styles.detailItem}>
                          <span className={styles.detailLabel}>Exit Time</span>
                          <span className={styles.detailValue}>{fmt(s.exitTime)}</span>
                        </div>
                        <div className={styles.detailItem}>
                          <span className={styles.detailLabel}>Duration</span>
                          <span className={styles.detailValue}>{dur(s.entryTime, s.exitTime)}</span>
                        </div>
                        <div className={styles.detailItem}>
                          <span className={styles.detailLabel}>Cleared By Guard</span>
                          <span className={styles.detailValue}>{s.guard?.name || '—'}</span>
                        </div>
                      </div>

                      {/* Belongings List */}
                      <div className={styles.sectionLabel}>Belongings Taken ({s.belongings.length})</div>
                      {s.belongings.length === 0 ? (
                        <p className="text-sm text-muted">No items declared.</p>
                      ) : (
                        <div className={styles.belongingGrid}>
                          {s.belongings.map((b, i) => {
                            const Icon = ICON_MAP[b.type] || Package;
                            return (
                              <div key={i} className={styles.belongingChip}>
                                <Icon size={13} strokeWidth={1.5} style={{ color: 'var(--stone)' }} />
                                <span>{b.description}</span>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Flag Notes & Recheck Actions */}
                      {s.flagNotes && (
                        <div style={{ marginTop: '1.25rem' }}>
                          <div className={styles.sectionLabel}>Flag Notes & Resolution</div>
                          <div 
                            className="alert alert-error" 
                            style={{ 
                              padding: '0.75rem 1rem', 
                              fontSize: '0.8rem',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              flexWrap: 'wrap',
                              gap: '0.75rem'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <AlertTriangle size={13} strokeWidth={1.5} style={{ flexShrink: 0 }} /> 
                              <span>{s.flagNotes}</span>
                            </div>

                            {s.status === 'flagged' && (
                              <motion.button
                                whileTap={{ scale: 0.95 }}
                                className="btn btn-primary btn-sm"
                                style={{ 
                                  padding: '0.35rem 0.75rem', 
                                  fontSize: '0.75rem', 
                                  lineHeight: '1rem',
                                  textTransform: 'none',
                                  letterSpacing: 'normal'
                                }}
                                onClick={(e) => handleMarkRechecked(s._id, e)}
                              >
                                Mark Rechecked
                              </motion.button>
                            )}
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </motion.div>
      )}
    </div>
  );
}