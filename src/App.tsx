import { Route, Routes } from 'react-router'
import Layout from './components/Layout'
import HomePage from './pages/HomePage'
import ExplorePage from './pages/ExplorePage'
import ProductPage from './pages/ProductPage'
import ComingSoonPage from './pages/ComingSoonPage'
import NotFoundPage from './pages/NotFoundPage'

// El "mapa" de la web: qué página se enseña para cada URL.
// Todas van dentro de <Layout>, que pone la cabecera y el menú.
function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/explore" element={<ExplorePage />} />
        <Route path="/item/:id" element={<ProductPage />} />
        <Route
          path="/sell"
          element={
            <ComingSoonPage
              title="Sell an item"
              description="Publishing listings with photos will be available once student accounts are live."
            />
          }
        />
        <Route
          path="/favorites"
          element={<ComingSoonPage title="Favorites" description="Save items you like and find them here later." />}
        />
        <Route
          path="/profile"
          element={
            <ComingSoonPage title="Your profile" description="Manage your listings and mark items as reserved or sold." />
          }
        />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}

export default App
