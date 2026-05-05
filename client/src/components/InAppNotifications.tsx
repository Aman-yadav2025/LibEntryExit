'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, CheckCircle2, LogOut, AlertTriangle } from 'lucide-react';
import api from '@/lib/api';
import styles from './InAppNotifications.module.css';

interface Notification {
  _id: string;
  title: string;
  body: string;
  read: boolean;
  type: 'entry' | 'exit' | 'flag' | 'general';
  createdAt: string;
}

export default function InAppNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  const fetchNotifications = async () => {
    try {
      const { data } = await api.get('/notifications');
      setNotifications(data.notifications);
      setUnreadCount(data.notifications.filter((n: Notification) => !n.read).length);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Poll for fresh notifications inside the app every 8 seconds
    const interval = setInterval(fetchNotifications, 8000);
    return () => clearInterval(interval);
  }, []);

  const markAsRead = async (id: string) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(prev =>
        prev.map(n => n._id === id ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark as read:', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all read:', err);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'entry':
        return <CheckCircle2 size={13} style={{ color: 'var(--active-text)' }} />;
      case 'exit':
        return <LogOut size={13} style={{ color: 'var(--exiting-text)' }} />;
      case 'flag':
        return <AlertTriangle size={13} style={{ color: 'var(--flagged-text)' }} />;
      default:
        return <Bell size={13} style={{ color: 'var(--pending-text)' }} />;
    }
  };

  const getStyleClass = (type: string, read: boolean) => {
    let classes = styles.notificationItem;
    if (!read) classes += ` ${styles.unread}`;
    
    if (type === 'entry') return `${classes} ${styles.entry}`;
    if (type === 'exit') return `${classes} ${styles.exit}`;
    if (type === 'flag') return `${classes} ${styles.flag}`;
    return `${classes} ${styles.general}`;
  };

  return (
    <div className={styles.container}>
      <motion.button 
        id="notification-bell-btn"
        whileTap={{ scale: 0.95 }}
        className={styles.bellBtn} 
        onClick={() => setIsOpen(!isOpen)}
        title="Notifications"
      >
        <Bell size={15} strokeWidth={1.5} />
        {unreadCount > 0 && (
          <span className={styles.badge}>{unreadCount}</span>
        )}
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Click backdrop to auto-close dropdown */}
            <div className={styles.backdrop} onClick={() => setIsOpen(false)} />
            
            <motion.div 
              className={styles.dropdown}
              initial={{ opacity: 0, y: 8, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.97 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
            >
              <div className={styles.dropdownHeader}>
                <h3 className={styles.dropdownTitle}>Notifications</h3>
                {unreadCount > 0 && (
                  <button onClick={markAllAsRead} className={styles.markAllBtn}>
                    Mark all read
                  </button>
                )}
              </div>

              <div className={styles.list}>
                {notifications.length === 0 ? (
                  <div className={styles.emptyState}>
                    <p>No notifications yet</p>
                    <p className={styles.emptySub}>We'll notify you on library entry & exit checks.</p>
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div 
                      key={n._id} 
                      className={getStyleClass(n.type, n.read)}
                      onClick={() => !n.read && markAsRead(n._id)}
                    >
                      <div className={styles.iconWrapper}>
                        {getIcon(n.type)}
                      </div>
                      <div className={styles.content}>
                        <div className={styles.itemHeader}>
                          <h4 className={styles.title}>{n.title}</h4>
                          <span className={styles.time}>
                            {new Date(n.createdAt).toLocaleTimeString('en-IE', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className={styles.body}>{n.body}</p>
                      </div>
                      {!n.read && (
                        <div className={styles.unreadIndicator} />
                      )}
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}