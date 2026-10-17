import { Route, Routes } from 'react-router'
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

// El "mapa" de la web: qué página se enseña para cada URL.
// Todas van dentro de <Layout>, que pone la cabecera y el menú.
// Las que van dentro de <RequireAuth> piden iniciar sesión.
function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
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

export default App
