import type { LiveMapData } from "@/types/live-operations";

// Illustrative Lagos map. Coordinates are SVG viewBox units in a 1000 x 720
// space; the shapes are stylised, not geographic.
export const MAP: LiveMapData = {
  width: 1000,
  height: 720,
  labels: [
    { text: "Ikeja", point: { x: 165, y: 105 } },
    { text: "Yaba", point: { x: 392, y: 355 } },
    { text: "Ikoyi", point: { x: 608, y: 249 } },
    { text: "Lekki", point: { x: 758, y: 414 } },
    { text: "Victoria Island", point: { x: 560, y: 500 } },
  ],
  lagoonLabel: { text: "LAGOS LAGOON", point: { x: 873, y: 630 } },
  lagoonRotation: -8,
  zones: [
    {
      id: "mainland",
      tone: "brand",
      label: "Mainland",
      polygon: [
        { x: 84, y: 102 },
        { x: 345, y: 75 },
        { x: 405, y: 260 },
        { x: 335, y: 335 },
        { x: 260, y: 405 },
        { x: 100, y: 315 },
      ],
    },
    {
      id: "island",
      tone: "accent",
      label: "Island",
      polygon: [
        { x: 565, y: 375 },
        { x: 885, y: 315 },
        { x: 953, y: 630 },
        { x: 640, y: 673 },
      ],
    },
  ],
  routes: [
    {
      id: "route-1",
      tone: "brand",
      path: "M130 505 C 200 430 300 360 345 350 S 520 280 625 183",
    },
    { id: "route-2", tone: "accent", path: "M252 152 C 400 260 600 360 810 497" },
  ],
  markers: [
    { id: "m1", kind: "available", tone: "brand", point: { x: 207, y: 201 }, zone: "mainland" },
    { id: "m2", kind: "available", tone: "brand", point: { x: 708, y: 193 }, zone: "island" },
    { id: "m3", kind: "available", tone: "brand", point: { x: 601, y: 294 }, zone: "island" },
    { id: "m4", kind: "available", tone: "brand", point: { x: 324, y: 357 }, zone: "mainland" },
    { id: "m5", kind: "available", tone: "brand", point: { x: 393, y: 445 }, zone: "mainland" },
    { id: "m6", kind: "available", tone: "brand", point: { x: 522, y: 502 }, zone: "island" },
    { id: "m7", kind: "available", tone: "brand", point: { x: 265, y: 524 }, zone: "mainland" },
    { id: "m8", kind: "onTrip", tone: "success", point: { x: 452, y: 164 }, zone: "mainland" },
    { id: "m9", kind: "onTrip", tone: "success", point: { x: 798, y: 416 }, zone: "island" },
    { id: "m10", kind: "onTrip", tone: "success", point: { x: 680, y: 573 }, zone: "island" },
  ],
  pins: [
    { id: "p1", kind: "pickup", tone: "brand", point: { x: 652, y: 201 }, zone: "island" },
    { id: "p2", kind: "navigator", tone: "accent", point: { x: 239, y: 503 }, zone: "mainland" },
  ],
};
