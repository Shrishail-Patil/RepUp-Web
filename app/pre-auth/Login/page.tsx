'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/utils/supabase/supabaseClient';
import Cookies from 'js-cookie';
import { useRouter } from 'next/navigation';
import { SquiggleButton } from '@/components/squiggle-button';
import { AnimatedDumbbell } from '@/components/animated-dumbbell';
import { AnimatedPlate } from '@/components/animated-plate';

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
  
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
          redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/Profile`,
        },
      });
  
      if (error) {
        throw new Error(error.message);
      }
  
      const { data: sessionData } = await supabase.auth.getSession();
      const session = sessionData?.session;
  
      if (session) {
        const { user } = session;
        const { email, user_metadata } = user;
        const name = user_metadata?.name || 'Unknown User';
  
        await supabase.from('users').upsert({
          uid: user.id,
          Username: name,
          Email: email,
        });
  
        Cookies.set('uid', user.id, { expires: 7, secure: true });
        Cookies.set('uname', name, { expires: 7, secure: true });
  
        router.push('/auth/Profile');
      } else {
        alert('Session not found');
      }
    } catch (error) {
      if (error instanceof Error) {
        console.error('Login error:', error.message);
        alert(error.message);
      } else {
        console.error('An unknown error occurred:', error);
        alert('An unknown error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      {/* Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <AnimatedDumbbell />
        <div className="absolute top-1/4 right-1/4">
          <AnimatedDumbbell />
        </div>
        <div className="absolute bottom-1/4 left-1/3">
          <AnimatedPlate size={80} />
        </div>
        <div className="absolute top-1/3 right-1/3">
          <AnimatedPlate size={120} delay={2} />
        </div>
      </div>

      {/* Login Card */}
      <motion.div
        className="glass-card p-8 rounded-2xl shadow-xl w-full max-w-md relative z-10"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <motion.h2
          className="text-3xl font-bold text-center mb-6 text-gradient"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          Login to RepUp
        </motion.h2>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <SquiggleButton
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full"
          >
            {loading ? 'Loading...' : 'Sign in with Google'}
          </SquiggleButton>
        </motion.div>
      </motion.div>
    </div>
  );
}