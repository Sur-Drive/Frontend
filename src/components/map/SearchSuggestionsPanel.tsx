import { useState } from "react";
import { Clock, Crosshair, Home, Star, X } from "lucide-react";
import AddressAutocompleteInput, {
  type SelectedAddress,
} from "./AddressAutocompleteInput";
import type {
  PickedPlace,
  UseSavedPlacesReturn,
} from "../../hooks/useSavedPlaces";
import type { RecentSearch, SavedPlace } from "../../types/savedPlaces";

interface SearchSuggestionsPanelProps {
  savedPlaces: UseSavedPlacesReturn;
  /** User tapped a saved place / favourite / recent search — fill the active field with it. */
  onSelect: (place: PickedPlace) => void;
  /** "Search around current location" — resolves the device's current position into the active field. */
  onUseCurrentLocation: () => void;
  isLocatingCurrentPosition?: boolean;
  currentLocationErrorText?: string | null;
  className?: string;
}

function timeAgoLabel(ts: number): string {
  const diffMs = Date.now() - ts;
  const mins = Math.round(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  return `${days}d ago`;
}

/** Chip used for Home / Work / a favourite — shows the saved address once
 *  set, or an "Add" affordance to start the inline set-address flow. */
function SavedPlaceChip({
  icon,
  label,
  place,
  onTap,
  onRemove,
}: {
  icon: React.ReactNode;
  label: string;
  place: SavedPlace | null;
  onTap: () => void;
  onRemove?: () => void;
}) {
  return (
    <div className="relative flex-shrink-0">
      <button
        type="button"
        onClick={onTap}
        className={`flex flex-col items-start gap-1 w-28 px-3 py-2.5 rounded-xl border text-left transition ${
          place
            ? "bg-purple-50 border-purple-100 active:bg-purple-100"
            : "bg-gray-50 border-transparent active:bg-gray-100"
        }`}
      >
        <span className="flex items-center gap-1.5 text-xs font-semibold text-gray-900">
          {icon}
          {label}
        </span>
        <span className="text-[10.5px] leading-3.5 text-gray-400 line-clamp-2 w-full">
          {place ? place.address : "Add"}
        </span>
      </button>
      {place && onRemove && (
        <button
          type="button"
          aria-label={`Remove ${label}`}
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="absolute flex items-center justify-center w-4 h-4 text-white bg-gray-400 rounded-full -top-1 -right-1 hover:bg-gray-500"
        >
          <X size={10} />
        </button>
      )}
    </div>
  );
}

type EditingSlot = "home" | "work" | "favourite" | null;

export default function SearchSuggestionsPanel({
  savedPlaces,
  onSelect,
  onUseCurrentLocation,
  isLocatingCurrentPosition = false,
  currentLocationErrorText = null,
  className = "",
}: SearchSuggestionsPanelProps) {
  const {
    home,
    work,
    favourites,
    recentSearches,
    setHome,
    setWork,
    removeHome,
    removeWork,
    addFavourite,
    removeFavourite,
    clearRecentSearches,
  } = savedPlaces;

  const [editingSlot, setEditingSlot] = useState<EditingSlot>(null);
  const [editValue, setEditValue] = useState("");
  const [favouriteLabel, setFavouriteLabel] = useState("");

  const handleEditSelect = (result: SelectedAddress) => {
    const picked: PickedPlace = {
      address: result.address,
      lat: result.lat,
      lng: result.lng,
      placeId: result.placeId,
    };
    if (editingSlot === "home") setHome(picked);
    else if (editingSlot === "work") setWork(picked);
    else if (editingSlot === "favourite") addFavourite(favouriteLabel, picked);

    setEditingSlot(null);
    setEditValue("");
    setFavouriteLabel("");
  };

  return (
    <div
      className={`mt-2 space-y-4 rounded-2xl border border-gray-100 bg-white p-3.5 shadow-sm ${className}`}
    >
      {/* ── Search around current location ─────────────────────── */}
      <button
        type="button"
        onClick={onUseCurrentLocation}
        disabled={isLocatingCurrentPosition}
        className="flex items-center w-full gap-2.5 px-1 py-1 text-left disabled:opacity-60"
      >
        <span className="flex items-center justify-center flex-shrink-0 text-purple-600 rounded-full w-9 h-9 bg-purple-50">
          <Crosshair size={16} />
        </span>
        <span className="min-w-0">
          <span className="block text-xs font-semibold text-gray-900 sm:text-sm">
            {isLocatingCurrentPosition
              ? "Locating…"
              : "Search around current location"}
          </span>
          <span className="block text-[11px] text-gray-400">
            Use where you are right now
          </span>
        </span>
      </button>
      {currentLocationErrorText && (
        <p className="-mt-2 text-[11px] text-red-500">{currentLocationErrorText}</p>
      )}

      {/* ── Saved places ─────────────────────────────────────────── */}
      <div>
        <p className="mb-2 text-[11px] font-semibold tracking-wide text-gray-400 uppercase">
          Saved places
        </p>
        <div className="flex gap-2 pb-1 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <SavedPlaceChip
            icon={<Home size={12} />}
            label="Home"
            place={home}
            onTap={() =>
              home ? onSelect(home) : (setEditingSlot("home"), setEditValue(""))
            }
            onRemove={removeHome}
          />
          <SavedPlaceChip
            icon={
              <svg viewBox="0 0 24 24" width={12} height={12} fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="7" width="18" height="13" rx="2" />
                <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
            }
            label="Work"
            place={work}
            onTap={() =>
              work ? onSelect(work) : (setEditingSlot("work"), setEditValue(""))
            }
            onRemove={removeWork}
          />
          {favourites.map((fav) => (
            <SavedPlaceChip
              key={fav.id}
              icon={<Star size={12} />}
              label={fav.label}
              place={fav}
              onTap={() => onSelect(fav)}
              onRemove={() => removeFavourite(fav.id)}
            />
          ))}
          <button
            type="button"
            onClick={() => {
              setEditingSlot("favourite");
              setEditValue("");
              setFavouriteLabel("");
            }}
            className="flex-shrink-0 w-20 px-3 py-2.5 rounded-xl border border-dashed border-gray-200 text-[11px] font-medium text-gray-500 active:bg-gray-50"
          >
            + Favourite
          </button>
        </div>
      </div>

      {/* ── Inline "set address" flow for Home / Work / Favourite ── */}
      {editingSlot && (
        <div className="p-3 space-y-2 border border-gray-100 bg-gray-50 rounded-xl">
          <p className="text-xs font-semibold text-gray-900">
            {editingSlot === "home" && "Set your Home address"}
            {editingSlot === "work" && "Set your Work address"}
            {editingSlot === "favourite" && "Add a favourite place"}
          </p>

          {editingSlot === "favourite" && (
            <input
              type="text"
              value={favouriteLabel}
              onChange={(e) => setFavouriteLabel(e.target.value)}
              placeholder="Name it, e.g. Mum's house"
              className="w-full px-3 py-2 text-xs bg-white border border-gray-200 outline-none rounded-xl placeholder-gray-400"
            />
          )}

          <div className="px-3 py-2 bg-white border border-gray-200 rounded-xl">
            <AddressAutocompleteInput
              value={editValue}
              onChange={setEditValue}
              onSelect={handleEditSelect}
              placeholder="Search address"
              inputClassName="w-full text-xs sm:text-sm text-gray-900 placeholder-gray-400 bg-transparent outline-none"
              enableVoice={false}
            />
          </div>

          <button
            type="button"
            onClick={() => {
              setEditingSlot(null);
              setEditValue("");
              setFavouriteLabel("");
            }}
            className="text-[11px] font-medium text-gray-400"
          >
            Cancel
          </button>
        </div>
      )}

      {/* ── Recent searches ──────────────────────────────────────── */}
      {recentSearches.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-[11px] font-semibold tracking-wide text-gray-400 uppercase">
              Recent searches
            </p>
            <button
              type="button"
              onClick={clearRecentSearches}
              className="text-[11px] font-medium text-purple-600"
            >
              Clear
            </button>
          </div>
          <ul>
            {recentSearches.map((r: RecentSearch) => (
              <li key={r.id}>
                <button
                  type="button"
                  onClick={() => onSelect(r)}
                  className="flex items-center w-full gap-2.5 px-1 py-2 text-left active:bg-gray-50 rounded-lg"
                >
                  <span className="flex items-center justify-center flex-shrink-0 text-gray-400 rounded-full w-8 h-8 bg-gray-50">
                    <Clock size={14} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-xs font-medium text-gray-900 truncate sm:text-sm">
                      {r.address}
                    </span>
                  </span>
                  <span className="flex-shrink-0 text-[10px] text-gray-300">
                    {timeAgoLabel(r.searchedAt)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
