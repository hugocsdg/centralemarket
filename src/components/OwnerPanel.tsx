import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { Pencil, Trash2, UserRoundX } from 'lucide-react'
import { deleteListing, setListingStatus } from '../lib/listings'
import type { Listing, ListingStatus } from '../lib/listings'
import { fetchBuyers } from '../lib/reviews'
import Avatar from './Avatar'

const STATUSES: { value: ListingStatus; label: string; hint: string }[] = [
  { value: 'available', label: 'Available', hint: 'Visible to everyone in Explore.' },
  { value: 'reserved', label: 'Reserved', hint: 'Still visible, with a "Reserved" badge.' },
  { value: 'sold', label: 'Sold', hint: 'Hidden from Explore. Still in your profile.' },
]

type Buyer = Awaited<ReturnType<typeof fetchBuyers>>[number]

// Panel que solo ve el dueño del anuncio: cambiar estado, editar y borrar.
// Al marcarlo como vendido, pregunta a quién (para que esa persona pueda valorarte).
function OwnerPanel({ listing, onChanged }: { listing: Listing; onChanged: () => void }) {
  const navigate = useNavigate()
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  // null = cerrado; [] o lista = eligiendo comprador.
  const [buyers, setBuyers] = useState<Buyer[] | null>(null)

  async function changeStatus(status: ListingStatus, soldTo: string | null = null) {
    setBusy(true)
    setMessage('')
    try {
      await setListingStatus(listing.id, status, soldTo)
      setBuyers(null)
      setMessage(
        status === 'sold'
          ? soldTo
            ? 'Marked as sold. The buyer can now rate you.'
            : 'Your item has been marked as sold.'
          : `Marked as ${status}.`,
      )
      onChanged()
    } catch {
      setMessage('Could not update the status. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  async function pick(status: ListingStatus) {
    if (status === listing.status) return
    if (status !== 'sold') return changeStatus(status)
    // Vendido: primero, quién te ha escrito por este anuncio.
    setBusy(true)
    try {
      setBuyers(await fetchBuyers(listing.id))
    } catch {
      setBuyers([])
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
              onClick={() => pick(status.value)}
              className={`min-h-11 rounded-full py-2 text-sm font-medium transition disabled:opacity-60 ${
                listing.status === status.value || (status.value === 'sold' && buyers)
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

      {buyers && (
        <div className="space-y-2 rounded-2xl bg-noche/50 p-3">
          <p className="text-sm font-semibold">Who bought it?</p>
          <p className="text-xs text-white/60">They'll get a notification to rate you.</p>
          <ul className="space-y-1">
            {buyers.map((buyer) => (
              <li key={buyer.buyer_id}>
                <button
                  disabled={busy}
                  onClick={() => changeStatus('sold', buyer.buyer_id)}
                  className="flex min-h-12 w-full items-center gap-3 rounded-xl px-2 text-left text-sm font-medium transition hover:bg-white/10 disabled:opacity-60"
                >
                  <Avatar name={buyer.buyer?.display_name} url={buyer.buyer?.avatar_url} className="h-8 w-8 text-sm" />
                  {buyer.buyer?.display_name}
                </button>
              </li>
            ))}
            <li>
              <button
                disabled={busy}
                onClick={() => changeStatus('sold')}
                className="flex min-h-12 w-full items-center gap-3 rounded-xl px-2 text-left text-sm font-medium text-white/80 transition hover:bg-white/10 disabled:opacity-60"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10">
                  <UserRoundX className="h-4 w-4" />
                </span>
                Someone else / outside CentraleMarket
              </button>
            </li>
          </ul>
          <button onClick={() => setBuyers(null)} className="min-h-11 px-2 text-xs font-semibold text-white/60 hover:text-white">
            Cancel
          </button>
        </div>
      )}

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
