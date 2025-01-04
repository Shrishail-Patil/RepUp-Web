'use client'

import { motion } from 'framer-motion'
import { Dumbbell } from 'lucide-react'

export const AnimatedDumbbell = ({size = 20}) => {
  return (
    <motion.div
      className="absolute"
      animate={{
        y: [0, -20, 0],
        rotate: [0, 5, -5, 0],
      }}
      transition={{
        duration: 5,
        repeat: Infinity,
        ease: "easeInOut"
      }}
    >
      <Dumbbell className="text-purple-400/20" 
      style={{
        width: size,
        height: size,
      }}/>
    </motion.div>
  )
}

