import { Plus, X } from "lucide-react";
import AddressAutocompleteInput from "./AddressAutocompleteInput";

export interface RouteStop {
  id: string;
  label: string;
  coords: { lat: number; lng: number } | null;
}

interface RouteStopsEditorProps {
  stops: RouteStop[];
  onChange: (stops: RouteStop[]) => void;
  /** Stops beyond this many aren't offered — keeps multi-leg planning fast. */
  maxStops?: number;
  className?: string;
}

let stopIdCounter = 0;
function nextStopId() {
  stopIdCounter += 1;
  return `stop-${Date.now()}-${stopIdCounter}`;
}

export function createEmptyStop(): RouteStop {
  return { id: nextStopId(), label: "", coords: null };
}

/** The list of intermediate stops between start and destination. Adding,
 *  removing, or resolving a stop's coordinates is what lets the ETA
 *  system reflect a multi-stop trip's real distance/duration. */
export default function RouteStopsEditor({
  stops,
  onChange,
  maxStops = 3,
  className = "",
}: RouteStopsEditorProps) {
  const updateStop = (id: string, patch: Partial<RouteStop>) => {
    onChange(stops.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  };

  const removeStop = (id: string) => {
    onChange(stops.filter((s) => s.id !== id));
  };

  const addStop = () => {
    if (stops.length >= maxStops) return;
    onChange([...stops, createEmptyStop()]);
  };

  return (
    <div className={className}>
      {stops.length > 0 && (
        <div className="mb-2 space-y-2">
          {stops.map((stop, i) => (
            <div key={stop.id}>
              <div className="flex items-center gap-2 mb-1.5">
                <div className="flex items-center justify-center w-5 h-5 border-2 border-purple-500 rounded-full">
                  <div className="w-2 h-2 bg-purple-500 rounded-full" />
                </div>
                <span className="text-xs font-medium text-gray-900 sm:text-sm">
                  Stop {i + 1}
                </span>
              </div>
              <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 rounded-xl">
                <AddressAutocompleteInput
                  value={stop.label}
                  onChange={(value) =>
                    updateStop(stop.id, { label: value, coords: null })
                  }
                  onSelect={(result) =>
                    updateStop(stop.id, {
                      label: result.address,
                      coords: { lat: result.lat, lng: result.lng },
                    })
                  }
                  placeholder="Search a place or address"
                  className="flex-1 min-w-0"
                  inputClassName="w-full min-w-0 text-base text-gray-900 placeholder-gray-400 bg-transparent outline-none"
                />
                <button
                  onClick={() => removeStop(stop.id)}
                  aria-label={`Remove stop ${i + 1}`}
                  className="flex items-center justify-center flex-shrink-0 text-gray-400 transition rounded-full w-7 h-7 hover:bg-gray-200 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {stops.length < maxStops && (
        <button
          onClick={addStop}
          className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-purple-600 hover:text-purple-700"
        >
          <Plus className="w-4 h-4" />
          Add stop
        </button>
      )}
    </div>
  );
}
