import { useNavigate } from 'react-router'
import ListingForm from '../components/ListingForm'
import { createListing } from '../lib/listings'
import { useAuth } from '../lib/auth'

// Publicar un anuncio nuevo.
function SellPage() {
  const { session } = useAuth()
  const navigate = useNavigate()

  return (
    <ListingForm
      heading="Sell an item"
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
