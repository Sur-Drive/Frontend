import { PLACE_CATEGORIES } from '../../types/places'
import type { PlaceCategoryKey } from '../../types/places'

interface PlaceCategoryBarProps {
  activeCategory: PlaceCategoryKey | null
  onSelect: (category: PlaceCategoryKey) => void
  isLoading: boolean
  className?: string
}

export default function PlaceCategoryBar({
  activeCategory,
  onSelect,
  isLoading,
  className = '',
}: PlaceCategoryBarProps) {
  return (
    <div
      className={`flex gap-2 overflow-x-auto px-1 py-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${className}`}
    >
      {PLACE_CATEGORIES.map((category) => {
        const isActive = activeCategory === category.key
        return (
          <button
            key={category.key}
            onClick={() => onSelect(category.key)}
            className={`flex-shrink-0 flex items-center gap-1.5 h-9 pl-2.5 pr-3.5 rounded-full text-[13px] font-semibold shadow-[0_1px_4px_rgba(0,0,0,0.15)] border transition-colors ${
              isActive
                ? 'text-white border-transparent'
                : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
            }`}
            style={isActive ? { backgroundColor: category.color } : undefined}
            aria-pressed={isActive}
          >
            <CategoryGlyph category={category.key} />
            <span>{category.label}</span>
            {isActive && isLoading && (
              <span className="w-3 h-3 ml-0.5 border-2 rounded-full border-white/60 border-t-transparent animate-spin" />
            )}
          </button>
        )
      })}
    </div>
  )
}

function CategoryGlyph({ category }: { category: PlaceCategoryKey }) {
  const common = {
    viewBox: '0 0 24 24',
    width: 15,
    height: 15,
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  }

  switch (category) {
    case 'restaurants':
      return (
        <svg {...common}>
          <path d="M7 2v7a2 2 0 0 0 2 2v11" />
          <path d="M11 2v9" />
          <path d="M17 2c-1.5 0-3 1.5-3 4v3a2 2 0 0 0 2 2v11" />
        </svg>
      )
    case 'hotels':
      return (
        <svg {...common}>
          <path d="M3 19v-9a2 2 0 0 1 2-2h5v6" />
          <path d="M3 19h18" />
          <path d="M10 14h9a2 2 0 0 1 2 2v3" />
        </svg>
      )
    case 'attractions':
      return (
        <svg {...common} fill="currentColor" stroke="none">
          <path d="M12 2l2.9 6.6L22 9.3l-5 4.9 1.2 7.1L12 17.8l-6.2 3.5L7 14.2 2 9.3l7.1-.7z" />
        </svg>
      )
    case 'things_to_do':
      return (
        <svg {...common}>
          <path d="M12 8v4l3 3" />
          <circle cx="12" cy="12" r="9" />
        </svg>
      )
    case 'services':
      return (
        <svg {...common}>
          <path d="M14.7 6.3a4 4 0 0 1-5.4 5.4l-6 6a1.5 1.5 0 0 0 2.1 2.1l6-6a4 4 0 0 1 5.4-5.4l-2.7 2.7-1.4-1.4z" />
        </svg>
      )
    case 'gas':
      return (
        <svg {...common}>
          <path d="M3 22V6a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v16" />
          <path d="M3 22h10" />
          <path d="M13 9h2l3 3v6a1.5 1.5 0 0 1-3 0v-2h-2" />
        </svg>
      )
    case 'groceries':
      return (
        <svg {...common}>
          <path d="M4 9h16l-1.5 10a2 2 0 0 1-2 1.8H7.5a2 2 0 0 1-2-1.8L4 9z" />
          <path d="M8 9V6a4 4 0 0 1 8 0v3" />
        </svg>
      )
    case 'coffee':
      return (
        <svg {...common}>
          <path d="M4 8h13v6a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5V8z" />
          <path d="M17 9h1.5a2.5 2.5 0 0 1 0 5H17" />
        </svg>
      )
    case 'parks':
      return (
        <svg {...common} fill="currentColor" stroke="none">
          <path d="M12 2 7 10h3l-4 6h4v6h4v-6h4l-4-6h3z" />
        </svg>
      )
    case 'gyms':
      return (
        <svg {...common}>
          <path d="M4 8v8M20 8v8" />
          <path d="M2 10v4M22 10v4" />
          <path d="M7 12h10" />
          <path d="M7 8v8M17 8v8" />
        </svg>
      )
    case 'art':
      return (
        <svg {...common}>
          <path d="M12 2a10 10 0 1 0 3.5 19.4c1-.4 1-1.8-.1-2.1a2.3 2.3 0 0 1-1.6-2.2c0-1.3 1-2.2 2.3-2.2H19a3 3 0 0 0 3-3c0-5.5-4.5-9.9-10-9.9z" />
          <circle cx="7.5" cy="10.5" r="1" fill="currentColor" stroke="none" />
          <circle cx="11" cy="7" r="1" fill="currentColor" stroke="none" />
          <circle cx="15.5" cy="8" r="1" fill="currentColor" stroke="none" />
        </svg>
      )
    case 'takeout':
      return (
        <svg {...common}>
          <path d="M6 8h12l-1 12a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L6 8z" />
          <path d="M9 8V6a3 3 0 0 1 6 0v2" />
        </svg>
      )
    case 'delivery':
      return (
        <svg {...common}>
          <rect x="2" y="7" width="13" height="9" rx="1" />
          <path d="M15 10h3l3 3v3h-6z" />
          <circle cx="6.5" cy="18" r="1.4" fill="currentColor" stroke="none" />
          <circle cx="16.5" cy="18" r="1.4" fill="currentColor" stroke="none" />
        </svg>
      )
    case 'homes':
      return (
        <svg {...common}>
          <path d="M3 11l9-8 9 8" />
          <path d="M5 10v10a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V10" />
        </svg>
      )
    case 'salon':
      return (
        <svg {...common}>
          <circle cx="6" cy="6" r="2.2" />
          <circle cx="6" cy="18" r="2.2" />
          <path d="M20 5 7.5 13" />
          <path d="M7.5 11 20 19" />
        </svg>
      )
  }
}
