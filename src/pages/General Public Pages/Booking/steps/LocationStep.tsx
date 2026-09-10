import {
  Check,
  Crosshair,
  Home,
  LoaderCircle,
  MapPin,
} from 'lucide-react'

import {
  useEffect,
  useState,
} from 'react'

import {
  MapContainer,
  Marker,
  TileLayer,
  useMap,
  useMapEvents,
} from 'react-leaflet'

import L from 'leaflet'

import type {
  BookingLocation,
} from '../../../../lib/bookingFlow'

import './LocationStep.css'
import 'leaflet/dist/leaflet.css'

type LocationStepProps = {
  location: BookingLocation
  address: string
  city: string
  pincode: string

  latitude: number | null
  longitude: number | null

  onChangeLocation: (
    location: BookingLocation,
  ) => void

  onChangeAddress: (
    address: string,
  ) => void

  onChangeCity: (
    city: string,
  ) => void

  onChangePincode: (
    pincode: string,
  ) => void

  onChangeCoordinates: (
    latitude: number | null,
    longitude: number | null,
  ) => void
}

type Coordinates = {
  lat: number
  lng: number
}

/*
 * Default map position.
 *
 * This is only used before the customer chooses
 * their current location or another map position.
 */
const DEFAULT_POSITION: Coordinates = {
  lat: 12.9716,
  lng: 77.5946,
}

/*
 * Custom marker.
 *
 * Using a divIcon avoids the common Leaflet/Vite
 * default-marker asset problem.
 */
const locationMarkerIcon =
  L.divIcon({
    className:
      'booking-map-marker-wrapper',
    html: `
      <div class="booking-map-marker">
        <div class="booking-map-marker-dot"></div>
      </div>
    `,
    iconSize: [42, 42],
    iconAnchor: [21, 42],
  })

/*
 * Moves the map when coordinates change.
 */
function MapCenterController({
  position,
}: {
  position: Coordinates
}) {
  const map = useMap()

  useEffect(() => {
    map.flyTo(
      [position.lat, position.lng],
      Math.max(map.getZoom(), 16),
      {
        duration: 0.7,
      },
    )
  }, [
    map,
    position.lat,
    position.lng,
  ])

  return null
}

/*
 * Handles clicking directly on the map.
 */
function MapClickHandler({
  onSelect,
}: {
  onSelect: (
    coordinates: Coordinates,
  ) => void
}) {
  useMapEvents({
    click(event) {
      onSelect({
        lat: event.latlng.lat,
        lng: event.latlng.lng,
      })
    },
  })

  return null
}

/*
 * Reverse geocoding through OpenStreetMap Nominatim.
 *
 * We only call this after an intentional location
 * selection. We do NOT run autocomplete or continuous
 * map requests.
 */
async function reverseGeocode(
  coordinates: Coordinates,
) {
  const params =
    new URLSearchParams({
      format: 'jsonv2',
      lat: String(
        coordinates.lat,
      ),
      lon: String(
        coordinates.lng,
      ),
      addressdetails: '1',
      zoom: '18',
      'accept-language':
        'en-IN,en',
    })

  const response =
    await fetch(
      `https://nominatim.openstreetmap.org/reverse?${params.toString()}`,
      {
        headers: {
          Accept:
            'application/json',
        },
      },
    )

  if (!response.ok) {
    throw new Error(
      'Unable to find address',
    )
  }

  return response.json()
}

/*
 * Convert the returned OSM address
 * into the existing booking fields.
 */
function getAddressParts(
  data: {
    display_name?: string
    address?: Record<
      string,
      string | undefined
    >
  },
) {
  const address =
    data.address ?? {}

  const city =
    address.city ??
    address.town ??
    address.village ??
    address.municipality ??
    address.county ??
    ''

  const pincode =
    address.postcode ?? ''

  const roadParts = [
    address.house_number,
    address.road,
    address.neighbourhood,
    address.suburb,
  ].filter(Boolean)

  const roadAddress =
    roadParts.join(', ')

  const fullAddress =
    roadAddress ||
    data.display_name ||
    ''

  return {
    address: fullAddress,
    city,
    pincode,
  }
}

