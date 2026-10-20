import { useNavigate, useSearchParams } from 'react-router'
import ListingForm from '../components/ListingForm'
import { createListing } from '../lib/listings'
import { getCategory } from '../data/categories'
import { useAuth } from '../lib/auth'

// Publicar un anuncio nuevo.
// "Sell a ticket" (Events) y "Sell a dish" (Food) llegan con ?category=tickets o ?category=food.
function SellPage() {
  const { session } = useAuth()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const initialCategory = getCategory(params.get('category') ?? '')?.slug
  const heading = initialCategory === 'tickets' ? 'Sell a ticket' : initialCategory === 'food' ? 'Sell a dish' : 'Sell an item'

  return (
    <ListingForm
      // Al cambiar de "Sell a ticket" a "Sell" el formulario empieza de cero.
      key={initialCategory ?? 'any'}
      heading={heading}
      initialCategory={initialCategory}
      subheading="Takes less than a minute. Buyers will message you here on CentraleMarket."
      submitLabel="Publish listing"
      onSubmit={async (values, photos, onProgress) => {
        const files = photos.flatMap((photo) => (photo.kind === 'new' ? [photo.file] : []))
        const id = await createListing(session!.user.id, values, files, onProgress)
        navigate(`/item/${id}?published=1`)
      }}
    />
  )
}

export default SellPage
