export interface PlaceSuggestion {
  id: string;
  placeId: string;
  label: string;
  address: string;
}

export interface PlaceDetails {
  id: string;
  placeId: string;
  label: string;
  address: string;
  coordinates: {
    lat: number;
    lng: number;
  };
}

let autocompleteService:
  | google.maps.places.AutocompleteService
  | null = null;

let placesService:
  | google.maps.places.PlacesService
  | null = null;

function ensureGooglePlacesAvailable() {
  if (
    typeof window === "undefined" ||
    !window.google?.maps?.places
  ) {
    throw new Error(
      "Google Places is not available. Make sure the Places library is loaded.",
    );
  }
}

function getAutocompleteService() {
  ensureGooglePlacesAvailable();

  if (!autocompleteService) {
    autocompleteService =
      new google.maps.places.AutocompleteService();
  }

  return autocompleteService;
}

function getPlacesService() {
  ensureGooglePlacesAvailable();

  if (!placesService) {
    const element = document.createElement("div");

    placesService =
      new google.maps.places.PlacesService(element);
  }

  return placesService;
}

export function searchPlaces(
  query: string,
): Promise<PlaceSuggestion[]> {
  const trimmedQuery = query.trim();

  if (trimmedQuery.length < 3) {
    return Promise.resolve([]);
  }

  const service = getAutocompleteService();

  return new Promise((resolve, reject) => {
    service.getPlacePredictions(
      {
        input: trimmedQuery,

        // Keep ride search primarily within Nigeria.
        componentRestrictions: {
          country: "ng",
        },
      },
      (predictions, status) => {
        if (
          status ===
          google.maps.places.PlacesServiceStatus.ZERO_RESULTS
        ) {
          resolve([]);
          return;
        }

        if (
          status !==
          google.maps.places.PlacesServiceStatus.OK
        ) {
          reject(
            new Error(
              `Unable to search locations: ${status}`,
            ),
          );
          return;
        }

        const results =
          predictions?.map((prediction) => {
            const mainText =
              prediction.structured_formatting
                ?.main_text ??
              prediction.description;

            const secondaryText =
              prediction.structured_formatting
                ?.secondary_text ?? "";

            return {
              id: prediction.place_id,
              placeId: prediction.place_id,
              label: mainText,
              address:
                secondaryText ||
                prediction.description,
            };
          }) ?? [];

        resolve(results);
      },
    );
  });
}

export function getPlaceDetails(
  placeId: string,
): Promise<PlaceDetails> {
  const service = getPlacesService();

  return new Promise((resolve, reject) => {
    service.getDetails(
      {
        placeId,
        fields: [
          "place_id",
          "name",
          "formatted_address",
          "geometry",
        ],
      },
      (place, status) => {
        if (
          status !==
            google.maps.places.PlacesServiceStatus.OK ||
          !place ||
          !place.geometry?.location
        ) {
          reject(
            new Error(
              "Unable to get location details.",
            ),
          );
          return;
        }

        const lat =
          place.geometry.location.lat();

        const lng =
          place.geometry.location.lng();

        resolve({
          id: place.place_id ?? placeId,
          placeId:
            place.place_id ?? placeId,
          label:
            place.name ??
            place.formatted_address ??
            "Selected location",
          address:
            place.formatted_address ??
            place.name ??
            "Selected location",
          coordinates: {
            lat,
            lng,
          },
        });
      },
    );
  });
}