function LocationStep({
  location,
  address,
  city,
  pincode,
  latitude,
  longitude,
  onChangeLocation,
  onChangeAddress,
  onChangeCity,
  onChangePincode,
  onChangeCoordinates,
}: LocationStepProps) {
  const selectedPosition: Coordinates = {
  lat:
    latitude ??
    DEFAULT_POSITION.lat,
  lng:
    longitude ??
    DEFAULT_POSITION.lng,
}

  const [
    isLocating,
    setIsLocating,
  ] = useState(false)

  const [
    isSearchingAddress,
    setIsSearchingAddress,
  ] = useState(false)

  const [
    mapError,
    setMapError,
  ] = useState('')


const mapCenter: [
  number,
  number,
] = [
  selectedPosition.lat,
  selectedPosition.lng,
]
  /*
   * Get address from selected coordinates.
   */
  const applyCoordinates =
  async (
    coordinates: Coordinates,
  ) => {
    onChangeCoordinates(
      coordinates.lat,
      coordinates.lng,
    )

    setMapError('')
      setIsSearchingAddress(true)

      try {
        const data =
          await reverseGeocode(
            coordinates,
          )

        const parts =
          getAddressParts(
            data,
          )

        if (parts.address) {
          onChangeAddress(
            parts.address,
          )
        }

        if (parts.city) {
          onChangeCity(
            parts.city,
          )
        }

        if (parts.pincode) {
          onChangePincode(
            parts.pincode,
          )
        }
      } catch {
        setMapError(
          'We could not find the address automatically. Please enter it below.',
        )
      } finally {
        setIsSearchingAddress(
          false,
        )
      }
    }

  /*
   * Use browser/device location.
   */
  const handleCurrentLocation =
    () => {
      if (
        !navigator.geolocation
      ) {
        setMapError(
          'Location services are not supported by this browser.',
        )

        return
      }

      setIsLocating(true)
      setMapError('')

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coordinates =
            {
              lat: position.coords
                .latitude,
              lng: position.coords
                .longitude,
            }

          setIsLocating(false)

          void applyCoordinates(
            coordinates,
          )
        },
        (error) => {
          setIsLocating(false)

          if (
            error.code ===
            error.PERMISSION_DENIED
          ) {
            setMapError(
              'Location permission was denied. Please allow location access or select your location on the map.',
            )
          } else if (
            error.code ===
            error.POSITION_UNAVAILABLE
          ) {
            setMapError(
              'Your current location is unavailable. Please select your location on the map.',
            )
          } else {
            setMapError(
              'Unable to get your current location. Please select your location on the map.',
            )
          }
        },
        {
          enableHighAccuracy:
            true,
          timeout: 10000,
          maximumAge: 300000,
        },
      )
    }

  /*
   * Customer clicks the map.
   */
  const handleMapSelection =
    (
      coordinates: Coordinates,
    ) => {
      void applyCoordinates(
        coordinates,
      )
    }

  return (
    <section className="booking-panel">

      <div className="booking-panel-heading">
        <div className="booking-step-label">
          STEP 04
        </div>

        <h2>
          Where should we
          <em> meet?</em>
        </h2>

        <p>
          Choose between our
          studio experience or a
          home service.
        </p>
      </div>

      {/* =====================================================
          LOCATION OPTIONS
      ===================================================== */}

      <div className="booking-location-options">

        {/* STUDIO */}

        <button
          type="button"
          className={
            location === 'studio'
              ? 'booking-location-option active'
              : 'booking-location-option'
          }
          onClick={() =>
            onChangeLocation(
              'studio',
            )
          }
        >
          <span className="booking-location-icon">
            <MapPin size={21} />
          </span>

          <span className="booking-location-copy">
            <strong>
              WildFloral Studio
            </strong>

            <small>
              Premium studio
              experience
            </small>
          </span>

          {location ===
            'studio' && (
            <Check size={18} />
          )}
        </button>

        {/* HOME */}

        <button
          type="button"
          className={
            location === 'home'
              ? 'booking-location-option active'
              : 'booking-location-option'
          }
          onClick={() =>
            onChangeLocation(
              'home',
            )
          }
        >
          <span className="booking-location-icon">
            <Home size={21} />
          </span>

          <span className="booking-location-copy">
            <strong>
              Home Service
            </strong>

            <small>
              We'll come to your
              location
            </small>
          </span>

          {location ===
            'home' && (
            <Check size={18} />
          )}
        </button>

      </div>

      {/* =====================================================
          STUDIO
      ===================================================== */}

      {location === 'studio' ? (
        <div className="booking-studio-info">

          <MapPin size={20} />

          <div>
            <strong>
              WildFloral Beauty
            </strong>

            <span>
              Your studio address will
              be confirmed with your
              appointment details.
            </span>
          </div>

        </div>
      ) : (
        <div className="booking-home-address">

          {/* =================================================
              HOME ADDRESS HEADER
          ================================================= */}

          <div className="booking-location-form-heading">

            <div>
              <strong>
                Home service address
              </strong>

              <span>
                Choose your location
                from the map or use
                your current location.
              </span>
            </div>

            <button
              type="button"
              className="booking-current-location-button"
              onClick={
                handleCurrentLocation
              }
              disabled={
                isLocating ||
                isSearchingAddress
              }
            >
              {isLocating ? (
                <LoaderCircle
                  size={16}
                  className="booking-spin"
                />
              ) : (
                <Crosshair
                  size={16}
                />
              )}

              {isLocating
                ? 'Finding location...'
                : 'Use current location'}
            </button>

          </div>

          {/* =================================================
              MAP
          ================================================= */}

          <div className="booking-map-wrapper">

            <MapContainer
              center={mapCenter}
              zoom={13}
              scrollWheelZoom
              className="booking-map"
            >

              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                maxZoom={19}
              />

              <MapCenterController
                position={
                  selectedPosition
                }
              />

              <MapClickHandler
                onSelect={
                  handleMapSelection
                }
              />

              <Marker
                position={mapCenter}
                icon={
                  locationMarkerIcon
                }
              />

            </MapContainer>

            <div className="booking-map-overlay">
              <MapPin size={15} />

              <span>
                Tap anywhere on the map
                to choose your service
                location
              </span>
            </div>

          </div>

          {/* =================================================
              MAP STATUS
          ================================================= */}

          {isSearchingAddress && (
            <div className="booking-map-status">
              <LoaderCircle
                size={15}
                className="booking-spin"
              />

              <span>
                Finding address...
              </span>
            </div>
          )}

          {mapError && (
            <div className="booking-map-error">
              {mapError}
            </div>
          )}

          {/* =================================================
              ADDRESS FORM
          ================================================= */}

          <div className="booking-selected-location">

            <div className="booking-selected-location-heading">

              <div>
                <MapPin size={17} />

                <div>
                  <strong>
                    Selected location
                  </strong>

                  <span>
                    You can edit the
                    address if needed.
                  </span>
                </div>
              </div>

              <span className="booking-location-selected-badge">
                Location selected
              </span>

            </div>

            <label>
              <span>
                Complete address *
              </span>

              <textarea
                value={address}
                onChange={(event) =>
                  onChangeAddress(
                    event.target.value,
                  )
                }
                placeholder="House / Flat number, street, area"
                rows={4}
              />
            </label>

            <div className="booking-form-grid">

              <label>
                <span>
                  City *
                </span>

                <input
                  type="text"
                  value={city}
                  onChange={(event) =>
                    onChangeCity(
                      event.target.value,
                    )
                  }
                  placeholder="Your city"
                  autoComplete="address-level2"
                />
              </label>

              <label>
                <span>
                  Pincode *
                </span>

                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={pincode}
                  onChange={(event) =>
                    onChangePincode(
                      event.target.value.replace(
                        /\D/g,
                        '',
                      ),
                    )
                  }
                  placeholder="560001"
                  autoComplete="postal-code"
                />
              </label>

            </div>

          </div>

        </div>
      )}

    </section>
  )
}

export default LocationStep