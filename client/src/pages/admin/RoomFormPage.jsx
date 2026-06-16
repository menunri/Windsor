import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { ArrowLeft, Save, Upload, X, Plus, Image as ImageIcon, Sparkles, Loader2 } from 'lucide-react'
import api, { uploadImages } from '../../services/api'
import { useToast } from '../../contexts/ToastContext'

export default function AdminRoomFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { showToast } = useToast()
  const isEditing = Boolean(id)
  const fileInputRef = useRef(null)

  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(isEditing)
  const [uploading, setUploading] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    bedrooms: 1,
    bathrooms: 1,
    area: '',
    floor: '',
    unitNumber: '',
    images: [],
    isActive: true,
  })
  
  // State for new files to upload
  const [pendingFiles, setPendingFiles] = useState([])

  // State for AI description generation
  const [isGeneratingDescription, setIsGeneratingDescription] = useState(false)
  const [generatedDescription, setGeneratedDescription] = useState('')

  useEffect(() => {
    if (isEditing) {
      fetchRoom()
    }
  }, [id])

  const fetchRoom = async () => {
    try {
      const response = await api.get(`/rooms/admin/${id}`)
      if (response.data.success) {
        const room = response.data.data
        setFormData({
          title: room.title,
          description: room.description,
          price: room.price.toString(),
          bedrooms: room.bedrooms,
          bathrooms: room.bathrooms,
          area: room.area?.toString() || '',
          floor: room.floor?.toString() || '',
          unitNumber: room.unitNumber || '',
          images: room.images || [],
          isActive: room.isActive,
        })
      }
    } catch (error) {
      showToast('Failed to load room', 'error')
      navigate('/admin/rooms')
    } finally {
      setInitialLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  // Handle file selection
  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files)
    if (files.length === 0) return
    
    // Validate files
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    const maxSize = 5 * 1024 * 1024 // 5MB
    
    const validFiles = []
    for (const file of files) {
      if (!validTypes.includes(file.type)) {
        showToast(`${file.name} is not a valid image type`, 'error')
        continue
      }
      if (file.size > maxSize) {
        showToast(`${file.name} is too large (max 5MB)`, 'error')
        continue
      }
      validFiles.push(file)
    }
    
    if (validFiles.length > 0) {
      setPendingFiles((prev) => [...prev, ...validFiles])
    }
    
    // Reset input
    e.target.value = ''
  }

  // Remove a pending file
  const handlePendingFileRemove = (index) => {
    setPendingFiles((prev) => prev.filter((_, i) => i !== index))
  }

  // Remove an uploaded image
  const handleImageRemove = (index) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }))
  }

  // Generate description using AI
  const handleGenerateDescription = async () => {
    if (!formData.bedrooms || !formData.bathrooms) {
      showToast('Please fill in bedrooms and bathrooms first', 'warning')
      return
    }

    setIsGeneratingDescription(true)
    try {
      const response = await api.post('/ai/generate-description', {
        title: formData.title,
        bedrooms: parseInt(formData.bedrooms),
        bathrooms: parseFloat(formData.bathrooms),
        area: formData.area ? parseFloat(formData.area) : null,
        floor: formData.floor ? parseInt(formData.floor) : null,
        unitNumber: formData.unitNumber,
        amenities: [], // TODO: Add amenities selection
        price: formData.price ? parseFloat(formData.price) : null,
        existingDescription: formData.description
      })

      if (response.data.success) {
        setGeneratedDescription(response.data.data.description)
        setFormData((prev) => ({
          ...prev,
          description: response.data.data.description
        }))
        showToast('Description generated! You can edit it before saving.', 'success')
      }
    } catch (error) {
      console.error('Failed to generate description:', error)
      showToast('Failed to generate description. Please try again.', 'error')
    } finally {
      setIsGeneratingDescription(false)
    }
  }

  // Upload pending files and get URLs
  const uploadPendingFiles = async () => {
    if (pendingFiles.length === 0) return formData.images
    
    setUploading(true)
    try {
      const response = await uploadImages(pendingFiles)
      
      if (response.success && response.data.uploaded) {
        const newUrls = response.data.uploaded.map((img) => img.url)
        const allImages = [...formData.images, ...newUrls]
        
        // Clear pending files
        setPendingFiles([])
        
        return allImages
      } else {
        throw new Error('Upload failed')
      }
    } catch (error) {
      showToast('Failed to upload images', 'error')
      throw error
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Upload pending files first
      const uploadedImages = await uploadPendingFiles()
      
      const payload = {
        ...formData,
        images: uploadedImages,
        price: parseFloat(formData.price),
        bedrooms: parseInt(formData.bedrooms),
        bathrooms: parseFloat(formData.bathrooms),
        area: formData.area ? parseFloat(formData.area) : null,
        floor: formData.floor ? parseInt(formData.floor) : null,
      }

      const endpoint = isEditing ? `/rooms/admin/${id}` : '/rooms/admin'
      const method = isEditing ? 'put' : 'post'

      const response = await api[method](endpoint, payload)

      if (response.data.success) {
        showToast(
          isEditing ? 'Room updated successfully' : 'Room created successfully',
          'success'
        )
        navigate('/admin/rooms')
      }
    } catch (error) {
      showToast(error.response?.data?.error || 'Failed to save room', 'error')
    } finally {
      setLoading(false)
    }
  }

  if (initialLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 w-48 bg-neutral-200 rounded mb-4" />
        <div className="h-96 bg-neutral-200 rounded-xl" />
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <Link
          to="/admin/rooms"
          className="inline-flex items-center gap-2 text-neutral-500 hover:text-neutral-700 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Rooms
        </Link>
        <h2 className="text-2xl font-bold text-neutral-900">
          {isEditing ? 'Edit Room' : 'Add New Room'}
        </h2>
        <p className="text-neutral-500">
          {isEditing ? 'Update room details' : 'Create a new room listing'}
        </p>
      </div>

      {/* Form */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-neutral-900">Basic Information</h3>

            <div>
              <label htmlFor="title" className="block text-sm font-medium text-neutral-700 mb-1">
                Room Title *
              </label>
              <input
                id="title"
                name="title"
                type="text"
                value={formData.title}
                onChange={handleChange}
                required
                placeholder="e.g., Modern Studio Apartment"
                className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="description" className="block text-sm font-medium text-neutral-700">
                  Description *
                </label>
                <button
                  type="button"
                  onClick={handleGenerateDescription}
                  disabled={isGeneratingDescription || !formData.bedrooms || !formData.bathrooms}
                  className="inline-flex items-center gap-1 px-3 py-1 text-sm bg-primary-100 hover:bg-primary-200 text-primary-700 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isGeneratingDescription ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3 h-3" />
                      Generate with AI
                    </>
                  )}
                </button>
              </div>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                rows={4}
                placeholder="Describe the room and its features..."
                className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
              {generatedDescription && (
                <p className="text-xs text-primary-600 mt-1">
                  AI-generated description ready. You can edit it before saving.
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="price" className="block text-sm font-medium text-neutral-700 mb-1">
                  Monthly Price (PHP) *
                </label>
                <input
                  id="price"
                  name="price"
                  type="number"
                  value={formData.price}
                  onChange={handleChange}
                  required
                  min="0"
                  placeholder="25000"
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              <div>
                <label htmlFor="unitNumber" className="block text-sm font-medium text-neutral-700 mb-1">
                  Unit Number
                </label>
                <input
                  id="unitNumber"
                  name="unitNumber"
                  type="text"
                  value={formData.unitNumber}
                  onChange={handleChange}
                  placeholder="e.g., Unit 101"
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>
          </div>

          {/* Room Details */}
          <div className="space-y-4 pt-4 border-t">
            <h3 className="text-lg font-semibold text-neutral-900">Room Details</h3>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label htmlFor="bedrooms" className="block text-sm font-medium text-neutral-700 mb-1">
                  Bedrooms *
                </label>
                <input
                  id="bedrooms"
                  name="bedrooms"
                  type="number"
                  value={formData.bedrooms}
                  onChange={handleChange}
                  required
                  min="0"
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              <div>
                <label htmlFor="bathrooms" className="block text-sm font-medium text-neutral-700 mb-1">
                  Bathrooms *
                </label>
                <input
                  id="bathrooms"
                  name="bathrooms"
                  type="number"
                  value={formData.bathrooms}
                  onChange={handleChange}
                  required
                  min="0"
                  step="0.5"
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              <div>
                <label htmlFor="area" className="block text-sm font-medium text-neutral-700 mb-1">
                  Area (m²)
                </label>
                <input
                  id="area"
                  name="area"
                  type="number"
                  value={formData.area}
                  onChange={handleChange}
                  min="0"
                  placeholder="35"
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              <div>
                <label htmlFor="floor" className="block text-sm font-medium text-neutral-700 mb-1">
                  Floor
                </label>
                <input
                  id="floor"
                  name="floor"
                  type="number"
                  value={formData.floor}
                  onChange={handleChange}
                  min="0"
                  placeholder="2"
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>
          </div>

          {/* Images */}
          <div className="space-y-4 pt-4 border-t">
            <h3 className="text-lg font-semibold text-neutral-900">Images</h3>
            <p className="text-sm text-neutral-500">
              Upload room images (JPEG, PNG, GIF, WebP - max 5MB each)
            </p>

            {/* Upload button */}
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                multiple
                onChange={handleFileSelect}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                <Upload className="w-5 h-5" />
                {uploading ? 'Uploading...' : 'Select Images'}
              </button>
            </div>

            {/* Existing uploaded images */}
            {formData.images.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-neutral-700">Uploaded Images</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {formData.images.map((url, index) => (
                    <div key={`existing-${index}`} className="relative group">
                      <img
                        src={url}
                        alt={`Room image ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg"
                        onError={(e) => {
                          e.target.src = 'https://via.placeholder.com/150?text=Invalid+Image'
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => handleImageRemove(index)}
                        className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Pending files to upload */}
            {pendingFiles.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-neutral-700">
                  New Images (will be uploaded when saving)
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {pendingFiles.map((file, index) => (
                    <div key={`pending-${index}`} className="relative group">
                      <div className="w-full h-32 bg-neutral-100 rounded-lg flex items-center justify-center overflow-hidden">
                        <img
                          src={URL.createObjectURL(file)}
                          alt={`Pending ${index + 1}`}
                          className="w-full h-32 object-cover"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handlePendingFileRemove(index)}
                        className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      <p className="text-xs text-neutral-500 mt-1 truncate">{file.name}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Empty state */}
            {formData.images.length === 0 && pendingFiles.length === 0 && (
              <div className="flex flex-col items-center justify-center py-8 text-neutral-400">
                <ImageIcon className="w-12 h-12 mb-2" />
                <p className="text-sm">No images added yet</p>
              </div>
            )}
          </div>

          {/* Status */}
          <div className="space-y-4 pt-4 border-t">
            <h3 className="text-lg font-semibold text-neutral-900">Settings</h3>

            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                name="isActive"
                checked={formData.isActive}
                onChange={handleChange}
                className="w-5 h-5 text-primary-600 border-neutral-300 rounded focus:ring-primary-500"
              />
              <span className="text-sm text-neutral-700">Room is active and visible to users</span>
            </label>
          </div>

          {/* Submit */}
          <div className="flex items-center justify-end gap-4 pt-4 border-t">
            <Link
              to="/admin/rooms"
              className="px-6 py-2 text-neutral-700 hover:text-neutral-900 transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading || uploading}
              className="inline-flex items-center gap-2 px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              <Save className="w-5 h-5" />
              {loading ? 'Saving...' : 'Save Room'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
