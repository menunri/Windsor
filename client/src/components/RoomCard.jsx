import { Link } from 'react-router-dom'
import { Star, MapPin } from 'lucide-react'

export default function RoomCard({ room }) {
  const {
    id,
    title,
    price,
    bedrooms,
    bathrooms,
    images,
    avgRating,
    reviewCount,
    location
  } = room

  const primaryImage = images?.[0] || '/placeholder-room.jpg'

  return (
    <Link to={`/rooms/${id}`} className="block">
      <article className="card card-hover group">
        {/* Image */}
        <div className="relative aspect-[4/3] overflow-hidden bg-neutral-200">
          <img
            src={primaryImage}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg">
            <span className="text-sm font-semibold text-primary-700">
              ₱{price.toLocaleString()}/mo
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          <h3 className="font-semibold text-neutral-900 line-clamp-1 mb-2">
            {title}
          </h3>

          {/* Features */}
          <div className="flex items-center gap-4 text-sm text-neutral-500 mb-3">
            <span>{bedrooms} bed</span>
            <span>{bathrooms} bath</span>
            {location && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {location}
              </span>
            )}
          </div>

          {/* Rating */}
          {reviewCount > 0 && (
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              <span className="text-sm font-medium text-neutral-700">
                {avgRating.toFixed(1)}
              </span>
              <span className="text-sm text-neutral-400">
                ({reviewCount} reviews)
              </span>
            </div>
          )}
        </div>
      </article>
    </Link>
  )
}