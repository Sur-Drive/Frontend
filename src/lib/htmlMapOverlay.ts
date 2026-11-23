
// export type HtmlMapOverlayInstance =
//   google.maps.OverlayView & {
//     updatePosition(
//       position: google.maps.LatLngLiteral,
//   ): void;
//   updateHtml(html: string): void;
//   updateHeading(degrees: number): void;
//   updateAnchor(anchor: [number, number]): void;
// };

export type HtmlMapOverlayInstance =
  google.maps.OverlayView & {
    updatePosition(
      position: google.maps.LatLngLiteral,
    ): void;

    updateHtml(html: string): void;

    updateAnchor(
      anchor: [number, number],
    ): void;

    updateHeading(heading: number): void;
  };

type Ctor = new (
  position: google.maps.LatLngLiteral,
  html: string,
  anchor: [number, number],
  onClick?: () => void,
) => HtmlMapOverlayInstance;

let HtmlMapOverlayCtor: Ctor | null = null;

function getHtmlMapOverlayCtor(): Ctor {
  if (HtmlMapOverlayCtor) return HtmlMapOverlayCtor;

  class HtmlMapOverlay
    extends google.maps.OverlayView
    implements HtmlMapOverlayInstance
  {
    private div: HTMLDivElement | null = null;
    private position: google.maps.LatLngLiteral;
    private html: string;
    private anchor: [number, number];
    private onClick?: () => void;
    private heading = 0;

    constructor(
      position: google.maps.LatLngLiteral,
      html: string,
      anchor: [number, number] = [18, 18],
      onClick?: () => void,
    ) {
      super();

      this.position = position;
      this.html = html;
      this.anchor = anchor;
      this.onClick = onClick;
    }

    onAdd() {
      this.div = document.createElement("div");

      this.div.style.position = "absolute";
      this.div.style.willChange = "left, top";

      this.div.innerHTML = this.html;

      this.div.style.pointerEvents =
        this.onClick ? "auto" : "none";

      if (this.onClick) {
        this.div.style.cursor = "pointer";

        this.div.addEventListener(
          "click",
          this.handleClick,
        );
      }

      const panes = this.getPanes();

      const pane = this.onClick
        ? panes?.overlayMouseTarget
        : panes?.overlayLayer;

      pane?.appendChild(this.div);

      this.applyHeading();
    }

    private handleClick = (event: MouseEvent) => {
      event.stopPropagation();
      this.onClick?.();
    };

    // private applyHeading() {
    //   if (!this.div) return;

    //   const rotating = this.div.querySelector(
    //     "[data-driver-rotation]",
    //   ) as HTMLElement | null;

    //   if (rotating) {
    //     rotating.style.transform =
    //       `rotate(${this.heading}deg)`;
    //   }
    // }
    private applyHeading() {
  if (!this.div) return;

  const rotating = this.div.querySelector<HTMLElement>(
    "[data-driver-rotation]",
  );

  if (!rotating) return;

  rotating.style.transform = `rotate(${this.heading}deg)`;
  rotating.style.transformOrigin = "center center";
}

updateHeading(heading: number) {
  if (!Number.isFinite(heading)) return;

  this.heading = ((heading % 360) + 360) % 360;
  this.applyHeading();
}

    draw() {
      if (!this.div) return;

      const projection = this.getProjection();

      if (!projection) return;

      const point =
        projection.fromLatLngToDivPixel(
          new google.maps.LatLng(
            this.position.lat,
            this.position.lng,
          ),
        );

      if (!point) return;

      this.div.style.left =
        `${point.x - this.anchor[0]}px`;

      this.div.style.top =
        `${point.y - this.anchor[1]}px`;
    }

    onRemove() {
      if (this.div) {
        this.div.removeEventListener(
          "click",
          this.handleClick,
        );

        this.div.remove();
      }

      this.div = null;
    }

    updatePosition(
      position: google.maps.LatLngLiteral,
    ) {
      this.position = position;
      this.draw();
    }

    updateHtml(html: string) {
      if (this.html === html) return;

      this.html = html;

      if (this.div) {
        this.div.innerHTML = html;
        this.applyHeading();
      }
    }

    // updateHeading(degrees: number) {
    //   if (!Number.isFinite(degrees)) return;

    //   this.heading = degrees;
    //   this.applyHeading();
    // }

    // updateAnchor(anchor: [number, number]) {
    //   if (
    //     this.anchor[0] === anchor[0] &&
    //     this.anchor[1] === anchor[1]
    //   ) {
    //     return;
    //   }

    //   this.anchor = anchor;
    //   this.draw();
    // }
    updateAnchor(anchor: [number, number]) {
  if (
    this.anchor[0] === anchor[0] &&
    this.anchor[1] === anchor[1]
  ) {
    return;
  }

  this.anchor = anchor;
  this.draw();
}

// updateHeading(heading: number) {
//   if (!this.div) return;

//   const normalized =
//     ((heading % 360) + 360) % 360;

//   this.div.style.setProperty(
//     "--surdrive-marker-heading",
//     `${normalized}deg`,
//   );
// }
  }

  HtmlMapOverlayCtor = HtmlMapOverlay;

  return HtmlMapOverlayCtor;
}

