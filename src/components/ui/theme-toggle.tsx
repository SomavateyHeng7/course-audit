"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { motion } from "framer-motion"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [isHovered, setIsHovered] = React.useState(false)
  const [mounted, setMounted] = React.useState(false)

  // Prevent hydration mismatch by waiting for client-side mounting
  React.useEffect(() => {
    setMounted(true)
  }, [])

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark")
  }

  // Show a neutral state during SSR to prevent hydration mismatch
  if (!mounted) {
    return (
      <div className="relative group">
        <button
          className="relative flex items-center justify-center w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 hover:bg-emerald-200 dark:hover:bg-emerald-900/50 transition-colors duration-200 shadow-sm hover:shadow-md"
          aria-label="Toggle theme"
        >
          <Sun className="h-5 w-5 text-emerald-600" />
        </button>
      </div>
    )
  }

  return (
    <div className="relative group">
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={toggleTheme}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="relative flex items-center justify-center w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 hover:bg-emerald-200 dark:hover:bg-emerald-900/50 transition-colors duration-200 shadow-sm hover:shadow-md"
        aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      >
        <motion.div
          initial={false}
          animate={{
            scale: theme === "dark" ? 0 : 1,
            rotate: theme === "dark" ? -90 : 0,
          }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="absolute"
        >
          <Sun className="h-5 w-5 text-emerald-600" />
        </motion.div>
        <motion.div
          initial={false}
          animate={{
            scale: theme === "dark" ? 1 : 0,
            rotate: theme === "dark" ? 0 : 90,
          }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="absolute"
        >
          <Moon className="h-5 w-5 text-emerald-400" />
        </motion.div>
        
        {/* Ripple effect on click */}
        <motion.div
          className="absolute inset-0 rounded-full bg-emerald-300/20 dark:bg-emerald-400/20"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 0, opacity: 0 }}
          whileTap={{ scale: 1.4, opacity: 1 }}
          transition={{ duration: 0.2 }}
        />
      </motion.button>
      
      {/* Tooltip */}
      <motion.div
        initial={{ opacity: 0, y: 10, scale: 0.8 }}
        animate={{ 
          opacity: isHovered ? 1 : 0, 
          y: isHovered ? 0 : 10,
          scale: isHovered ? 1 : 0.8
        }}
        transition={{ duration: 0.2 }}
        className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 px-2 py-1 bg-gray-800 dark:bg-gray-200 text-white dark:text-gray-800 text-xs rounded whitespace-nowrap pointer-events-none"
      >
        {theme === "dark" ? "Light mode" : "Dark mode"}
      </motion.div>
    </div>
  )
}