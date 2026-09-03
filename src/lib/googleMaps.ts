import { useEffect, useState } from "react";

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as
  | string
  | undefined;
const CALLBACK_NAME = "__surdriveGoogleMapsLoaded";

const LIBRARIES = "places,marker";

declare global {
  interface Window {
    google?: typeof google;
    [key: string]: any;
  }
}

let loadPromise: Promise<void> | null = null;

async function ensureCoreLibraryLoaded(): Promise<void> {
  await google.maps.importLibrary("maps");
}

export function loadGoogleMaps(): Promise<void> {
  if (loadPromise) return loadPromise;

  loadPromise = (async () => {
    if (typeof window === "undefined") {
      throw new Error(
        "Google Maps can only be loaded in a browser environment",
      );
    }

    if (window.google?.maps?.Map) {
      return;
    }

    if (!window.google?.maps) {
      if (!GOOGLE_MAPS_API_KEY) {
        throw new Error(
          "Missing VITE_GOOGLE_MAPS_API_KEY — add it to your .env file",
        );
      }

      await new Promise<void>((resolve, reject) => {
        window[CALLBACK_NAME] = () => resolve();

        const script = document.createElement("script");
        script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=${LIBRARIES}&loading=async&callback=${CALLBACK_NAME}`;
        script.async = true;
        script.onerror = () => {
          loadPromise = null; // allow a retry on the next call
          reject(new Error("Failed to load the Google Maps script"));
        };
        document.head.appendChild(script);
      });
    }

    await ensureCoreLibraryLoaded();
  })();

  return loadPromise;
}

export function useGoogleMaps(): { isLoaded: boolean; error: string | null } {
  const [isLoaded, setIsLoaded] = useState(
    typeof window !== "undefined" && !!window.google?.maps?.Map,
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isLoaded) return;
    let cancelled = false;

    loadGoogleMaps()
      .then(() => {
        if (!cancelled) setIsLoaded(true);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      });

    return () => {
      cancelled = true;
    };
  }, [isLoaded]);

  return { isLoaded, error };
}
