import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { Pencil, Trash2 } from 'lucide-react'
import { deleteListing, setListingStatus } from '../lib/listings'
import type { Listing, ListingStatus } from '../lib/listings'

const STATUSES: { value: ListingStatus; label: string; hint: string }[] = [
  { value: 'available', label: 'Available', hint: 'Visible to everyone in Explore.' },
  { value: 'reserved', label: 'Reserved', hint: 'Still visible, with a "Reserved" badge.' },
  { value: 'sold', label: 'Sold', hint: 'Hidden from Explore. Still in your profile.' },
]

// Panel que solo ve el dueño del anuncio: cambiar estado, editar y borrar.
function OwnerPanel({ listing, onChanged }: { listing: Listing; onChanged: () => void }) {
  const navigate = useNavigate()
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')

  async function changeStatus(status: ListingStatus) {
    if (status === listing.status) return
    setBusy(true)
    setMessage('')
    try {
      await setListingStatus(listing.id, status)
      setMessage(status === 'sold' ? 'Your item has been marked as sold.' : `Marked as ${status}.`)
      onChanged()
    } catch {
      setMessage('Could not update the status. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  async function remove() {
    const ok = window.confirm(
      'Delete this listing for good?\n\nIts photos and the conversations about it will be deleted too. ' +
        'If you sold it, you can mark it as "Sold" instead.',
    )
    if (!ok) return
    setBusy(true)
    try {
      await deleteListing(listing)
      navigate('/profile', { replace: true })
    } catch {
      setBusy(false)
      setMessage('Could not delete the listing. Please try again.')
    }
  }

  const current = STATUSES.find((status) => status.value === listing.status)

  return (
    <section className="space-y-4 rounded-2xl border border-rosa/30 bg-rojo/10 p-4">
      <p className="text-sm font-semibold text-rosa">This is your listing</p>

      <div>
        <p className="mb-2 text-sm text-white/80">Status</p>
        <div className="grid grid-cols-3 gap-1 rounded-full bg-white/5 p-1">
          {STATUSES.map((status) => (
            <button
              key={status.value}
              disabled={busy}
              onClick={() => changeStatus(status.value)}
              className={`rounded-full py-2 text-sm font-medium transition disabled:opacity-60 ${
                listing.status === status.value
                  ? 'btn-primary text-white'
                  : 'text-white/70 hover:bg-white/10'
              }`}
            >
              {status.label}
            </button>
          ))}
        </div>
        <p className="mt-1 text-xs text-white/50">{current?.hint}</p>
      </div>

      <div className="flex gap-2">
        <Link
          to={`/item/${listing.id}/edit`}
          className="flex flex-1 items-center justify-center gap-2 rounded-full border border-white/20 bg-white/5 px-4 py-2.5 text-sm font-semibold hover:border-white/40"
        >
          <Pencil className="h-4 w-4" /> Edit
        </Link>
        <button
          disabled={busy}
          onClick={remove}
          className="flex items-center justify-center gap-2 rounded-full border border-rojo/50 px-4 py-2.5 text-sm font-semibold text-rosa hover:bg-rojo/20 disabled:opacity-60"
        >
          <Trash2 className="h-4 w-4" /> Delete
        </button>
      </div>

      {message && <p className="text-sm text-white/80">{message}</p>}
    </section>
  )
}

export default OwnerPanel
