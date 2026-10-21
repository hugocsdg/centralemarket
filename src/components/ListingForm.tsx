import { useEffect, useRef, useState } from 'react'
import type { ChangeEvent, FormEvent, ReactNode } from 'react'
import { Camera, X } from 'lucide-react'
import { categories } from '../data/categories'
import { CONDITIONS, DIETARY, LOCATIONS } from '../lib/listings'
import type { Condition, Dietary, Listing, NewListing, PhotoItem } from '../lib/listings'
import { imageUrl } from '../lib/listings'

const MAX_PHOTOS = 6

// <input type="datetime-local"> trabaja con "2026-10-25T22:00" en la hora del móvil.
function toLocalInput(iso: string | null | undefined) {
  if (!iso) return ''
  const date = new Date(iso)
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset())
  return date.toISOString().slice(0, 16)
}

type ListingFormProps = {
  heading: string
  subheading: string
  submitLabel: string
  // Al editar: el anuncio actual, para rellenar el formulario.
  listing?: Listing
  // Al publicar: categoría ya elegida (p. ej. desde "Sell a ticket" en Events).
  initialCategory?: string
  // Qué hacer al enviar (publicar o guardar cambios). Si falla, lanza un error.
  onSubmit: (values: NewListing, photos: PhotoItem[], onProgress: (message: string) => void) => Promise<void>
}

