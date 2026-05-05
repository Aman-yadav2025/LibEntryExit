'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';

export default function HomePage() {
  const router = useRouter();
  const { user } = useAuthStore();

  useEffect(() => {
    if (!user) { router.replace('/login'); return; }
    if (user.role === 'guard') router.replace('/guard/dashboard');
    else router.replace('/student/dashboard');
  }, [user, router]);

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
      <div className="spinner spinner-dark" />
    </div>
  );
}
