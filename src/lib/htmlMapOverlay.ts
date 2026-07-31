type HtmlMapOverlayInstance = google.maps.OverlayView & {
  updatePosition(position: google.maps.LatLngLiteral): void
  updateHtml(html: string): void
}

type Ctor = new (
  position: google.maps.LatLngLiteral,
  html: string,
  anchor: [number, number],
  onClick?: () => void
) => HtmlMapOverlayInstance

let HtmlMapOverlayCtor: Ctor | null = null

function getHtmlMapOverlayCtor(): Ctor {
  if (HtmlMapOverlayCtor) return HtmlMapOverlayCtor

  class HtmlMapOverlay
    extends google.maps.OverlayView
    implements HtmlMapOverlayInstance
  {
    private div: HTMLDivElement | null = null
    private position: google.maps.LatLngLiteral
    private html: string
    private anchor: [number, number]
    private onClick?: () => void

    constructor(
      position: google.maps.LatLngLiteral,
      html: string,
      anchor: [number, number] = [18, 18],
      onClick?: () => void
    ) {
      super()
      this.position = position
      this.html = html
      this.anchor = anchor
      this.onClick = onClick
    }

    onAdd() {
      this.div = document.createElement('div')
      this.div.style.position = 'absolute'
      this.div.innerHTML = this.html

      if (this.onClick) {
        this.div.style.cursor = 'pointer'

        this.div.addEventListener('click', (e) => {
          e.stopPropagation()
          this.onClick?.()
        })
      }

      this.getPanes()?.overlayMouseTarget.appendChild(this.div)
    }

    draw() {
      if (!this.div) return

      const projection = this.getProjection()
      if (!projection) return

      const point = projection.fromLatLngToDivPixel(
        new google.maps.LatLng(this.position.lat, this.position.lng)
      )

      if (!point) return

      this.div.style.left = `${point.x - this.anchor[0]}px`
      this.div.style.top = `${point.y - this.anchor[1]}px`
    }

    onRemove() {
      this.div?.remove()
      this.div = null
    }

    updatePosition(position: google.maps.LatLngLiteral) {
      this.position = position
      this.draw()
    }

    updateHtml(html: string) {
      if (this.html === html) return

      this.html = html

      if (this.div) {
        this.div.innerHTML = html
      }
    }
  }

  HtmlMapOverlayCtor = HtmlMapOverlay

  return HtmlMapOverlayCtor
}

export function createHtmlMapOverlay(
  position: google.maps.LatLngLiteral,
  html: string,
  anchor: [number, number] = [18, 18],
  onClick?: () => void
): HtmlMapOverlayInstance {
  const Ctor = getHtmlMapOverlayCtor()

  return new Ctor(position, html, anchor, onClick)
}

export type { HtmlMapOverlayInstance }