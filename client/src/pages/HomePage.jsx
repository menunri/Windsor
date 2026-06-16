import { Link } from 'react-router-dom'
import { Search, Home, MessageSquare, ChevronLeft, ChevronRight } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import RoomCard from '../components/RoomCard'
import { CardSkeleton } from '../components/LoadingSpinner'
import api from '../services/api'

export default function HomePage() {
  const [featuredRooms, setFeaturedRooms] = useState([])
  const [loading, setLoading] = useState(true)
  const scrollRef = useRef(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)

  useEffect(() => {
    fetchFeaturedRooms()
  }, [])

  const fetchFeaturedRooms = async () => {
    try {
      const response = await api.get('/rooms', { params: { limit: 10 } })
      if (response.data.success) {
        setFeaturedRooms(response.data.data.rooms)
      }
    } catch (error) {
      console.error('Failed to fetch rooms:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleScroll = (direction) => {
    if (scrollRef.current) {
      const scrollAmount = 300
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      })
    }
  }

  const updateScrollButtons = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current
      setCanScrollLeft(scrollLeft > 0)
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10)
    }
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary-700 via-primary-600 to-secondary-600 text-white overflow-hidden group">
        <div className="absolute inset-0 hero-image-reveal" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
          <div className="max-w-2xl">
            <h1 className="text-4xl lg:text-6xl font-bold mb-6 leading-tight">
              Find Your Perfect Home at Windsor
            </h1>
            <p className="text-lg lg:text-xl text-white/90 mb-8">
              Discover comfortable living spaces in our residence. Quality accommodations 
              with modern amenities for students and professionals.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link to="/search" className="btn btn-secondary flex items-center gap-2">
                <Search className="w-5 h-5" />
                Browse Rooms
              </Link>
              <Link to="/about" className="btn bg-white/10 hover:bg-white/20 flex items-center gap-2">
                <Home className="w-5 h-5" />
                About Us
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Links */}
      <section className="py-12 bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <Link
              to="/search"
              className="flex items-center gap-3 p-4 rounded-xl bg-neutral-50 hover:bg-primary-50 transition-colors group"
            >
              <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center">
                <Search className="w-6 h-6 text-primary-600" />
              </div>
              <div>
                <p className="font-semibold text-neutral-900 group-hover:text-primary-700">
                  Search Rooms
                </p>
                <p className="text-sm text-neutral-500">Find your stay</p>
              </div>
            </Link>

            <Link
              to="/rooms"
              className="flex items-center gap-3 p-4 rounded-xl bg-neutral-50 hover:bg-secondary-50 transition-colors group"
            >
              <div className="w-12 h-12 rounded-full bg-secondary-100 flex items-center justify-center">
                <svg className="w-6 h-6 text-secondary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-neutral-900 group-hover:text-secondary-700">
                  Our Rooms
                </p>
                <p className="text-sm text-neutral-500">View listings</p>
              </div>
            </Link>

            <Link
              to="/about"
              className="flex items-center gap-3 p-4 rounded-xl bg-neutral-50 hover:bg-purple-50 transition-colors group"
            >
              <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                <Home className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="font-semibold text-neutral-900 group-hover:text-purple-700">
                  About Us
                </p>
                <p className="text-sm text-neutral-500">Learn more</p>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Rooms */}
      <section className="py-16 bg-neutral-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl lg:text-3xl font-bold text-neutral-900">
                Featured Rooms
              </h2>
              <p className="text-neutral-500 mt-1">
                Check out our most popular accommodations
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleScroll('left')}
                disabled={!canScrollLeft}
                className="w-10 h-10 rounded-full border border-neutral-300 flex items-center justify-center hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => handleScroll('right')}
                disabled={!canScrollRight}
                className="w-10 h-10 rounded-full border border-neutral-300 flex items-center justify-center hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex gap-6 overflow-hidden">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex-shrink-0 w-72">
                  <CardSkeleton />
                </div>
              ))}
            </div>
          ) : featuredRooms.length > 0 ? (
            <div
              ref={scrollRef}
              onScroll={updateScrollButtons}
              className="flex gap-6 overflow-x-auto scrollbar-hide pb-4 scroll-smooth"
            >
              {featuredRooms.map(room => (
                <div key={room.id} className="flex-shrink-0 w-72">
                  <RoomCard room={room} />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-xl">
              <p className="text-neutral-500 mb-4">No rooms available at the moment</p>
              <Link to="/search" className="btn btn-primary">
                View All Rooms
              </Link>
            </div>
          )}

          <div className="mt-8 text-center">
            <Link to="/search" className="btn btn-outline">
              View All Rooms
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-primary-700 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Have questions?</h2>
          <p className="text-white/80 mb-8 max-w-xl mx-auto">
            Get in touch with us to learn more about our rooms and schedule a viewing.
          </p>
          <div className="flex justify-center gap-4">
            <Link to="/search" className="btn bg-white text-primary-700 hover:bg-neutral-100">
              Browse Rooms
            </Link>
            <Link to="/about" className="btn border-2 border-white text-white hover:bg-white/10">
              Contact Us
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
