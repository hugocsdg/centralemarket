import ProductCard from './components/ProductCard'
import { products } from './data/products'

function App() {
  return (
    <div className="mx-auto min-h-screen max-w-6xl bg-lavanda p-6">
      <h1 className="text-4xl font-bold text-burdeos">
        Centrale<span className="text-rojo">Market</span>
      </h1>
      <p className="mt-2 text-gray-600">Your campus. Your marketplace.</p>

      <h2 className="mt-10 mb-4 text-2xl font-bold text-burdeos">Fresh on CentraleMarket</h2>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            title={product.title}
            price={product.price}
            condition={product.condition}
            location={product.location}
            image={product.image}
          />
        ))}
      </div>
    </div>
  )
}

export default App

