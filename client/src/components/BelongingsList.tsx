'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Laptop, BookOpen, Briefcase, Smartphone, Package, Plus, X, Pencil, Check, CheckSquare, Sparkles } from 'lucide-react';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import styles from './BelongingsList.module.css';

type BelongingType = 'laptop' | 'book' | 'bag' | 'device' | 'other';
interface Belonging { 
  _id?: string;
  description: string; 
  type: BelongingType | string; 
  status?: string;
}

const ICON_MAP: Record<string, any> = {
  laptop: Laptop, book: BookOpen, bag: Briefcase, device: Smartphone, other: Package,
};
const TYPES = ['laptop', 'book', 'bag', 'device', 'other'];

interface Props {
  belongings: Belonging[];
  sessionId: string;
  editable: boolean;
  onUpdate: () => void;
}

export default function BelongingsList({ belongings, sessionId, editable, onUpdate }: Props) {
  const { user } = useAuthStore();
  const [editing, setEditing] = useState(false);
  
  const [items, setItems] = useState<Belonging[]>(() => 
    belongings.map(b => ({ _id: b._id, description: b.description, type: b.type, status: b.status }))
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleStartEdit = () => {
    setItems(belongings.map(b => ({ _id: b._id, description: b.description, type: b.type, status: b.status })));
    setEditing(true);
  };

  const update = (i: number, field: keyof Belonging, value: string) =>
    setItems((prev) => prev.map((b, idx) => idx === i ? { ...b, [field]: value } : b));

  const addItem = () => setItems((prev) => [...prev, { description: '', type: 'other' }]);
  const removeItem = (i: number) => setItems((prev) => prev.filter((_, idx) => idx !== i));

  const save = async () => {
    setSaving(true); setError('');
    try {
      const payload = items
        .filter(b => b.description.trim())
        .map(b => ({
          _id: b._id,
          description: b.description,
          type: b.type,
          status: b.status
        }));

      await api.put(`/sessions/${sessionId}/belongings`, { belongings: payload });
      setEditing(false); 
      onUpdate();
    } catch { 
      setError('Failed to save.'); 
    } finally { 
      setSaving(false); 
    }
  };

  const cancel = () => { 
    setItems(belongings.map(b => ({ _id: b._id, description: b.description, type: b.type, status: b.status }))); 
    setEditing(false); 
    setError(''); 
  };

  const updateItemStatus = async (itemId: string, newStatus: string) => {
    try {
      await api.put(`/sessions/${sessionId}/belongings/${itemId}/status`, { status: newStatus });
      onUpdate();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update item status.');
    }
  };

  // Bulk Actions
  const handleApproveAll = async () => {
    try {
      await api.put(`/sessions/${sessionId}/belongings/approve-all`);
      onUpdate();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to approve all items.');
    }
  };

  const handleAcknowledgeAll = async () => {
    try {
      await api.put(`/sessions/${sessionId}/belongings/acknowledge-all`);
      onUpdate();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to acknowledge all items.');
    }
  };

  const getStatusClass = (status?: string) => {
    if (status === 'checked_by_guard') return styles.statusChecked;
    if (status === 'acknowledged') return styles.statusAck;
    return styles.statusUnchecked;
  };

  // State checks for showing bulk actions
  const hasUncheckedItems = belongings.some(b => !b.status || b.status === 'unchecked');
  const hasCheckedByGuardItems = belongings.some(b => b.status === 'checked_by_guard');

  return (
    <div>
      <div className={styles.header}>
        <p className={styles.sectionLabel}>Declared Belongings</p>
        
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          {/* BULK ACTIONS BUTTONS */}
          {user?.role === 'guard' && hasUncheckedItems && editable && !editing && (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleApproveAll}
              className="btn btn-sm"
              style={{ background: '#eab308', color: '#fff', border: 'none', display: 'flex', gap: '0.3rem', alignItems: 'center' }}
            >
              <CheckSquare size={13} /> Approve All ({belongings.filter(b => !b.status || b.status === 'unchecked').length})
            </motion.button>
          )}

          {user?.role === 'student' && hasCheckedByGuardItems && editable && !editing && (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleAcknowledgeAll}
              className="btn btn-sm"
              style={{ background: '#22c55e', color: '#fff', border: 'none', display: 'flex', gap: '0.3rem', alignItems: 'center' }}
            >
              <Sparkles size={13} /> Acknowledge All ({belongings.filter(b => b.status === 'checked_by_guard').length})
            </motion.button>
          )}

          {/* Edit Button */}
          {editable && !editing && user?.role === 'student' && (
            <motion.button 
              whileTap={{ scale: 0.95 }} 
              className="btn btn-ghost btn-sm" 
              onClick={handleStartEdit}
            >
              <Pencil size={13} strokeWidth={1.5} /> Edit
            </motion.button>
          )}
        </div>
      </div>

      {error && <div className="alert alert-error mb-2">{error}</div>}

      <AnimatePresence mode="wait">
        {!editing ? (
          <motion.div
            key="view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {belongings.length === 0 ? (
              <p className="text-muted text-sm">No items declared.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {belongings.map((b, i) => {
                  const Icon = ICON_MAP[b.type] || Package;
                  const itemId = b._id;

                  return (
                    <motion.div
                      key={itemId || i}
                      className={`${styles.statusRow} ${getStatusClass(b.status)}`}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                    >
                      <div className={styles.itemInfo}>
                        <div className={styles.itemTitle}>
                          <Icon size={14} strokeWidth={1.5} />
                          {b.description}
                        </div>
                        <div className={styles.itemMeta}>
                          {b.type} • {b.status?.replace(/_/g, ' ') || 'unchecked'}
                        </div>
                      </div>

                      <div className={styles.actionArea}>
                        {/* GUARD ACTION: Mark Checked */}
                        {user?.role === 'guard' && (b.status === 'unchecked' || !b.status) && editable && (
                          <motion.button 
                            whileTap={{ scale: 0.95 }}
                            onClick={() => itemId && updateItemStatus(itemId, 'checked_by_guard')}
                            className="btn btn-sm"
                            style={{ background: '#eab308', color: '#fff', border: 'none' }}
                          >
                            Mark Checked
                          </motion.button>
                        )}

                        {/* STUDENT ACTION: Acknowledge */}
                        {user?.role === 'student' && b.status === 'checked_by_guard' && editable && (
                          <motion.button 
                            whileTap={{ scale: 0.95 }}
                            onClick={() => itemId && updateItemStatus(itemId, 'acknowledged')}
                            className="btn btn-sm"
                            style={{ background: '#22c55e', color: '#fff', border: 'none' }}
                          >
                            Acknowledge
                          </motion.button>
                        )}

                        {/* SUCCESS: Green fully verified state */}
                        {b.status === 'acknowledged' && (
                          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--active-text)' }}>
                            ✅ Verified
                          </span>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>
        ) : (
          /* Editing Panel */
          <motion.div
            key="edit"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className={styles.editList}>
              {items.map((b, i) => (
                <div key={i} className={styles.editRow}>
                  <select
                    id={`edit-type-${i}`} className="form-select" style={{ width: 130 }}
                    value={b.type} onChange={(e) => update(i, 'type', e.target.value)}
                  >
                    {TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                  </select>
                  <input
                    id={`edit-desc-${i}`} className="form-input" style={{ flex: 1 }}
                    value={b.description} onChange={(e) => update(i, 'description', e.target.value)}
                    placeholder="Item description"
                  />
                  <motion.button whileTap={{ scale: 0.9 }} type="button" className={styles.removeBtn} onClick={() => removeItem(i)}>
                    <X size={13} strokeWidth={2} />
                  </motion.button>
                </div>
              ))}
            </div>
            <div className={styles.editActions}>
              <motion.button whileTap={{ scale: 0.97 }} type="button" className="btn btn-ghost btn-sm" onClick={addItem}>
                <Plus size={13} strokeWidth={2} /> Add item
              </motion.button>
              <motion.button whileTap={{ scale: 0.97 }} id="save-belongings-btn" type="button" className="btn btn-primary btn-sm" onClick={save} disabled={saving}>
                {saving ? <><div className="spinner" />Saving</> : <><Check size={13} strokeWidth={2} /> Save</>}
              </motion.button>
              <button type="button" className="btn btn-ghost btn-sm" onClick={cancel}>Cancel</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}