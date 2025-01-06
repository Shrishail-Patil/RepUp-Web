'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '@/utils/supabase/client'

export const UserCountCard = () => {
  const [userCount, setUserCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchUserCount = async () => {
      try {
        const { count, error } = await supabase
          .from('auth.users')
          .select('*', { count: 'exact', head: true })

        if (error) {
          console.error('Error fetching user count:', error)
          return
        }

        setUserCount(count || 0)
      } catch (error) {
        console.error('Error:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchUserCount()

    // Set up real-time subscription for user count updates
    const channel = supabase.channel('schema-db-changes')
    
    channel
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public',
          table: 'auth.users' 
        }, 
        () => {
          fetchUserCount()
        }
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 1.5 }}
      className="fixed bottom-8 right-8 z-20"
    >
      <div className="bg-white/80 backdrop-blur-md rounded-2xl p-4 shadow-lg border border-white/20">
        <p className="text-sm font-medium text-gray-600">Registered Users</p>
        <motion.p 
          className="text-3xl font-bold text-gradient"
          initial={{ scale: 1 }}
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
        >
          {isLoading ? "..." : userCount.toLocaleString()}
        </motion.p>
      </div>
    </motion.div>
  )
}