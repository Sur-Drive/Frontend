import {
  LoaderCircle,
  MapPin,
  Search,
  X,
} from "lucide-react";

import {
  useEffect,
  useState,
} from "react";

import {
  motion,
} from "framer-motion";

import {
  toast,
} from "sonner";

import RideModalSheet from "./RideModalSheet";

import {
  getPlaceDetails,
  searchPlaces,
  type PlaceSuggestion,
} from "../../../api/passenger/placeSearch";

import {
  placeDetailsToRideLocation,
} from "../../../utils/passengerRideLocation";

import type {
  RideLocation,
} from "../../../types/passengerRide";

interface AddStopSheetProps {
  open: boolean;

  onClose: () => void;

  onAdd: (
    location: RideLocation,
  ) => void;
}

export default function AddStopSheet({
  open,
  onClose,
  onAdd,
}: AddStopSheetProps) {
  const [
    query,
    setQuery,
  ] = useState("");

  const [
    suggestions,
    setSuggestions,
  ] = useState<
    PlaceSuggestion[]
  >([]);

  const [
    isSearching,
    setIsSearching,
  ] = useState(false);

  const [
    isResolving,
    setIsResolving,
  ] = useState(false);

  /**
   * Reset everything whenever
   * the sheet closes.
   */
  useEffect(() => {
    if (!open) {
      setQuery("");
      setSuggestions([]);
      setIsSearching(false);
      setIsResolving(false);
    }
  }, [open]);

  /**
   * Search Google Places as the
   * rider types.
   *
   * We wait until at least 3
   * characters have been entered
   * and debounce requests by 350ms.
   */
  useEffect(() => {
    if (!open) {
      return;
    }

    const search =
      query.trim();

    if (
      search.length < 3
    ) {
      setSuggestions([]);
      setIsSearching(false);

      return;
    }

    let cancelled = false;

    const timer =
      window.setTimeout(
        async () => {
          try {
            setIsSearching(
              true,
            );

            const results =
              await searchPlaces(
                search,
              );

            if (!cancelled) {
              setSuggestions(
                results,
              );
            }
          } catch (error) {
            if (cancelled) {
              return;
            }

            console.error(
              "Stop place search failed:",
              error,
            );

            setSuggestions(
              [],
            );

            toast.error(
              "Unable to search locations.",
            );
          } finally {
            if (!cancelled) {
              setIsSearching(
                false,
              );
            }
          }
        },
        350,
      );

    return () => {
      cancelled = true;

      window.clearTimeout(
        timer,
      );
    };
  }, [
    query,
    open,
  ]);

  /**
   * Google autocomplete only gives
   * us a suggestion/placeId.
   *
   * Resolve the selected place so
   * the ride stop has coordinates
   * before adding it to ride state.
   */
  const handleSelect =
    async (
      suggestion: PlaceSuggestion,
    ) => {
      if (isResolving) {
        return;
      }

      try {
        setIsResolving(
          true,
        );

        const details =
          await getPlaceDetails(
            suggestion.placeId,
          );

        const location =
          placeDetailsToRideLocation(
            details,
          );

        if (
          !location.coordinates &&
          !location.address &&
          !location.savedPlaceId
        ) {
          throw new Error(
            "Selected stop does not contain usable location information.",
          );
        }

        onAdd(location);

        setQuery("");
        setSuggestions([]);

        onClose();
      } catch (error) {
        console.error(
          "Stop place details failed:",
          error,
        );

        toast.error(
          "Unable to select this stop.",
        );
      } finally {
        setIsResolving(
          false,
        );
      }
    };

  const handleClear = () => {
    setQuery("");
    setSuggestions([]);
  };

  const hasQuery =
    query.trim().length > 0;

  const canSearch =
    query.trim().length >= 3;

  return (
    <RideModalSheet
      open={open}
      onClose={onClose}
      title="Add a stop"
      description="Add another destination before your final drop-off."
    >
      {/* SEARCH INPUT */}

      <div
        className="
          flex
          h-[58px]
          items-center
          gap-3
          rounded-[15px]
          border
          border-[#E5E0E8]
          bg-[#F9F8FA]
          px-4
          transition-all
          focus-within:border-[#A67BD2]
          focus-within:bg-white
          focus-within:shadow-[0_0_0_3px_rgba(116,66,173,0.07)]
        "
      >
        <Search
          size={20}
          className="
            shrink-0
            text-[#918B95]
          "
        />

        <input
          autoFocus
          value={query}
          onChange={(
            event,
          ) => {
            setQuery(
              event.target.value,
            );
          }}
          placeholder="Search for a stop"
          autoComplete="off"
          className="
            min-w-0
            flex-1
            bg-transparent
            text-[16px]
            text-[#302B34]
            outline-none
            placeholder:text-[#AAA4AD]
          "
        />

        {isSearching ? (
          <LoaderCircle
            size={19}
            className="
              shrink-0
              animate-spin
              text-[#7442AD]
            "
          />
        ) : hasQuery ? (
          <motion.button
            type="button"
            whileTap={{
              scale: 0.9,
            }}
            aria-label="Clear stop search"
            onClick={
              handleClear
            }
            className="
              flex
              h-8
              w-8
              shrink-0
              items-center
              justify-center
              rounded-full
              bg-[#E8E5E9]
              text-[#918B95]
            "
          >
            <X
              size={16}
            />
          </motion.button>
        ) : null}
      </div>

      {/* EMPTY INITIAL STATE */}

      {!hasQuery && (
        <div
          className="py-10 text-center "
        >
          <span
            className="
              mx-auto
              flex
              h-12
              w-12
              items-center
              justify-center
              rounded-full
              bg-[#F1EAF7]
              text-[#7442AD]
            "
          >
            <MapPin
              size={22}
            />
          </span>

          <p
            className="
              mt-3
              text-[16px]
              font-semibold
              text-[#302B34]
            "
          >
            Search for a stop
          </p>

          <p
            className="
              mx-auto
              mt-1
              max-w-[280px]
              text-[14px]
              leading-5
              text-[#96909A]
            "
          >
            Enter the name or
            address of the place
            you want to stop at.
          </p>
        </div>
      )}

      {/* LESS THAN 3 CHARACTERS */}

      {hasQuery &&
        !canSearch && (
          <div
            className="py-8 text-center "
          >
            <p
              className="
                text-[14px]
                text-[#918B95]
              "
            >
              Keep typing to search
              for a location.
            </p>
          </div>
        )}

      {/* SEARCHING */}

      {canSearch &&
        isSearching && (
          <div
            className="
              flex
              items-center
              justify-center
              gap-2
              py-10
              text-[15px]
              text-[#918B95]
            "
          >
            <LoaderCircle
              size={18}
              className="
                animate-spin
                text-[#7442AD]
              "
            />

            Searching locations...
          </div>
        )}

      {/* RESULTS */}

      {canSearch &&
        !isSearching &&
        suggestions.length >
          0 && (
          <div className="mt-3">
            {suggestions.map(
              (
                suggestion,
                index,
              ) => (
                <motion.button
                  key={
                    suggestion.placeId
                  }
                  type="button"
                  whileTap={{
                    scale:
                      0.985,
                  }}
                  disabled={
                    isResolving
                  }
                  onClick={() =>
                    handleSelect(
                      suggestion,
                    )
                  }
                  className={`
                    flex
                    w-full
                    items-center
                    gap-3
                    px-2
                    py-4
                    text-left
                    transition-colors
                    hover:bg-[#F8F5FA]
                    disabled:opacity-50

                    ${
                      index <
                      suggestions.length -
                        1
                        ? "border-b border-[#EEEAF0]"
                        : ""
                    }
                  `}
                >
                  <span
                    className="
                      flex
                      h-10
                      w-10
                      shrink-0
                      items-center
                      justify-center
                      rounded-full
                      bg-[#F1EAF7]
                      text-[#7442AD]
                    "
                  >
                    {isResolving ? (
                      <LoaderCircle
                        size={
                          18
                        }
                        className="animate-spin"
                      />
                    ) : (
                      <MapPin
                        size={
                          18
                        }
                      />
                    )}
                  </span>

                  <span
                    className="flex-1 min-w-0 "
                  >
                    <span
                      className="
                        block
                        truncate
                        text-[16px]
                        font-semibold
                        text-[#302B34]
                      "
                    >
                      {
                        suggestion.label
                      }
                    </span>

                    {suggestion.address && (
                      <span
                        className="
                          mt-1
                          block
                          truncate
                          text-[14px]
                          text-[#96909A]
                        "
                      >
                        {
                          suggestion.address
                        }
                      </span>
                    )}
                  </span>
                </motion.button>
              ),
            )}
          </div>
        )}

      {/* NO RESULTS */}

      {canSearch &&
        !isSearching &&
        suggestions.length ===
          0 && (
          <div
            className="py-10 text-center "
          >
            <span
              className="
                mx-auto
                flex
                h-12
                w-12
                items-center
                justify-center
                rounded-full
                bg-[#F4F1F5]
                text-[#AAA4AD]
              "
            >
              <MapPin
                size={22}
              />
            </span>

            <p
              className="
                mt-3
                text-[16px]
                font-semibold
                text-[#302B34]
              "
            >
              No locations found
            </p>

            <p
              className="
                mt-1
                text-[14px]
                text-[#96909A]
              "
            >
              Try another place
              name or address.
            </p>
          </div>
        )}
    </RideModalSheet>
  );
}