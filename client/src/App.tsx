import { Navigate, Route, Routes } from 'react-router-dom'
import { ProtectedRoute } from './components/ProtectedRoute'
import { HomePage } from './pages/HomePage'
import { CalendarPage } from './pages/CalendarPage'
import { JournalPage, JournalTodayRedirect } from './pages/JournalPage'
import { SearchPage } from './pages/SearchPage'
import { NoteEditPage } from './pages/notes/NoteEditPage'
import { NoteNewPage } from './pages/notes/NoteNewPage'
import { NotesIndexPage } from './pages/notes/NotesIndexPage'
import { NotesLayout } from './pages/notes/NotesLayout'
import { TasksPage } from './pages/TasksPage'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'

export default function App() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <HomePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/tasks"
        element={
          <ProtectedRoute>
            <TasksPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/calendar"
        element={
          <ProtectedRoute>
            <CalendarPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/notes"
        element={
          <ProtectedRoute>
            <NotesLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<NotesIndexPage />} />
        <Route path="new" element={<NoteNewPage />} />
        <Route path=":noteId" element={<NoteEditPage />} />
      </Route>
      <Route
        path="/journal"
        element={
          <ProtectedRoute>
            <JournalTodayRedirect />
          </ProtectedRoute>
        }
      />
      <Route
        path="/journal/:date"
        element={
          <ProtectedRoute>
            <JournalPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/search"
        element={
          <ProtectedRoute>
            <SearchPage />
          </ProtectedRoute>
        }
      />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
