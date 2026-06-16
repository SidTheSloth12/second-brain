import { useState, useCallback } from'react'
import { Dashboard } from'../components/Dashboard'
import { useAuth } from'../auth/useAuth'
import lines from'../data/lines.json'
import { motion, AnimatePresence } from'framer-motion'
import { useLocalStorage } from '../hooks/useLocalStorage'

const STORAGE_KEY ='lineIndex'

function getInitialIndex(): number {
  const seed=new Date().toDateString().split('').reduce((a, b)=>a+b.charCodeAt(0), 0)
  return seed % lines.length
}

export function HomePage() {
  const { user }=useAuth()
  const [quoteIndex, setQuoteIndex]=useLocalStorage<number>(STORAGE_KEY, getInitialIndex)
  const [spinning, setSpinning]=useState(false)
  const handleNext=useCallback(()=>{
    setSpinning(true)
    setTimeout(()=>setSpinning(false), 400)
    setQuoteIndex(prev=> (prev+1) % lines.length)
  }, [setQuoteIndex])
  return (
    <div className="relative flex min-h-[calc(100vh-4rem)] w-full flex-col items-center py-12 px-4">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:24px_24px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_20%,transparent_100%)] dark:bg-[radial-gradient(#334155_1px,transparent_1px)]" />
      <div className="w-full max-w-6xl space-y-10">
        <motion.div
          initial={{ opacity: 0, y:-20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease:'easeOut' }}
          className="space-y-2 text-center"
        >
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">Welcome back!</h1>
          <p className="text-lg text-slate-600 dark:text-slate-400">
            Signed in as <span className="font-semibold text-violet-600 dark:text-violet-400">{user?.email}</span>
          </p>
        </motion.div>
      <Dashboard/>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.5, ease:'easeOut' }}
        className="mx-auto max-w-2xl rounded-3xl border border-slate-200 bg-white/60 p-6 shadow-sm backdrop-blur-md dark:border-slate-800/60 dark:bg-slate-900/40 relative overflow-hidden group hover:border-violet-200 dark:hover:border-violet-500/20 transition-colors"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-violet-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity dark:from-violet-900/10"></div>
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span className="text-violet-600 dark:text-violet-400 text-2xl">❝</span>Lines
            </h2>
            <button
              onClick={handleNext}
              title="Next line"
              className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium text-slate-600 hover:text-violet-700 hover:bg-violet-100/50 dark:text-slate-300 dark:hover:text-violet-300 dark:hover:bg-violet-900/30 transition-all active:scale-95"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{
                  transition:'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
                  transform: spinning ?'rotate(360deg)' :'rotate(0deg)',
                }}
              >
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                <path d="M3 3v5h5" />
              </svg>
              Next
            </button>
          </div>
          <div className="flex flex-col justify-center mt-4">
            <AnimatePresence mode="wait">
              <motion.blockquote
                key={quoteIndex}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x:-20 }}
                transition={{ duration: 0.3 }}
                className="text-lg font-medium leading-relaxed italic text-slate-800 dark:text-slate-200 text-center"
              >
                "{lines[quoteIndex]}"
              </motion.blockquote>
            </AnimatePresence>
          </div>
          <div className="mt-4 flex justify-end">
            <p className="text-xs font-medium text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-full select-none">
              {quoteIndex+1}/{lines.length}
            </p>
          </div>
        </div>
      </motion.div>
      </div>
    </div>
  )
}