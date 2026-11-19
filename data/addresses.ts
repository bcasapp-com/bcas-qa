export interface PlaceSuggestion {
  placeId: string
  mainText: string
  secondaryText: string
}

// Same shape the app's /api/places/details route returns
export interface PlaceDetails {
  street: string
  streetNumber: string
  city: string
  province: string
  postalCode: string
  country: string
  formattedAddress: string
}

// What the app saves on the user once the suggestion is confirmed: the street and its number go
// together in `address`, and the residence country comes from the place
export interface StoredAddress {
  address: string
  zipCode: string
  city: string
  residenceCountry: string
}

export interface AddressFixture {
  searchText: string
  suggestion: PlaceSuggestion
  details: PlaceDetails
  stored: StoredAddress
}

export const addresses = {
  granVia1: {
    searchText: 'Calle Gran Vía 1',
    suggestion: {
      placeId: 'qa-place-gran-via-1',
      mainText: 'Calle Gran Vía, 1',
      secondaryText: 'Madrid, España'
    },
    details: {
      street: 'Calle Gran Vía',
      streetNumber: '1',
      city: 'Madrid',
      province: 'Madrid',
      postalCode: '28013',
      country: 'ES',
      formattedAddress: 'Calle Gran Vía, 1, 28013 Madrid, España'
    },
    stored: {
      address: 'Calle Gran Vía, 1',
      zipCode: '28013',
      city: 'Madrid',
      residenceCountry: 'ES'
    }
  },
  passeigDeGracia43: {
    searchText: 'Passeig de Gràcia 43',
    suggestion: {
      placeId: 'qa-place-passeig-de-gracia-43',
      mainText: 'Passeig de Gràcia, 43',
      secondaryText: 'Barcelona, España'
    },
    details: {
      street: 'Passeig de Gràcia',
      streetNumber: '43',
      city: 'Barcelona',
      province: 'Barcelona',
      postalCode: '08007',
      country: 'ES',
      formattedAddress: 'Passeig de Gràcia, 43, 08007 Barcelona, España'
    },
    stored: {
      address: 'Passeig de Gràcia, 43',
      zipCode: '08007',
      city: 'Barcelona',
      residenceCountry: 'ES'
    }
  }
} satisfies Record<string, AddressFixture>

// The mocked address search only knows these addresses; any other text gets no suggestions
export const knownAddresses: AddressFixture[] = Object.values(addresses)

// Typed against the real Google Places search, so it must stay a well-known existing address
export const realAddressSearchText = 'Calle Gran Vía 1, Madrid'
