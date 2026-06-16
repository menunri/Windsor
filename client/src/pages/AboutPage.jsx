import { Link } from 'react-router-dom'
import { Home, MapPin, Phone, Mail, Clock } from 'lucide-react'

export default function AboutPage() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="bg-gradient-to-br from-primary-700 via-primary-600 to-secondary-600 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl lg:text-5xl font-bold mb-4">About Windsor Residence</h1>
          <p className="text-lg text-white/90 max-w-2xl mx-auto">
            Discover comfortable living spaces where comfort meets convenience. 
            Quality accommodations for students and professionals.
          </p>
        </div>
      </section>

      {/* Story */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-neutral-900 mb-4">Our Story</h2>
            <p className="text-neutral-600 leading-relaxed">
              Windsor Residence was founded with a simple mission: to provide comfortable, 
              affordable, and convenient housing for students and young professionals. 
              We understand the challenges of finding the perfect place to call home, 
              especially in a busy city. That's why we've created spaces that are not 
              just rooms, but communities where you can thrive.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-primary-100 rounded-full flex items-center justify-center">
                <Home className="w-8 h-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold text-neutral-900 mb-2">Quality Spaces</h3>
              <p className="text-neutral-600">
                Every room is designed with comfort and functionality in mind, 
                featuring modern amenities to make your stay pleasant.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-secondary-100 rounded-full flex items-center justify-center">
                <MapPin className="w-8 h-8 text-secondary-600" />
              </div>
              <h3 className="text-xl font-semibold text-neutral-900 mb-2">Prime Location</h3>
              <p className="text-neutral-600">
                Strategically located near universities, business districts, 
                and public transportation for your convenience.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-neutral-900 mb-2">Community</h3>
              <p className="text-neutral-600">
                Join a vibrant community of like-minded individuals. 
                Build friendships and create lasting memories.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="py-16 bg-neutral-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-neutral-900 text-center mb-12">Contact Us</h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white rounded-xl p-6 shadow-card">
              <h3 className="text-lg font-semibold text-neutral-900 mb-4">Get in Touch</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-primary-600" />
                  </div>
                  <div>
                    <p className="font-medium text-neutral-900">Address</p>
                    <p className="text-sm text-neutral-500">123 Windsor Street, Manila, Philippines</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-secondary-100 rounded-full flex items-center justify-center">
                    <Phone className="w-5 h-5 text-secondary-600" />
                  </div>
                  <div>
                    <p className="font-medium text-neutral-900">Phone</p>
                    <p className="text-sm text-neutral-500">+63 2 123 4567</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <Mail className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-neutral-900">Email</p>
                    <p className="text-sm text-neutral-500">info@windsorresidence.com</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                    <Clock className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-medium text-neutral-900">Office Hours</p>
                    <p className="text-sm text-neutral-500">Mon - Sat: 8:00 AM - 6:00 PM</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-card">
              <h3 className="text-lg font-semibold text-neutral-900 mb-4">Send us a Message</h3>
              <form className="space-y-4">
                <input type="text" placeholder="Your Name" className="input" />
                <input type="email" placeholder="Your Email" className="input" />
                <textarea placeholder="Your Message" rows="4" className="input resize-none"></textarea>
                <button type="submit" className="btn btn-primary w-full">Send Message</button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-primary-700 text-white text-center">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold mb-4">Ready to find your new home?</h2>
          <p className="text-white/80 mb-8">Browse our rooms and start your journey with Windsor Residence today.</p>
          <Link to="/search" className="btn bg-white text-primary-700 hover:bg-neutral-100">
            Explore Rooms
          </Link>
        </div>
      </section>
    </div>
  )
}