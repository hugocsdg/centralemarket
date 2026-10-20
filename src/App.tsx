import { lazy, Suspense } from 'react'
import type { ReactNode } from 'react'
import { Navigate, Route, Routes } from 'react-router'
import Layout from './components/Layout'
import RequireAuth from './components/RequireAuth'
import { useAuth } from './lib/auth'
import { introSeen } from './lib/intro'

// Cada página se descarga solo cuando hace falta (así la intro no carga el código de la app,
// y la app no carga las animaciones de la intro).
const HomePage = lazy(() => import('./pages/HomePage'))
const ExplorePage = lazy(() => import('./pages/ExplorePage'))
const ProductPage = lazy(() => import('./pages/ProductPage'))
const LoginPage = lazy(() => import('./pages/LoginPage'))
const ProfilePage = lazy(() => import('./pages/ProfilePage'))
const MyProfilePage = lazy(() => import('./pages/MyProfilePage'))
const DeleteAccountPage = lazy(() => import('./pages/DeleteAccountPage'))
const InfoPage = lazy(() => import('./pages/InfoPage'))
const SellPage = lazy(() => import('./pages/SellPage'))
const MessagesPage = lazy(() => import('./pages/MessagesPage'))
const ChatPage = lazy(() => import('./pages/ChatPage'))
const EditListingPage = lazy(() => import('./pages/EditListingPage'))
const FavoritesPage = lazy(() => import('./pages/FavoritesPage'))
const EventsPage = lazy(() => import('./pages/EventsPage'))
const FoodPage = lazy(() => import('./pages/FoodPage'))
const UserPage = lazy(() => import('./pages/UserPage'))
const NotificationsPage = lazy(() => import('./pages/NotificationsPage'))
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'))
const IntroPage = lazy(() => import('./pages/IntroPage'))

// El "mapa" de la web: qué página se enseña para cada URL.
// Todas van dentro de <Layout>, que pone la cabecera y el menú.
// Las que van dentro de <RequireAuth> piden iniciar sesión.
// La portada "/" depende de si has entrado: sin sesión ves la introducción, con sesión la web.
function App() {
  return (
    <Suspense fallback={null}>
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
          <Route path="/events" element={<EventsPage />} />
          <Route path="/food" element={<FoodPage />} />
          <Route path="/user/:id" element={<UserPage />} />
          <Route
            path="/notifications"
            element={
              <RequireAuth>
                <NotificationsPage />
              </RequireAuth>
            }
          />
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
                <FavoritesPage />
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
          <Route
            path="/profile/me"
            element={
              <RequireAuth>
                <MyProfilePage />
              </RequireAuth>
            }
          />
          <Route
            path="/profile/delete"
            element={
              <RequireAuth>
                <DeleteAccountPage />
              </RequireAuth>
            }
          />
          {/* Ayuda y legal: se pueden leer sin sesión */}
          <Route path="/info/:slug" element={<InfoPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </Suspense>
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
