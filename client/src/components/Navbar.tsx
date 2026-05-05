'use client';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { BookOpen, LogOut, LayoutDashboard, PlusCircle, ClipboardList, Shield, GraduationCap } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/store/authStore';
import styles from './Navbar.module.css';
import InAppNotifications from './InAppNotifications';

export default function Navbar() {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = () => { logout(); router.push('/login'); };

  if (!user || pathname === '/login') return null;

  const isGuard = user.role === 'guard';
  const initials = user.name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);

  return (
    <nav className={styles.nav}>
      <div className={styles.inner}>
        {/* Brand */}
        <Link href={isGuard ? '/guard/dashboard' : '/student/dashboard'} className={styles.brand}>
          <BookOpen size={18} strokeWidth={1.5} className={styles.brandIcon} />
          <span className={styles.brandText}>SETU Library</span>
        </Link>

        {/* Links */}
        <div className={styles.links}>
          {isGuard ? (
            <>
              <Link href="/guard/dashboard" className={`${styles.link} ${pathname === '/guard/dashboard' ? styles.active : ''}`}>
                <LayoutDashboard size={14} strokeWidth={1.5} />
                Dashboard
              </Link>
              <Link href="/guard/records" className={`${styles.link} ${pathname === '/guard/records' ? styles.active : ''}`}>
                <ClipboardList size={14} strokeWidth={1.5} />
                Records
              </Link>
            </>
          ) : (
            <>
              {/* Shortened text for mobile friendliness */}
              <Link href="/student/dashboard" className={`${styles.link} ${pathname === '/student/dashboard' ? styles.active : ''}`}>
                <LayoutDashboard size={14} strokeWidth={1.5} />
                Sessions
              </Link>
              <Link href="/student/request" className={`${styles.link} ${pathname === '/student/request' ? styles.active : ''}`}>
                <PlusCircle size={14} strokeWidth={1.5} />
                Request
              </Link>
            </>
          )}
        </div>

        {/* User Area */}
        <div className={styles.userArea}>
          
          {/* Notifications */}
          {!isGuard && <InAppNotifications />}

          {/* Role Chip - Will be hidden on mobile */}
          <div className={styles.roleChip}>
            {isGuard ? <Shield size={10} strokeWidth={2} /> : <GraduationCap size={10} strokeWidth={2} />}
            {user.role}
          </div>
          
          <div className={styles.avatar}>{initials}</div>
          {/* User Name - Will be hidden on mobile */}
          <span className={styles.userName}>{user.name.split(' ')[0]}</span>
          
          <motion.button
            id="logout-btn"
            whileTap={{ scale: 0.95 }}
            onClick={handleLogout}
            className={styles.logoutBtn}
            title="Logout"
          >
            <LogOut size={15} strokeWidth={1.5} />
          </motion.button>
        </div>
      </div>
    </nav>
  );
}