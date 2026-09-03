export type DetectedCategory =
  | "vehicle"
  | "motorcycle"
  | "bicycle"
  | "pedestrian"
  | "obstacle";

export type WarningSeverity = "low" | "medium" | "high";

const VEHICLE_LABELS = new Set(["car", "truck", "bus"]);
const OBSTACLE_LABELS = new Set([
  "traffic light",
  "stop sign",
  "fire hydrant",
  "bench",
  "parking meter",
  "suitcase",
  "backpack",
  "chair",
]);

export function classifyLabel(label: string): DetectedCategory | null {
  const l = label.toLowerCase();
  if (VEHICLE_LABELS.has(l)) return "vehicle";
  if (l === "motorcycle") return "motorcycle";
  if (l === "bicycle") return "bicycle";
  if (l === "person") return "pedestrian";
  if (OBSTACLE_LABELS.has(l)) return "obstacle";
  return null;
}

export const CATEGORY_LABEL: Record<DetectedCategory, string> = {
  vehicle: "Vehicle ahead",
  motorcycle: "Motorcycle",
  bicycle: "Bicycle",
  pedestrian: "Pedestrian",
  obstacle: "Obstacle",
};

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function boxAreaFraction(
  box: BoundingBox,
  frameWidth: number,
  frameHeight: number,
): number {
  if (!frameWidth || !frameHeight) return 0;
  return (box.width * box.height) / (frameWidth * frameHeight);
}

const HIGH_AREA_FRACTION = 0.3;
const MEDIUM_AREA_FRACTION = 0.13;
const HIGH_GROWTH_RATE = 0.4;
const MEDIUM_GROWTH_RATE = 0.18;

export const STOPPED_POSITION_EPSILON = 0.015;
export const STOPPED_MIN_MS = 1200;

export function computeSeverity(
  areaFraction: number,
  growthRate: number,
): WarningSeverity {
  if (areaFraction >= HIGH_AREA_FRACTION || growthRate >= HIGH_GROWTH_RATE)
    return "high";
  if (areaFraction >= MEDIUM_AREA_FRACTION || growthRate >= MEDIUM_GROWTH_RATE)
    return "medium";
  return "low";
}

export function severityRank(s: WarningSeverity): number {
  return s === "high" ? 2 : s === "medium" ? 1 : 0;
}

export interface TrackedObject {
  id: string;
  category: DetectedCategory;
  label: string;
  box: BoundingBox;
  areaFraction: number;
  growthRate: number;
  isStopped: boolean;
  isCollisionHazard: boolean;
  severity: WarningSeverity;
}

export function describeWarning(obj: TrackedObject): string {
  const what = CATEGORY_LABEL[obj.category];

  if (obj.isCollisionHazard) {
    return obj.severity === "high"
      ? `${what} close ahead — possible collision risk`
      : `${what} ahead, closing distance`;
  }
  if (obj.isStopped) {
    return `Stopped ${what.toLowerCase()} ahead`;
  }
  return `${what} detected ahead`;
}