// Formulario de anuncio, el mismo para publicar y para editar.
// Pensado para hacerlo desde el móvil en menos de un minuto.
function ListingForm({ heading, subheading, submitLabel, listing, initialCategory, onSubmit }: ListingFormProps) {
  const [photos, setPhotos] = useState<PhotoItem[]>(
    () => listing?.images.map((image) => ({ kind: 'existing', path: image.path, preview: imageUrl(image.path) })) ?? [],
  )
  const [title, setTitle] = useState(listing?.title ?? '')
  const [category, setCategory] = useState(listing?.category ?? initialCategory ?? '')
  const [condition, setCondition] = useState<Condition | ''>(listing?.condition ?? '')
  const [price, setPrice] = useState(listing && listing.price > 0 ? String(listing.price) : '')
  const [isFree, setIsFree] = useState(listing?.price === 0)
  const [priceUnit, setPriceUnit] = useState(listing ? (listing.price_unit ?? '') : '/h')
  const [location, setLocation] = useState(listing?.location ?? '')
  const [description, setDescription] = useState(listing?.description ?? '')
  const [movingOut, setMovingOut] = useState(listing?.moving_out ?? false)
  // Entradas y comida
  const [eventAt, setEventAt] = useState(toLocalInput(listing?.event_at))
  const [readyAt, setReadyAt] = useState(toLocalInput(listing?.ready_at))
  const [quantity, setQuantity] = useState(listing?.quantity ? String(listing.quantity) : '')
  const [dietary, setDietary] = useState<Dietary[]>(listing?.dietary ?? [])
  const [allergens, setAllergens] = useState(listing?.allergens ?? '')
  // Si ya estaba publicado, la confirmación (comida/entradas) ya se aceptó.
  const [confirmed, setConfirmed] = useState(Boolean(listing))

  const [error, setError] = useState('')
  const [progress, setProgress] = useState('')
  const errorRef = useRef<HTMLDivElement>(null)

  const isService = category === 'services'
  const isTicket = category === 'tickets'
  const isFood = category === 'food'
  // Servicios, entradas y comida no tienen "estado" (nuevo, como nuevo…).
  const hasCondition = Boolean(category) && !isService && !isTicket && !isFood
  const needsConfirmation = isFood || isTicket

  // Liberar la memoria de las vistas previas al salir de la página.
  const photosRef = useRef(photos)
  useEffect(() => {
    photosRef.current = photos
  })
  useEffect(
    () => () => photosRef.current.forEach((photo) => photo.kind === 'new' && URL.revokeObjectURL(photo.preview)),
    [],
  )

  function addPhotos(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? [])
    const room = MAX_PHOTOS - photos.length
    if (files.length > room) setError(`You can add up to ${MAX_PHOTOS} photos.`)
    const added = files
      .slice(0, room)
      .map((file): PhotoItem => ({ kind: 'new', file, preview: URL.createObjectURL(file) }))
    setPhotos((current) => [...current, ...added])
    event.target.value = ''
  }

  function removePhoto(index: number) {
    const photo = photos[index]
    if (photo.kind === 'new') URL.revokeObjectURL(photo.preview)
    setPhotos((current) => current.filter((_, i) => i !== index))
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    setError('')

    // Comprobamos todo nosotros (no el navegador) y decimos TODO lo que falta de una vez.
    const numericPrice = isFree ? 0 : Number(price.replace(',', '.'))
    const problems: string[] = []
    if (photos.length === 0) problems.push('Add at least one photo.')
    if (title.trim().length < 3) problems.push('Write a title (at least 3 characters).')
    if (!category) problems.push('Choose a category.')
    if (hasCondition && !condition) problems.push('Choose the condition (New, Like new, Good or Fair).')
    if (isTicket && !eventAt) problems.push('Add the date and time of the event.')
    if (isTicket && eventAt && !listing && new Date(eventAt) < new Date()) problems.push('The event date is in the past.')
    const numericQuantity = quantity ? Number(quantity) : null
    if (numericQuantity !== null && (!Number.isInteger(numericQuantity) || numericQuantity < 1 || numericQuantity > 500)) {
      problems.push(isFood ? 'Portions must be a whole number between 1 and 500.' : 'Tickets must be a whole number between 1 and 500.')
    }
    if (isFood && !allergens.trim()) problems.push('List the allergens (or write "none").')
    if (!isFree && (!price || Number.isNaN(numericPrice) || numericPrice < 0)) {
      problems.push('Enter a price, or tick "Give it away for free".')
    }
    if (numericPrice > 10000) problems.push('Price must be under 10 000 €.')
    if (location.trim().length < 2) {
      problems.push(isService ? 'Say where you offer it.' : isTicket ? 'Add the venue.' : 'Add a pickup location.')
    }
    if (needsConfirmation && !confirmed) problems.push('Tick the confirmation box for this category.')

    if (problems.length > 0) {
      setError(problems.join('\n'))
      // Llevar la vista al aviso para que se vea seguro, también en el móvil.
      requestAnimationFrame(() => errorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }))
      return
    }

    try {
      await onSubmit(
        {
          title: title.trim(),
          description: description.trim(),
          category,
          price: numericPrice,
          price_unit: isService && !isFree ? priceUnit || null : null,
          condition: hasCondition ? (condition as Condition) : null,
          location: location.trim(),
          moving_out: hasCondition && movingOut,
          event_at: isTicket && eventAt ? new Date(eventAt).toISOString() : null,
          ready_at: isFood && readyAt ? new Date(readyAt).toISOString() : null,
          quantity: (isTicket || isFood) && quantity ? Number(quantity) : null,
          dietary: isFood ? dietary : [],
          allergens: isFood ? allergens.trim() : null,
        },
        photos,
        setProgress,
      )
    } catch (failure) {
      setProgress('')
      setError(failure instanceof Error ? failure.message : 'Something went wrong. Please try again.')
      requestAnimationFrame(() => errorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }))
    }
  }

  const busy = progress !== ''

  return (
    <form onSubmit={submit} noValidate className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{heading}</h1>
        <p className="mt-1 text-white/60">{subheading}</p>
      </div>

      {/* Fotos */}
      <Section title="Photos" hint={`Up to ${MAX_PHOTOS}. The first one is the cover.`}>
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
          {photos.map((photo, index) => (
            <div key={photo.preview} className="relative aspect-square overflow-hidden rounded-xl border border-white/10">
              <img src={photo.preview} alt="" className="h-full w-full object-cover" />
              {index === 0 && (
                <span className="keep-dark absolute bottom-1 left-1 rounded-full bg-noche/80 px-2 py-0.5 text-[11px] font-semibold">
                  Cover
                </span>
              )}
              <button
                type="button"
                onClick={() => removePhoto(index)}
                aria-label="Remove photo"
                className="keep-dark absolute top-1 right-1 rounded-full bg-noche/80 p-1 after:absolute after:-inset-2 hover:bg-rojo"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
          {photos.length < MAX_PHOTOS && (
            <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-white/20 text-white/60 hover:border-rosa hover:text-white">
              <Camera className="h-6 w-6" />
              <span className="text-xs font-medium">Add photos</span>
              <input type="file" accept="image/*" multiple onChange={addPhotos} className="hidden" />
            </label>
          )}
        </div>
      </Section>

      {/* Información principal */}
      <Section title="Details">
        <Field label="Title">
          <input
            required
            minLength={3}
            maxLength={80}
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder={
              isService
                ? 'e.g. Maths tutoring'
                : isTicket
                  ? 'e.g. Gala night — 1 ticket'
                  : isFood
                    ? 'e.g. Homemade lasagna'
                    : 'e.g. IKEA desk lamp'
            }
            className={inputClass}
          />
        </Field>

        <Field label="Category">
          <select
            required
            value={category}
            onChange={(event) => {
              setCategory(event.target.value)
              setConfirmed(false)
            }}
            className={`${inputClass} [&>option]:bg-noche`}
          >
            <option value="" disabled>
              Choose a category
            </option>
            {categories.map((item) => (
              <option key={item.slug} value={item.slug}>
                {item.name}
              </option>
            ))}
          </select>
        </Field>

        {hasCondition && (
          <Field label="Condition">
            <div className="flex flex-wrap gap-2">
              {CONDITIONS.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setCondition(option)}
                  className={`min-h-11 rounded-full px-4 py-2 text-sm font-medium transition ${
                    condition === option
                      ? 'btn-primary text-white'
                      : 'border border-white/15 bg-white/5 text-white/80 hover:bg-white/10'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </Field>
        )}

        <Field
          label="Description"
          hint={
            isTicket
              ? 'Line-up, dress code, how you hand over the ticket…'
              : isFood
                ? 'Ingredients, portion size, whether to bring a container…'
                : "Size, brand, what's included, any defects…"
          }
        >
          <textarea
            rows={4}
            maxLength={2000}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            className={inputClass}
          />
        </Field>
      </Section>

      {/* Evento: fecha y entradas */}
      {isTicket && (
        <Section title="Event" hint="It shows up in the Events tab, sorted by date.">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Date & time">
              <input
                type="datetime-local"
                value={eventAt}
                onChange={(event) => setEventAt(event.target.value)}
                className={`${inputClass} [color-scheme:dark]`}
              />
            </Field>
            <Field label="Tickets available" hint="Optional">
              <input
                inputMode="numeric"
                value={quantity}
                onChange={(event) => setQuantity(event.target.value.replace(/\D/g, ''))}
                placeholder="1"
                className={inputClass}
              />
            </Field>
          </div>
        </Section>
      )}

      {/* Comida: cuándo, cuánto y qué lleva */}
      {isFood && (
        <Section title="The dish" hint="It shows up in the Food tab.">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Ready for pickup" hint="Optional">
              <input
                type="datetime-local"
                value={readyAt}
                onChange={(event) => setReadyAt(event.target.value)}
                className={`${inputClass} [color-scheme:dark]`}
              />
            </Field>
            <Field label="Portions available" hint="Optional">
              <input
                inputMode="numeric"
                value={quantity}
                onChange={(event) => setQuantity(event.target.value.replace(/\D/g, ''))}
                placeholder="4"
                className={inputClass}
              />
            </Field>
          </div>
          <div>
            <span className="mb-1 block text-sm font-medium text-white/80">Good to know</span>
            <div className="flex flex-wrap gap-2">
              {DIETARY.map((tag) => {
                const on = dietary.includes(tag.value)
                return (
                  <button
                    key={tag.value}
                    type="button"
                    aria-pressed={on}
                    onClick={() =>
                      setDietary((current) => (on ? current.filter((d) => d !== tag.value) : [...current, tag.value]))
                    }
                    className={`min-h-11 rounded-full px-4 py-2 text-sm font-medium transition ${
                      on ? 'btn-primary text-white' : 'border border-white/15 bg-white/5 text-white/80 hover:bg-white/10'
                    }`}
                  >
                    {tag.emoji} {tag.label}
                  </button>
                )
              })}
            </div>
          </div>
          <Field label="Allergens" hint='e.g. "nuts, eggs, milk" — write "none" if there are none.'>
            <input
              maxLength={200}
              value={allergens}
              onChange={(event) => setAllergens(event.target.value)}
              placeholder="nuts, eggs…"
              className={inputClass}
            />
          </Field>
        </Section>
      )}

      {/* Precio */}
      <Section title="Price">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-40">
            <input
              inputMode="decimal"
              disabled={isFree}
              value={isFree ? '0' : price}
              onChange={(event) => setPrice(event.target.value.replace(/[^\d.,]/g, ''))}
              placeholder="0"
              className={`${inputClass} pr-10 disabled:opacity-40`}
            />
            <span className="absolute top-1/2 right-4 -translate-y-1/2 text-white/60">€</span>
          </div>
          {(isFood || isTicket) && <span className="text-sm text-white/60">{isFood ? 'per portion' : 'per ticket'}</span>}
          {isService && !isFree && (
            <select
              value={priceUnit}
              onChange={(event) => setPriceUnit(event.target.value)}
              className={`${inputClass} w-auto [&>option]:bg-noche`}
            >
              <option value="/h">per hour</option>
              <option value="/session">per session</option>
              <option value="">fixed price</option>
            </select>
          )}
          <Check checked={isFree} onChange={setIsFree}>
            Give it away for free
          </Check>
        </div>
      </Section>

      {/* Entrega */}
      <Section title={isService || isTicket ? 'Where' : 'Pickup'}>
        <Field label={isService ? 'Where do you offer it?' : isTicket ? 'Venue' : 'Pickup location'}>
          <input
            required
            minLength={2}
            maxLength={60}
            list="locations"
            value={location}
            onChange={(event) => setLocation(event.target.value)}
            placeholder={isService ? 'e.g. Campus or online' : isTicket ? 'e.g. Campus, Paris…' : 'e.g. Gif-sur-Yvette'}
            className={inputClass}
          />
          <datalist id="locations">
            {LOCATIONS.map((place) => (
              <option key={place} value={place} />
            ))}
          </datalist>
        </Field>
        {hasCondition && (
          <Check checked={movingOut} onChange={setMovingOut}>
            I'm leaving campus soon (adds a "Moving out" badge)
          </Check>
        )}
      </Section>

      {needsConfirmation && (
        <Check checked={confirmed} onChange={setConfirmed}>
          {category === 'food'
            ? 'I confirm this food is freshly made, stored safely and that the allergens above are correct.'
            : 'I confirm that reselling this ticket is allowed by the event organiser.'}
        </Check>
      )}

      {error && (
        <div ref={errorRef} role="alert" className="rounded-xl border border-rojo/50 bg-rojo/20 px-4 py-3 text-sm text-rosa">
          <p className="font-semibold">Almost there! Please fix:</p>
          <ul className="mt-1 list-disc space-y-0.5 pl-5">
            {error.split('\n').map((problem) => (
              <li key={problem}>{problem}</li>
            ))}
          </ul>
        </div>
      )}

      <button
        disabled={busy}
        className="w-full rounded-full btn-primary px-5 py-3.5 font-semibold  disabled:opacity-60"
      >
        {busy ? progress : submitLabel}
      </button>
    </form>
  )
}

const inputClass =
  'w-full rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-white outline-none placeholder:text-white/50 focus:border-rosa'

function Section({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <section className="space-y-4 rounded-3xl glass p-5 backdrop-blur-sm sm:p-6">
      <div>
        <h2 className="text-lg font-bold">{title}</h2>
        {hint && <p className="text-xs text-white/50">{hint}</p>}
      </div>
      {children}
    </section>
  )
}

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-white/80">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-white/50">{hint}</span>}
    </label>
  )
}

function Check({ checked, onChange, children }: { checked: boolean; onChange: (value: boolean) => void; children: ReactNode }) {
  return (
    <label className="flex cursor-pointer items-start gap-2 text-sm text-white/80">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-0.5 h-4 w-4 accent-carmin"
      />
      <span>{children}</span>
    </label>
  )
}

export default ListingForm
