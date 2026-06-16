import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Search, Filter, SlidersHorizontal, X, MapPin, Bed, Bath, DollarSign, Sparkles, Loader2 } from 'lucide-react'
import RoomCard from '../components/RoomCard'
import { PageLoader, RoomCardSkeleton } from '../components/LoadingSpinner'
import api from '../services/api'

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(true)
  const [showFilters, setShowFilters] = useState(false)
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 })

  // Filter state
  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    minPrice: '',
    maxPrice: '',
    bedrooms: '',
    bathrooms: ''
  })

  // AI search interpretation state
  const [aiInterpretation, setAiInterpretation] = useState(null)
  const [isInterpreting, setIsInterpreting] = useState(false)

  useEffect(() => {
    fetchRooms()
  }, [searchParams])

  const fetchRooms = async () => {
    setLoading(true)
    try {
      const params = {
        page: searchParams.get('page') || 1,
        limit: 20
      }

      if (searchParams.get('search')) params.search = searchParams.get('search')
      if (searchParams.get('minPrice')) params.minPrice = searchParams.get('minPrice')
      if (searchParams.get('maxPrice')) params.maxPrice = searchParams.get('maxPrice')
      if (searchParams.get('bedrooms')) params.bedrooms = searchParams.get('bedrooms')
      if (searchParams.get('bathrooms')) params.bathrooms = searchParams.get('bathrooms')

      const response = await api.get('/rooms', { params })
      if (response.data.success) {
        setRooms(response.data.data.rooms)
        setPagination(response.data.data.pagination)
      }
    } catch (error) {
      console.error('Failed to fetch rooms:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = async (e) => {
    e.preventDefault()
    
    if (!filters.search.trim()) {
      setAiInterpretation(null)
      updateSearchParams({})
      return
    }

    setIsInterpreting(true)
    setAiInterpretation(null)

    try {
      // Send to AI for interpretation
      const response = await api.post('/ai/interpret-search', {
        query: filters.search
      })

      if (response.data.success && response.data.data.isNaturalLanguage) {
        const interpreted = response.data.data
        setAiInterpretation(interpreted)

        // Build params from AI interpretation
        const newParams = {}
        if (interpreted.filters?.minPrice) newParams.minPrice = interpreted.filters.minPrice
        if (interpreted.filters?.maxPrice) newParams.maxPrice = interpreted.filters.maxPrice
        if (interpreted.filters?.bedrooms) newParams.bedrooms = interpreted.filters.bedrooms
        if (interpreted.filters?.bathrooms) newParams.bathrooms = interpreted.filters.bathrooms
        // Keep the original search as keywords
        newParams.search = filters.search

        updateSearchParams(newParams)
      } else {
        // Regular keyword search
        setAiInterpretation(null)
        updateSearchParams({ search: filters.search })
      }
    } catch (error) {
      console.error('Search interpretation failed:', error)
      // Fallback to regular search
      updateSearchParams({ search: filters.search })
    } finally {
      setIsInterpreting(false)
    }
  }

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const applyFilters = () => {
    const params = {}
    if (filters.minPrice) params.minPrice = filters.minPrice
    if (filters.maxPrice) params.maxPrice = filters.maxPrice
    if (filters.bedrooms) params.bedrooms = filters.bedrooms
    if (filters.bathrooms) params.bathrooms = filters.bathrooms
    updateSearchParams(params)
    setShowFilters(false)
  }

  const clearFilters = () => {
    setFilters({ search: '', minPrice: '', maxPrice: '', bedrooms: '', bathrooms: '' })
    setAiInterpretation(null)
    setSearchParams({})
  }

  const updateSearchParams = (newParams) => {
    const params = new URLSearchParams(searchParams)
    Object.entries(newParams).forEach(([key, value]) => {
      if (value) {
        params.set(key, value)
      } else {
        params.delete(key)
      }
    })
    params.delete('page') // Reset to page 1 when searching
    setSearchParams(params)
  }

  const handlePageChange = (newPage) => {
    updateSearchParams({ page: newPage.toString() })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const hasActiveFilters = () => {
    return searchParams.has('minPrice') || searchParams.has('maxPrice') ||
           searchParams.has('bedrooms') || searchParams.has('bathrooms')
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Search Header */}
      <div className="bg-white border-b sticky top-16 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <form onSubmit={handleSearch} className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
              <input
                type="text"
                placeholder="Search rooms by name or description..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="input pl-12"
              />
            </div>
            <button type="submit" className="btn btn-primary">
              Search
            </button>
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className={`btn btn-outline relative ${hasActiveFilters() ? 'border-primary-600 text-primary-600' : ''}`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              Filters
              {hasActiveFilters() && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary-600 text-white text-xs rounded-full flex items-center justify-center">
                  !
                </span>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="bg-white border-b animate-slide-down">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="label">Min Price</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                  <input
                    type="number"
                    placeholder="0"
                    value={filters.minPrice}
                    onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                    className="input pl-10"
                  />
                </div>
              </div>
              <div>
                <label className="label">Max Price</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                  <input
                    type="number"
                    placeholder="Any"
                    value={filters.maxPrice}
                    onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                    className="input pl-10"
                  />
                </div>
              </div>
              <div>
                <label className="label">Bedrooms</label>
                <select
                  value={filters.bedrooms}
                  onChange={(e) => handleFilterChange('bedrooms', e.target.value)}
                  className="input"
                >
                  <option value="">Any</option>
                  <option value="1">1+</option>
                  <option value="2">2+</option>
                  <option value="3">3+</option>
                </select>
              </div>
              <div>
                <label className="label">Bathrooms</label>
                <select
                  value={filters.bathrooms}
                  onChange={(e) => handleFilterChange('bathrooms', e.target.value)}
                  className="input"
                >
                  <option value="">Any</option>
                  <option value="1">1+</option>
                  <option value="2">2+</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-4">
              <button onClick={clearFilters} className="btn btn-ghost">
                Clear All
              </button>
              <button onClick={applyFilters} className="btn btn-primary">
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Results */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Results header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-semibold text-neutral-900">
              {searchParams.get('search')
                ? `Results for "${searchParams.get('search')}"`
                : 'All Rooms'}
            </h1>
            <p className="text-sm text-neutral-500">
              {pagination.total} room{pagination.total !== 1 ? 's' : ''} found
            </p>
          </div>
          {hasActiveFilters() && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 text-sm text-neutral-500 hover:text-primary-600"
            >
              <X className="w-4 h-4" />
              Clear filters
            </button>
          )}
        </div>

        {/* AI Interpretation Display */}
        {isInterpreting && (
          <div className="bg-primary-50 border border-primary-200 rounded-lg p-4 mb-6 flex items-center gap-3">
            <Loader2 className="w-5 h-5 animate-spin text-primary-600" />
            <span className="text-primary-700">AI is interpreting your search...</span>
          </div>
        )}

        {aiInterpretation && !isInterpreting && (
          <div className="bg-primary-50 border border-primary-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-primary-600" />
              <span className="font-medium text-primary-800">AI Interpretation</span>
            </div>
            <p className="text-sm text-primary-700 mb-3">{aiInterpretation.explanation}</p>
            <div className="flex flex-wrap gap-2">
              {aiInterpretation.filters?.minPrice && (
                <span className="px-2 py-1 bg-primary-100 text-primary-700 text-xs rounded-full">
                  Min: ₱{Number(aiInterpretation.filters.minPrice).toLocaleString()}
                </span>
              )}
              {aiInterpretation.filters?.maxPrice && (
                <span className="px-2 py-1 bg-primary-100 text-primary-700 text-xs rounded-full">
                  Max: ₱{Number(aiInterpretation.filters.maxPrice).toLocaleString()}
                </span>
              )}
              {aiInterpretation.filters?.bedrooms && (
                <span className="px-2 py-1 bg-primary-100 text-primary-700 text-xs rounded-full">
                  {aiInterpretation.filters.bedrooms}+ bedrooms
                </span>
              )}
              {aiInterpretation.filters?.bathrooms && (
                <span className="px-2 py-1 bg-primary-100 text-primary-700 text-xs rounded-full">
                  {aiInterpretation.filters.bathrooms}+ bathrooms
                </span>
              )}
              {aiInterpretation.amenities?.map((amenity, i) => (
                <span key={i} className="px-2 py-1 bg-primary-100 text-primary-700 text-xs rounded-full">
                  {amenity}
                </span>
              ))}
            </div>
          </div>
        )}

        {loading ? (
          <RoomCardSkeleton />
        ) : rooms.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {rooms.map(room => (
                <RoomCard key={room.id} room={room} />
              ))}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="mt-12 flex justify-center gap-2">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className="btn btn-outline px-3 disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="flex items-center px-4 text-sm">
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.totalPages}
                  className="btn btn-outline px-3 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-16">
            <div className="w-16 h-16 mx-auto mb-4 bg-neutral-100 rounded-full flex items-center justify-center">
              <Search className="w-8 h-8 text-neutral-400" />
            </div>
            <h3 className="text-lg font-semibold text-neutral-900 mb-2">
              No rooms found
            </h3>
            <p className="text-neutral-500 mb-6">
              Try adjusting your search or filters to find what you're looking for.
            </p>
            <button onClick={clearFilters} className="btn btn-primary">
              Clear All Filters
            </button>
          </div>
        )}
      </div>
    </div>
  )
}