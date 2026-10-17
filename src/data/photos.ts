// Fotos de la introducción. Todas de Unsplash (licencia libre: https://unsplash.com/license).
// Se cargan directamente desde Unsplash en el tamaño que necesitamos.

const IDS = {
  // Escena del MacBook (fotos oscuras y serias)
  deskLamp: '1523380262778-076eb862d38f',
  roadBike: '1532298229144-0ec0c57515c7',
  armchair: '1744559244044-e23c914de361',
  deskSetup: '1510519138101-570d1dca3d66',
  headphonesDark: '1599669454699-248893623440',
  // Otras
  lamp: '1570974802254-4b0ad1a755f5',
  bike: '1591047139334-337807f2b3e5',
  chair: '1612372606404-0ab33e7187ee',
  headphones: '1505740420928-5e560c06d30e',
  party: '1540039155733-5bb30b53aa14',
  coffee: '1620807773206-49c1f2957417',
  books: '1610116306796-6fea9f4fae38',
}

export type PhotoKey = keyof typeof IDS

export function photo(key: PhotoKey, width = 1200, height?: number) {
  const size = height ? `&h=${height}` : ''
  return `https://images.unsplash.com/photo-${IDS[key]}?w=${width}${size}&q=75&auto=format&fit=crop`
}
