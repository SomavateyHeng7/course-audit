"use client"

import Link from 'next/link'
import Image from 'next/image'
import { Settings, LogIn } from 'lucide-react'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { motion } from 'framer-motion'

export default function Navbar() {
  return (
    <motion.header 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-gray-950/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800"
    >
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8 h-16">
        {/* Logo */}
        <motion.div 
          whileHover={{ scale: 1.02 }}
          className="flex items-center"
        >
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative">
              <Image 
                src="/image/logo.png" 
                alt="EduTrack Logo" 
                width={32} 
                height={32} 
                priority 
                className="transition-transform group-hover:scale-105"
              />
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-emerald-500 dark:from-emerald-400 dark:to-emerald-300 bg-clip-text text-transparent">
              EduTrack
            </h1>
          </Link>
        </motion.div>

        {/* Utility Icons */}
        <div className="flex items-center gap-3">
          {/* Theme Toggle */}
          <div className="flex items-center gap-2">
            <ThemeToggle />
            {/* 🧩 FIX: closed the span tag properly */}
            <span className="hidden md:inline text-xs text-gray-500 dark:text-gray-400 font-medium">
              Theme
            </span>
          </div>

          {/* Divider */}
          <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 hidden sm:block" />

          {/* Sign In */}
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Link
              href="/auth"
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white transition-all duration-200 shadow-md hover:shadow-lg font-medium"
              aria-label="Sign In"
            >
              <span className="text-sm">Sign In</span>
            </Link>
          </motion.div>
        </div>
      </nav>
    </motion.header>
  )
}
