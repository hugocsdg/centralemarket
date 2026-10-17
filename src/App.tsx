import { Navigate, Route, Routes } from 'react-router'
import type { ReactNode } from 'react'
import Layout from './components/Layout'
import RequireAuth from './components/RequireAuth'
import HomePage from './pages/HomePage'
import ExplorePage from './pages/ExplorePage'
import ProductPage from './pages/ProductPage'
import LoginPage from './pages/LoginPage'
import ProfilePage from './pages/ProfilePage'
import SellPage from './pages/SellPage'
import MessagesPage from './pages/MessagesPage'
import ChatPage from './pages/ChatPage'
import EditListingPage from './pages/EditListingPage'
import ComingSoonPage from './pages/ComingSoonPage'
import NotFoundPage from './pages/NotFoundPage'
import IntroPage from './pages/IntroPage'
import { useAuth } from './lib/auth'
import { introSeen } from './lib/intro'

// El "mapa" de la web: qué página se enseña para cada URL.
// Todas van dentro de <Layout>, que pone la cabecera y el menú.
// Las que van dentro de <RequireAuth> piden iniciar sesión.
// La portada "/" depende de si has entrado: sin sesión ves la introducción, con sesión la web.
function App() {
  return (
    <Routes>
      <Route path="/welcome" element={<IntroPage />} />
      <Route element={<Layout />}>
        <Route
          path="/"
          element={
            <IntroGate>
              <HomePage />
            </IntroGate>
          }
        />
        <Route path="/explore" element={<ExplorePage />} />
        <Route path="/item/:id" element={<ProductPage />} />
        <Route
          path="/item/:id/edit"
          element={
            <RequireAuth>
              <EditListingPage />
            </RequireAuth>
          }
        />
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/sell"
          element={
            <RequireAuth>
              <SellPage />
            </RequireAuth>
          }
        />
        <Route
          path="/favorites"
          element={
            <RequireAuth>
              <ComingSoonPage title="Favorites" description="Save items you like and find them here later." />
            </RequireAuth>
          }
        />
        <Route
          path="/messages"
          element={
            <RequireAuth>
              <MessagesPage />
            </RequireAuth>
          }
        />
        <Route
          path="/messages/:id"
          element={
            <RequireAuth>
              <ChatPage />
            </RequireAuth>
          }
        />
        <Route
          path="/profile"
          element={
            <RequireAuth>
              <ProfilePage />
            </RequireAuth>
          }
        />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}

function IntroGate({ children }: { children: ReactNode }) {
  const { session, loading } = useAuth()
  if (loading) return null
  // Sin sesión, siempre la introducción. Con sesión, solo la primera vez en este dispositivo.
  return session && introSeen() ? children : <IntroRedirect />
}

// Sin sesión, la portada es la página de introducción (fuera del marco de la app).
function IntroRedirect() {
  return <Navigate to="/welcome" replace />
}

export default App
