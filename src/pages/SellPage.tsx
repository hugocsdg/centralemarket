import { useNavigate, useSearchParams } from 'react-router'
import ListingForm from '../components/ListingForm'
import { createListing } from '../lib/listings'
import { getCategory } from '../data/categories'
import { useAuth } from '../lib/auth'
import { useT } from '../i18n/lang'

// Publicar un anuncio nuevo.
// "Sell a ticket" (Events) y "Sell a dish" (Food) llegan con ?category=tickets o ?category=food.
function SellPage() {
  const { session } = useAuth()
  const navigate = useNavigate()
  const t = useT()
  const [params] = useSearchParams()
  const initialCategory = getCategory(params.get('category') ?? '')?.slug
  const heading = initialCategory === 'tickets' ? 'Sell a ticket' : initialCategory === 'food' ? 'Sell a dish' : 'Sell an item'

  return (
    <ListingForm
      // Al cambiar de "Sell a ticket" a "Sell" el formulario empieza de cero.
      key={initialCategory ?? 'any'}
      heading={t(heading)}
      initialCategory={initialCategory}
      subheading={t('Takes less than a minute. Buyers will message you here on CentraleMarket.')}
      submitLabel={t('Publish listing')}
      onSubmit={async (values, photos, onProgress) => {
        const files = photos.flatMap((photo) => (photo.kind === 'new' ? [photo.file] : []))
        const id = await createListing(session!.user.id, values, files, onProgress)
        navigate(`/item/${id}?published=1`)
      }}
    />
  )
}

export default SellPage
