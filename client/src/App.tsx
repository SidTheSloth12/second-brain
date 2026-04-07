import { AnimatePresence, motion } from 'framer-motion'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { ProtectedRoute } from './components/ProtectedRoute'
import { AppHeader } from './components/AppShell'
import { useAuth } from './auth/useAuth'
import { HomePage } from './pages/HomePage'
import { CalendarPage } from './pages/CalendarPage'
import { JournalPage, JournalTodayRedirect } from './pages/JournalPage'
import { SearchPage } from './pages/SearchPage'
import { NoteEditPage } from './pages/notes/NoteEditPage'
import { NoteNewPage } from './pages/notes/NoteNewPage'
import { NotesIndexPage } from './pages/notes/NotesIndexPage'
import { NotesGraphPage } from './pages/notes/NotesGraphPage'
import { NotesLayout } from './pages/notes/NotesLayout'
import { TasksPage } from './pages/TasksPage'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'

/**
 * Wraps page content in a fade+slide animation.
 * Only the content below the header animates — the header itself stays put.
 */
function PageTransition({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
      className="w-full"
    >
      {children}
    </motion.div>
  )
}

/**
 * The persistent root layout: renders the header once (never unmounts),
 * then renders routed page content underneath with transitions.
 */
function RootLayout() {
  const { user, logout } = useAuth()
  const location = useLocation()

  // On login/register pages, don't show the app header
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register'

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 transition-colors duration-300 dark:bg-slate-950 dark:text-slate-100">
      {!isAuthPage && user && (
        <AppHeader user={user} onLogout={logout} />
      )}
      <AnimatePresence mode="wait" initial={false}>
        <Routes location={location} key={location.pathname}>
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <PageTransition>
                  <HomePage />
                </PageTransition>
              </ProtectedRoute>
            }
          />
          <Route
            path="/tasks"
            element={
              <ProtectedRoute>
                <PageTransition>
                  <TasksPage />
                </PageTransition>
              </ProtectedRoute>
            }
          />
          <Route
            path="/calendar"
            element={
              <ProtectedRoute>
                <PageTransition>
                  <CalendarPage />
                </PageTransition>
              </ProtectedRoute>
            }
          />
          <Route
            path="/notes"
            element={
              <ProtectedRoute>
                <PageTransition>
                  <NotesLayout />
                </PageTransition>
              </ProtectedRoute>
            }
          >
            <Route index element={<NotesIndexPage />} />
            <Route path="graph" element={<NotesGraphPage />} />
            <Route path="new" element={<NoteNewPage />} />
            <Route path=":noteId" element={<NoteEditPage />} />
          </Route>
          <Route
            path="/journal"
            element={
              <ProtectedRoute>
                <PageTransition>
                  <JournalTodayRedirect />
                </PageTransition>
              </ProtectedRoute>
            }
          />
          <Route
            path="/journal/:date"
            element={
              <ProtectedRoute>
                <PageTransition>
                  <JournalPage />
                </PageTransition>
              </ProtectedRoute>
            }
          />
          <Route
            path="/search"
            element={
              <ProtectedRoute>
                <PageTransition>
                  <SearchPage />
                </PageTransition>
              </ProtectedRoute>
            }
          />
          <Route path="/login" element={<PageTransition><LoginPage /></PageTransition>} />
          <Route path="/register" element={<PageTransition><RegisterPage /></PageTransition>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AnimatePresence>
    </div>
  )
}

export default function App() {
  return <RootLayout />
}
