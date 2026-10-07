import {
  passengerApi,
} from "./passengerClient";

export interface GeocodeLocation {
  address: string;
  lat: number;
  lng: number;

  placeId?: string;
}

type UnknownRecord =
  Record<string, unknown>;

function isRecord(
  value: unknown,
): value is UnknownRecord {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function getNumber(
  value: unknown,
): number | null {
  if (
    typeof value === "number" &&
    Number.isFinite(value)
  ) {
    return value;
  }

  if (
    typeof value === "string" &&
    value.trim()
  ) {
    const parsed =
      Number(value);

    if (
      Number.isFinite(parsed)
    ) {
      return parsed;
    }
  }

  return null;
}

function getString(
  value: unknown,
): string | null {
  return typeof value ===
      "string" &&
    value.trim()
    ? value.trim()
    : null;
}

function unwrap(
  value: unknown,
): unknown {
  if (!isRecord(value)) {
    return value;
  }

  if (
    value.data !==
    undefined
  ) {
    return value.data;
  }

  if (
    value.result !==
    undefined
  ) {
    return value.result;
  }

  return value;
}

export function normalizeGeocodeResult(
  response: unknown,
  fallbackCoordinates?: {
    lat: number;
    lng: number;
  },
): GeocodeLocation | null {
  const raw =
    unwrap(response);

  if (!isRecord(raw)) {
    return null;
  }

  const location =
    isRecord(raw.location)
      ? raw.location
      : undefined;

  const geometry =
    isRecord(raw.geometry)
      ? raw.geometry
      : undefined;

  const geometryLocation =
    geometry &&
    isRecord(
      geometry.location,
    )
      ? geometry.location
      : undefined;

  const lat =
    getNumber(raw.lat) ??
    getNumber(
      raw.latitude,
    ) ??
    getNumber(
      location?.lat,
    ) ??
    getNumber(
      location?.latitude,
    ) ??
    getNumber(
      geometryLocation?.lat,
    ) ??
    getNumber(
      geometryLocation?.latitude,
    ) ??
    fallbackCoordinates?.lat ??
    null;

  const lng =
    getNumber(raw.lng) ??
    getNumber(raw.lon) ??
    getNumber(
      raw.longitude,
    ) ??
    getNumber(
      location?.lng,
    ) ??
    getNumber(
      location?.lon,
    ) ??
    getNumber(
      location?.longitude,
    ) ??
    getNumber(
      geometryLocation?.lng,
    ) ??
    getNumber(
      geometryLocation?.longitude,
    ) ??
    fallbackCoordinates?.lng ??
    null;

  const address =
    getString(
      raw.address,
    ) ??
    getString(
      raw.formattedAddress,
    ) ??
    getString(
      raw.formatted_address,
    ) ??
    getString(
      raw.displayName,
    ) ??
    getString(
      raw.name,
    );

  if (
    lat === null ||
    lng === null ||
    !address
  ) {
    return null;
  }

  return {
    address,
    lat,
    lng,

    placeId:
      getString(
        raw.placeId,
      ) ??
      getString(
        raw.place_id,
      ) ??
      undefined,
  };
}

export function normalizeGeocodeResults(
  response: unknown,
): GeocodeLocation[] {
  const raw =
    unwrap(response);

  let items: unknown[] =
    [];

  if (
    Array.isArray(raw)
  ) {
    items = raw;
  } else if (
    isRecord(raw)
  ) {
    if (
      Array.isArray(
        raw.results,
      )
    ) {
      items =
        raw.results;
    } else if (
      Array.isArray(
        raw.predictions,
      )
    ) {
      items =
        raw.predictions;
    } else if (
      Array.isArray(
        raw.places,
      )
    ) {
      items =
        raw.places;
    } else {
      items = [raw];
    }
  }

  return items
    .map((item) =>
      normalizeGeocodeResult(
        item,
      ),
    )
    .filter(
      (
        item,
      ): item is GeocodeLocation =>
        item !== null,
    );
}

export const passengerGeocodeApi =
  {
    geocode: (
      address: string,
    ) =>
      passengerApi.post<unknown>(
        "/geocode",
        {
          address,
        },
        {
          authMode:
            "access",
        },
      ),

    reverseGeocode: (
      lat: number,
      lng: number,
    ) =>
      passengerApi.get<unknown>(
        `/geocode/reverse?lat=${encodeURIComponent(
          String(lat),
        )}&lng=${encodeURIComponent(
          String(lng),
        )}`,
        {
          authMode:
            "access",
        },
      ),
  };

// import {
//   passengerApi,
// } from "./passengerClient";

// export type GeocodeResponse =
//   unknown;

// export type ReverseGeocodeResponse =
//   unknown;

// export const passengerGeocodeApi = {
//   geocode(
//     address: string,
//   ) {
//     return passengerApi.post<GeocodeResponse>(
//       "/geocode",
//       {
//         address,
//       },
//       {
//         authMode: "access",
//       },
//     );
//   },

//   reverseGeocode(
//     lat: number,
//     lng: number,
//   ) {
//     const params =
//       new URLSearchParams({
//         lat: String(lat),
//         lng: String(lng),
//       });

//     return passengerApi.get<ReverseGeocodeResponse>(
//       `/geocode/reverse?${params.toString()}`,
//       {
//         authMode: "access",
//       },
//     );
//   },
// };