export function createHtmlMapOverlay(
  position: google.maps.LatLngLiteral,
  html: string,
  anchor: [number, number] = [18, 18],
  onClick?: () => void,
): HtmlMapOverlayInstance {
  const Ctor = getHtmlMapOverlayCtor();

  return new Ctor(
    position,
    html,
    anchor,
    onClick,
  );
}


// type HtmlMapOverlayInstance = google.maps.OverlayView & {
//   updatePosition(position: google.maps.LatLngLiteral): void
//   updateHtml(html: string): void
// }

// type Ctor = new (
//   position: google.maps.LatLngLiteral,
//   html: string,
//   anchor: [number, number],
//   onClick?: () => void
// ) => HtmlMapOverlayInstance

// let HtmlMapOverlayCtor: Ctor | null = null

// function getHtmlMapOverlayCtor(): Ctor {
//   if (HtmlMapOverlayCtor) return HtmlMapOverlayCtor

//   class HtmlMapOverlay
//     extends google.maps.OverlayView
//     implements HtmlMapOverlayInstance
//   {
//     private div: HTMLDivElement | null = null
//     private position: google.maps.LatLngLiteral
//     private html: string
//     private anchor: [number, number]
//     private onClick?: () => void

//     constructor(
//       position: google.maps.LatLngLiteral,
//       html: string,
//       anchor: [number, number] = [18, 18],
//       onClick?: () => void
//     ) {
//       super()
//       this.position = position
//       this.html = html
//       this.anchor = anchor
//       this.onClick = onClick
//     }

//     onAdd() {
//       this.div = document.createElement('div')
//       this.div.style.position = 'absolute'
//       this.div.innerHTML = this.html

//       if (this.onClick) {
//         this.div.style.cursor = 'pointer'

//         this.div.addEventListener('click', (e) => {
//           e.stopPropagation()
//           this.onClick?.()
//         })
//       }

//       this.getPanes()?.overlayMouseTarget.appendChild(this.div)
//     }

//     draw() {
//       if (!this.div) return

//       const projection = this.getProjection()
//       if (!projection) return

//       const point = projection.fromLatLngToDivPixel(
//         new google.maps.LatLng(this.position.lat, this.position.lng)
//       )

//       if (!point) return

//       this.div.style.left = `${point.x - this.anchor[0]}px`
//       this.div.style.top = `${point.y - this.anchor[1]}px`
//     }

//     onRemove() {
//       this.div?.remove()
//       this.div = null
//     }

//     updatePosition(position: google.maps.LatLngLiteral) {
//       this.position = position
//       this.draw()
//     }

//     updateHtml(html: string) {
//       if (this.html === html) return

//       this.html = html

//       if (this.div) {
//         this.div.innerHTML = html
//       }
//     }
//   }

//   HtmlMapOverlayCtor = HtmlMapOverlay

//   return HtmlMapOverlayCtor
// }

// export function createHtmlMapOverlay(
//   position: google.maps.LatLngLiteral,
//   html: string,
//   anchor: [number, number] = [18, 18],
//   onClick?: () => void
// ): HtmlMapOverlayInstance {
//   const Ctor = getHtmlMapOverlayCtor()

//   return new Ctor(position, html, anchor, onClick)
// }

// export type { HtmlMapOverlayInstance }