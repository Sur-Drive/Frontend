"use client";

import { useRef, useState } from "react";
import { Plus } from "lucide-react";
import { SideSheet } from "@/components/ui/SideSheet";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import type { BoundaryPoint, OperatingCity } from "@/types/platform-settings";

export interface BoundarySave {
  boundaryName: string;
  boundaryPoints: BoundaryPoint[];
}

const VIEW_W = 800;
const VIEW_H = 360;
// Polygons need at least three vertices; Remove disables at the floor.
const MIN_POINTS = 3;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

interface BoundaryDrawerProps {
  city: OperatingCity;
  onClose: () => void;
  onSave: (save: BoundarySave) => void;
}

export function BoundaryDrawer({ city, onClose, onSave }: BoundaryDrawerProps) {
  const [points, setPoints] = useState<BoundaryPoint[]>(city.boundaryPoints);
  const [boundaryName, setBoundaryName] = useState(city.boundaryName);
  const [selected, setSelected] = useState<number | null>(null);
  const [nameError, setNameError] = useState<string | undefined>(undefined);
  const svgRef = useRef<SVGSVGElement>(null);
  const dragIndexRef = useRef<number | null>(null);

  function toViewPoint(clientX: number, clientY: number): BoundaryPoint {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0 || rect.height === 0) {
      return { x: VIEW_W / 2, y: VIEW_H / 2 };
    }
    return {
      x: Math.round(clamp(((clientX - rect.left) / rect.width) * VIEW_W, 8, VIEW_W - 8)),
      y: Math.round(clamp(((clientY - rect.top) / rect.height) * VIEW_H, 8, VIEW_H - 8)),
    };
  }

  function handleAddPoint() {
    const next =
      points.length === 0
        ? { x: VIEW_W / 2, y: VIEW_H / 2 }
        : {
            // Centroid keeps new vertices inside the polygon.
            x: Math.round(points.reduce((sum, point) => sum + point.x, 0) / points.length),
            y: Math.round(points.reduce((sum, point) => sum + point.y, 0) / points.length),
          };
    setPoints((current) => [...current, next]);
    setSelected(points.length);
  }

  function handleRemoveSelected() {
    if (selected === null || points.length <= MIN_POINTS) return;
    setPoints((current) => current.filter((_, index) => index !== selected));
    setSelected(null);
  }

  function handleSave() {
    const trimmed = boundaryName.trim();
    if (trimmed === "") {
      setNameError("Boundary name is required.");
      return;
    }
    onSave({ boundaryName: trimmed, boundaryPoints: points });
  }

  const shape = points.map((point) => `${point.x},${point.y}`).join(" ");

  return (
    <SideSheet
      open
      onClose={onClose}
      eyebrow="SERVICE AREA BOUNDARIES"
      title={`Manage ${city.name} boundaries`}
      subtitle="Create, edit, or remove prototype service-area boundary points."
      footer={
        <>
          <Button variant="secondary" onClick={onClose} className="w-full sm:w-auto">
            Cancel
          </Button>
          <Button onClick={handleSave} className="w-full sm:w-auto">
            Save changes
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-5">
        <div className="aspect-20/9 overflow-hidden rounded-xl border border-border bg-surface-muted">
          <svg
            ref={svgRef}
            viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
            className="h-full w-full touch-none select-none"
            aria-label={`Service boundary map for ${city.name}`}
            onPointerDown={() => setSelected(null)}
          >
            <defs>
              <pattern id="boundary-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" className="stroke-border" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width={VIEW_W} height={VIEW_H} fill="url(#boundary-grid)" />
            {points.length >= MIN_POINTS ? (
              <polygon
                points={shape}
                className="fill-brand/10 stroke-brand"
                strokeWidth="4"
                strokeLinejoin="round"
              />
            ) : points.length > 1 ? (
              <polyline
                points={shape}
                className="fill-none stroke-brand"
                strokeWidth="4"
                strokeLinejoin="round"
              />
            ) : null}
            {points.map((point, index) => (
              <circle
                key={index}
                cx={point.x}
                cy={point.y}
                r={selected === index ? 10 : 8}
                tabIndex={0}
                role="button"
                aria-label={`Boundary point ${index + 1}${selected === index ? " (selected)" : ""}`}
                className="cursor-grab fill-warning stroke-white focus-visible:stroke-brand"
                strokeWidth="3"
                onPointerDown={(event) => {
                  event.stopPropagation();
                  dragIndexRef.current = index;
                  setSelected(index);
                  event.currentTarget.setPointerCapture(event.pointerId);
                }}
                onPointerMove={(event) => {
                  if (dragIndexRef.current !== index) return;
                  const next = toViewPoint(event.clientX, event.clientY);
                  setPoints((current) =>
                    current.map((existing, i) => (i === index ? next : existing)),
                  );
                }}
                onPointerUp={(event) => {
                  dragIndexRef.current = null;
                  if (event.currentTarget.hasPointerCapture(event.pointerId)) {
                    event.currentTarget.releasePointerCapture(event.pointerId);
                  }
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    setSelected(index);
                  }
                }}
              />
            ))}
          </svg>
        </div>
        <TextField
          id="boundary-name"
          label="Boundary name"
          value={boundaryName}
          error={nameError}
          onChange={(event) => {
            setBoundaryName(event.target.value);
            setNameError(undefined);
          }}
        />
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Button variant="secondary" onClick={handleAddPoint}>
            <Plus className="size-4" aria-hidden="true" />
            Add point
          </Button>
          <Button
            variant="danger"
            onClick={handleRemoveSelected}
            disabled={selected === null || points.length <= MIN_POINTS}
            title={
              points.length <= MIN_POINTS
                ? "A boundary needs at least three points"
                : selected === null
                  ? "Select a point on the map first"
                  : undefined
            }
          >
            Remove selected point
          </Button>
        </div>
      </div>
    </SideSheet>
  );
}