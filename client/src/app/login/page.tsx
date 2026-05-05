'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { BookOpen, FileText, ShieldCheck, Bell, BarChart2, ArrowRight } from 'lucide-react';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import styles from './login.module.css';

const features = [
  { Icon: FileText,    text: 'Pre-visit requests with belongings list' },
  { Icon: ShieldCheck, text: 'Guard-verified entry and exit flow' },
  { Icon: Bell,        text: 'Real-time web push notifications' },
  { Icon: BarChart2,   text: 'Live occupancy and searchable records' },
];

export default function LoginPage() {
  const router = useRouter();
  const { login, user } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) router.replace(user.role === 'guard' ? '/guard/dashboard' : '/student/dashboard');
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', { email, password });
      login(data.token, data.user);
      router.push(data.user.role === 'guard' ? '/guard/dashboard' : '/student/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.wrapper}>
      {/* Left — charcoal branding panel */}
      <div className={styles.left}>
        <motion.div
          className={styles.leftContent}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          <div className={styles.brandMark}>
            <BookOpen size={24} strokeWidth={1.25} />
          </div>
          <h1 className={styles.heroTitle}>SETU Library</h1>
          <p className={styles.heroSub}>Entry & Exit Management System</p>
          <div className={styles.features}>
            {features.map(({ Icon, text }, i) => (
              <motion.div
                key={text}
                className={styles.feature}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 + i * 0.08, duration: 0.4 }}
              >
                <Icon size={15} strokeWidth={1.5} className={styles.featureIcon} />
                <span>{text}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Right — form */}
      <div className={styles.right}>
        <motion.div
          className={styles.formCard}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          <div className={styles.formHeader}>
            <h2 className={styles.formTitle}>Welcome back</h2>
            <p className={styles.formSub}>Sign in with your SETU credentials</p>
          </div>

          {error && (
            <motion.div
              className="alert alert-error"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              role="alert"
            >
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className="form-group">
              <label className="form-label" htmlFor="email">Email</label>
              <input
                id="email" type="email" className="form-input"
                placeholder="yourname@setu.ie"
                value={email} onChange={(e) => setEmail(e.target.value)}
                required autoComplete="email"
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="password">Password</label>
              <input
                id="password" type="password" className="form-input"
                placeholder="••••••••"
                value={password} onChange={(e) => setPassword(e.target.value)}
                required autoComplete="current-password"
              />
            </div>
            <motion.button
              id="login-submit" type="submit"
              className={`btn btn-primary btn-full btn-lg ${styles.submitBtn}`}
              disabled={loading}
              whileTap={{ scale: 0.98 }}
            >
              {loading ? (
                <><div className="spinner" />Signing in</>
              ) : (
                <>Sign In <ArrowRight size={16} strokeWidth={1.5} /></>
              )}
            </motion.button>
          </form>

          <div className={styles.demoBlock}>
            <p className={styles.demoLabel}>Demo accounts</p>
            <div className={styles.demoCreds}>
              <code className={styles.demoCode}>guard@setu.ie / guard123</code>
              <code className={styles.demoCode}>alice@setu.ie / student123</code>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
