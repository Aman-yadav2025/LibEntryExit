'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Plus, X, Send, Laptop, BookOpen, Briefcase, Smartphone, Package } from 'lucide-react';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import styles from './request.module.css';

type BelongingType = 'laptop' | 'book' | 'bag' | 'device' | 'other';
interface Belonging { description: string; type: BelongingType; }

const TYPES: { value: BelongingType; label: string; Icon: any }[] = [
  { value: 'laptop', label: 'Laptop',  Icon: Laptop },
  { value: 'book',   label: 'Book',    Icon: BookOpen },
  { value: 'bag',    label: 'Bag',     Icon: Briefcase },
  { value: 'device', label: 'Device',  Icon: Smartphone },
  { value: 'other',  label: 'Other',   Icon: Package },
];

export default function StudentRequestPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [belongings, setBelongings] = useState<Belonging[]>([{ description: '', type: 'laptop' }]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const addItem = () => setBelongings(p => [...p, { description: '', type: 'other' }]);
  const removeItem = (i: number) => setBelongings(p => p.filter((_, idx) => idx !== i));
  const update = (i: number, f: keyof Belonging, v: string) =>
    setBelongings(p => p.map((b, idx) => idx === i ? { ...b, [f]: v } : b));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const valid = belongings.filter(b => b.description.trim());
    if (!valid.length) { setError('Add at least one item.'); return; }
    setLoading(true);
    try {
      await api.post('/sessions', { belongings: valid });
      router.push('/student/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create request.');
    } finally { setLoading(false); }
  };

  return (
    <div className="page">
      <motion.button
        className="btn btn-ghost btn-sm"
        style={{ marginBottom: '2rem' }}
        onClick={() => router.back()}
        whileTap={{ scale: 0.96 }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <ArrowLeft size={14} strokeWidth={1.5} /> Back
      </motion.button>

      <div className={styles.grid}>
        {/* Form */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <h1>New Visit Request</h1>
          <p className="text-muted" style={{ marginTop: '.5rem', marginBottom: '2rem', fontWeight: 300 }}>
            List all items you plan to bring into the library.
          </p>

          {error && <div className="alert alert-error mb-4">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className={styles.itemsCard}>
              <div className={styles.itemsHeader}>
                <p className={styles.sectionLabel}>Belongings</p>
                <motion.button type="button" whileTap={{ scale: 0.95 }} id="add-item-btn" onClick={addItem} className="btn btn-ghost btn-sm">
                  <Plus size={13} strokeWidth={2} /> Add item
                </motion.button>
              </div>

              <div className={styles.itemList}>
                {belongings.map((b, i) => (
                  <motion.div
                    key={i}
                    className={styles.item}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <select
                      id={`belonging-type-${i}`}
                      className={`form-select ${styles.typeSelect}`}
                      value={b.type}
                      onChange={e => update(i, 'type', e.target.value as BelongingType)}
                    >
                      {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                    <input
                      id={`belonging-desc-${i}`}
                      type="text"
                      className={`form-input ${styles.descInput}`}
                      placeholder="e.g. Dell XPS 15 — Silver"
                      value={b.description}
                      onChange={e => update(i, 'description', e.target.value)}
                    />
                    {belongings.length > 1 && (
                      <motion.button type="button" whileTap={{ scale: 0.9 }} onClick={() => removeItem(i)} className={styles.removeBtn}>
                        <X size={13} strokeWidth={2} />
                      </motion.button>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>

            <motion.button
              id="submit-request-btn"
              type="submit"
              className="btn btn-primary btn-full btn-lg"
              style={{ marginTop: '1.5rem' }}
              disabled={loading}
              whileTap={{ scale: 0.98 }}
            >
              {loading ? <><div className="spinner" />Submitting</> : <><Send size={15} strokeWidth={1.5} /> Submit Request</>}
            </motion.button>
          </form>
        </motion.div>

        {/* Info panel */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <div className={styles.infoCard}>
            <p className={styles.sectionLabel} style={{ marginBottom: '1.25rem' }}>How it works</p>
            <div className={styles.steps}>
              {[
                'Submit this request before arriving at the library.',
                'The guard verifies your belongings on arrival.',
                'You receive a notification when entry is confirmed.',
                'Edit your list at any point before exit.',
                'Confirm exit when the guard initiates it.',
              ].map((text, i) => (
                <div key={i} className={styles.step}>
                  <div className={styles.stepNum}>{i + 1}</div>
                  <p className="text-sm" style={{ color: 'var(--charcoal-2)', fontWeight: 300 }}>{text}</p>
                </div>
              ))}
            </div>
          </div>

          {user && (
            <div className={styles.userCard}>
              <p className={styles.sectionLabel} style={{ marginBottom: '.625rem' }}>Submitting as</p>
              <p style={{ fontWeight: 500, color: 'var(--charcoal)' }}>{user.name}</p>
              {user.rollNumber && (
                <p className="text-sm text-muted" style={{ marginTop: '.25rem' }}>
                  {user.rollNumber}{user.department ? ` · ${user.department}` : ''}
                </p>
              )}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
