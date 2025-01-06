'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

export function UserCountCard() {
  const [userCount, setUserCount] = useState(0)

  useEffect(() => {
    // Simulating an API call to get the user count
    const fetchUserCount = async () => {
      // Replace this with an actual API call in production
      const simulatedCount = Math.floor(Math.random() * 10000) + 1000
      setUserCount(simulatedCount)
    }

    fetchUserCount()
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
          {userCount.toLocaleString()}
        </motion.p>
      </div>
    </motion.div>
  )
}
