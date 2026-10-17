import { useNavigate, useParams } from 'react-router'
import ListingForm from '../components/ListingForm'
import { fetchListing, updateListing } from '../lib/listings'
import { useAuth } from '../lib/auth'
import { useQuery } from '../lib/useQuery'
import NotFoundPage from './NotFoundPage'

// Editar un anuncio tuyo: el mismo formulario que para vender, ya relleno.
function EditListingPage() {
  const { id } = useParams()
  const { session } = useAuth()
  const navigate = useNavigate()
  const { data: listing, loading, error } = useQuery(`edit|${id}`, () => fetchListing(Number(id)))

  if (loading) return <p className="py-20 text-center text-white/60">Loading…</p>
  if (error) return <p className="py-20 text-center text-rosa">{error}</p>
  // Si no existe o no es tuyo, no se puede editar (la base de datos tampoco lo permitiría).
  if (!listing || listing.seller_id !== session!.user.id) return <NotFoundPage />

  return (
    <ListingForm
      heading="Edit listing"
      subheading="Update your photos, price or details."
      submitLabel="Save changes"
      listing={listing}
      onSubmit={async (values, photos, onProgress) => {
        const originalPaths = listing.images.map((image) => image.path)
        await updateListing(session!.user.id, listing.id, values, photos, originalPaths, onProgress)
        navigate(`/item/${listing.id}`)
      }}
    />
  )
}

export default EditListingPage
