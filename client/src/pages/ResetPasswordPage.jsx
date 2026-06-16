import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Loader2, Mail } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'
import api from '../services/api'

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const { success, error: showError } = useToast()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email) {
      setError('Email is required')
      return
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Invalid email format')
      return
    }

    setLoading(true)
    setError('')
    try {
      await api.post('/auth/forgot-password', { email })
      setSent(true)
      success('Password reset instructions sent to your email')
    } catch (err) {
      showError('Failed to send reset instructions')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md">
        <Link
          to="/login"
          className="inline-flex items-center gap-2 text-neutral-500 hover:text-neutral-700 mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to login
        </Link>

        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 bg-primary-100 rounded-full flex items-center justify-center">
            <Mail className="w-8 h-8 text-primary-600" />
          </div>
          <h1 className="text-3xl font-bold text-neutral-900">Reset Password</h1>
          <p className="text-neutral-500 mt-2">
            {sent
              ? 'Check your email for reset instructions'
              : "Enter your email and we'll send you reset instructions"}
          </p>
        </div>

        <div className="card p-8">
          {sent ? (
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-4 bg-secondary-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-secondary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-neutral-600 mb-6">
                We've sent password reset instructions to <strong>{email}</strong>.
                Please check your inbox and spam folder.
              </p>
              <button
                onClick={() => setSent(false)}
                className="btn btn-ghost"
              >
                Didn't receive? Try again
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="email" className="label">Email Address</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className={`input ${error ? 'input-error' : ''}`}
                  disabled={loading}
                />
                {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary w-full flex items-center justify-center gap-2"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                Send Reset Instructions
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-sm text-neutral-500 mt-6">
          Remember your password?{' '}
          <Link to="/login" className="text-primary-600 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}