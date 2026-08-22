import { useCallback, useEffect, useState } from "react";

interface Coords {
  latitude: number;
  longitude: number;
}

interface UseCurrentLocationResult {
  coords: Coords | null;
  isLoading: boolean;
  error: string | null;
  retry: () => void;
}

const DEFAULT_COORDS: Coords = { latitude: 6.5244, longitude: 3.3792 };

export function useCurrentLocation(): UseCurrentLocationResult {
  const [coords, setCoords] = useState<Coords | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const locate = useCallback(() => {
    if (!navigator.geolocation) {
      setError("Geolocation not supported");
      setCoords(DEFAULT_COORDS);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    const onSuccess = (position: GeolocationPosition) => {
      setCoords({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });
      setError(null);
      setIsLoading(false);
    };

    const onFinalError = (err: GeolocationPositionError) => {
      setError(
        err.code === 1
          ? "Location access denied. Please enable location permissions."
          : err.code === 2
            ? "Location unavailable."
            : "Location request timed out.",
      );

      setCoords((prev) => prev ?? DEFAULT_COORDS);
      setIsLoading(false);
    };

    navigator.geolocation.getCurrentPosition(
      onSuccess,
      () => {
        navigator.geolocation.getCurrentPosition(onSuccess, onFinalError, {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0,
        });
      },
      { enableHighAccuracy: false, timeout: 5000, maximumAge: 60000 },
    );
  }, []);

  useEffect(() => {
    locate();
  }, [locate]);

  return { coords, isLoading, error, retry: locate };
}
