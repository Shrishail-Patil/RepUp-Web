import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export function TemporaryMessage() {
  const [isVisible, setIsVisible] = useState(true)
  const messageRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false)
    }, 5000)

    const handleClickOutside = (event: MouseEvent) => {
      if (messageRef.current && !messageRef.current.contains(event.target as Node)) {
        setIsVisible(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)

    return () => {
      clearTimeout(timer)
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  if (!isVisible) return null

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 z-50 flex items-center justify-center"
        >
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
          <motion.div
            ref={messageRef}
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.9 }}
            transition={{ duration: 0.3 }}
            className="bg-white/80 backdrop-blur-md rounded-2xl p-8 shadow-lg border border-white/20 max-w-lg mx-4 relative z-10"
          >
            <button
              onClick={() => setIsVisible(false)}
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <h2 className="text-2xl font-bold mb-4 text-gradient">Welcome to RepUp v1.0</h2>
            <p className="text-gray-700 mb-4">
              This is the initial version of our website. We're working on adding a feedback form
              where you can share your thoughts and suggest new features. For now, enjoy the basic
              but fully functional app!
            </p>
            <p className="text-sm text-gray-500">
              Click outside or use the close button to dismiss this message.
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

