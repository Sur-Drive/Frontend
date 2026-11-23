// ---------------------------------------------------------------------------
// Minimal ambient typings for the Google Maps JavaScript API.
//
// The Maps JS API is loaded at runtime from a <script> tag (see
// lib/googleMaps.ts) rather than an npm package, so there is no module to import
// types from. This file declares only the small surface the admin dashboard
// actually uses: Map, Marker, Symbol, LatLng, LatLngBounds and Point.
//
// TODO: if `@types/google.maps` is ever added to the project, delete this file —
// that package declares the same global `google.maps` namespace, more completely.
// ---------------------------------------------------------------------------

declare namespace google.maps {
  interface LatLngLiteral {
    lat: number;
    lng: number;
  }

  interface LatLngBoundsLiteral {
    east: number;
    north: number;
    south: number;
    west: number;
  }

  class Size {
    constructor(width: number, height: number, widthUnit?: string, heightUnit?: string);
    width: number;
    height: number;
    equals(other: Size): boolean;
  }

  interface Padding {
    top: number;
    right: number;
    bottom: number;
    left: number;
  }

  class LatLng {
    constructor(lat: number, lng: number, noWrap?: boolean);
    lat(): number;
    lng(): number;
    toJSON(): LatLngLiteral;
  }

  class LatLngBounds {
    constructor(sw?: LatLng | LatLngLiteral, ne?: LatLng | LatLngLiteral);
    extend(point: LatLng | LatLngLiteral): LatLngBounds;
    isEmpty(): boolean;
    getCenter(): LatLng;
  }

  class Point {
    constructor(x: number, y: number);
    x: number;
    y: number;
    equals(other: Point): boolean;
  }

  interface MapOptions {
    center?: LatLng | LatLngLiteral;
    zoom?: number;
    disableDefaultUI?: boolean;
    zoomControl?: boolean;
    mapTypeControl?: boolean;
    streetViewControl?: boolean;
    fullscreenControl?: boolean;
    clickableIcons?: boolean;
    gestureHandling?: string;
    backgroundColor?: string;
  }

  class Map {
    constructor(mapDiv: HTMLElement, opts?: MapOptions);
    fitBounds(bounds: LatLngBounds | LatLngBoundsLiteral, padding?: number | Padding): void;
    getZoom(): number | undefined;
    panTo(latLng: LatLng | LatLngLiteral): void;
    setCenter(latLng: LatLng | LatLngLiteral): void;
    setZoom(zoom: number): void;
    /**
     * Base tile style ('roadmap' | 'satellite' | ...). Swaps the tiles only —
     * center, zoom and every marker are left untouched, which is why the SOS
     * panel can treat it as orthogonal to camera framing (see MapBaseType in
     * components/admin/sos-monitor/map/SosMapView). Typed `string` to match the
     * real @types/google.maps signature; the app narrows it at the call site.
     */
    setMapTypeId(mapTypeId: string): void;
  }

  /** Vector path rendered by the API itself — no image request per marker. */
  const SymbolPath: {
    readonly CIRCLE: 0;
    readonly FORWARD_CLOSED_ARROW: 1;
    readonly FORWARD_OPEN_ARROW: 2;
    readonly BACKWARD_CLOSED_ARROW: 3;
    readonly BACKWARD_OPEN_ARROW: 4;
  };

  interface Symbol {
    path: SymbolPath | string;
    scale?: number;
    fillColor?: string;
    fillOpacity?: number;
    strokeColor?: string;
    strokeOpacity?: number;
    strokeWeight?: number;
    rotation?: number;
    anchor?: Point;
  }

  interface Icon {
    url: string;
    size?: Size;
    scaledSize?: Size;
    origin?: Point;
    anchor?: Point;
  }

  interface MarkerOptions {
    position?: LatLng | LatLngLiteral;
    map?: Map;
    title?: string;
    icon?: string | Symbol | Icon;
    zIndex?: number;
    clickable?: boolean;
    cursor?: string;
    optimized?: boolean;
  }

  interface MapMouseEvent {
    latLng: LatLng | null;
    domEvent: MouseEvent;
  }

  interface MapsEventListener {
    remove(): void;
  }

  /**
   * The API watches window resize itself but never the map's container, so a
   * container-only resize (the SOS panel expanding into an overlay) has to be
   * announced explicitly with event.trigger(map, 'resize').
   */
  namespace event {
    function trigger(instance: object, eventName: string, ...args: unknown[]): void;
  }

  class Marker {
    constructor(opts?: MarkerOptions);
    setMap(map: Map | null): void;
    setIcon(icon: string | Symbol | Icon | null): void;
    setPosition(position: LatLng | LatLngLiteral): void;
    setZIndex(zIndex: number): void;
    setTitle(title: string | null): void;
    addListener(eventName: string, handler: (event: MapMouseEvent) => void): MapsEventListener;
  }
}

interface Window {
  /** Present once the Maps JS API script has executed. */
  google?: { maps: typeof google.maps };
  /** Global Google calls when it rejects the API key (InvalidKeyMapError etc.). */
  gm_authFailure?: () => void;
}