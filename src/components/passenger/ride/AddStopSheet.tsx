import {
  MapPin,
  Search,
} from "lucide-react";
import {
  useEffect,
  useState,
} from "react";
import { motion } from "framer-motion";

import RideModalSheet from "./RideModalSheet";

import type {
  RideLocation,
} from "../../../types/passengerRide";

interface AddStopSheetProps {
  open: boolean;
  onClose: () => void;
  onAdd: (
    location: RideLocation,
  ) => void;
  suggestions?: RideLocation[];
}

export default function AddStopSheet({
  open,
  onClose,
  onAdd,
  suggestions = [],
}: AddStopSheetProps) {
  const [query, setQuery] =
    useState("");

  useEffect(() => {
    if (!open) {
      setQuery("");
    }
  }, [open]);

  const filtered =
    suggestions.filter(
      (location) => {
        if (!query.trim()) {
          return true;
        }

        const search =
          query.toLowerCase();

        return (
          location.label
            .toLowerCase()
            .includes(search) ||
          location.address
            ?.toLowerCase()
            .includes(search)
        );
      },
    );

  return (
    <RideModalSheet
      open={open}
      onClose={onClose}
      title="Add a stop"
      description="Add another destination before your final drop-off."
    >
      <div
        className="
          flex h-[58px]
          items-center gap-3
          rounded-[15px]
          border border-[#E5E0E8]
          bg-[#F9F8FA]
          px-4
        "
      >
        <Search
          size={20}
          className="text-[#918B95]"
        />

        <input
          autoFocus
          value={query}
          onChange={(event) =>
            setQuery(
              event.target.value,
            )
          }
          placeholder="Search for a stop"
          className="
            min-w-0 flex-1
            bg-transparent
            text-[16px]
            text-[#302B34]
            outline-none
            placeholder:text-[#AAA4AD]
          "
        />
      </div>

      <div className="mt-4 space-y-1">
        {filtered.map(
          (location) => (
            <motion.button
              key={location.id}
              type="button"
              whileTap={{
                scale: 0.985,
              }}
              onClick={() => {
                onAdd(location);
                onClose();
              }}
              className="
                flex w-full
                items-center gap-3
                rounded-[14px]
                p-3 text-left
                hover:bg-[#F8F5FA]
              "
            >
              <span
                className="
                  flex h-10 w-10
                  shrink-0 items-center
                  justify-center
                  rounded-full
                  bg-[#F1EAF7]
                  text-[#7442AD]
                "
              >
                <MapPin size={18} />
              </span>

              <div className="min-w-0">
                <p className="truncate text-[15px] font-semibold text-[#302B34]">
                  {location.label}
                </p>

                {location.address && (
                  <p className="mt-1 truncate text-[12px] text-[#96909A]">
                    {location.address}
                  </p>
                )}
              </div>
            </motion.button>
          ),
        )}

        {filtered.length === 0 && (
          <div className="py-10 text-center">
            <MapPin
              size={30}
              className="mx-auto text-[#C7C0CA]"
            />

            <p className="mt-3 text-[14px] text-[#918B95]">
              No matching locations found.
            </p>
          </div>
        )}
      </div>
    </RideModalSheet>
  );
}