import { useState, useEffect, useCallback } from 'react'

// Types
interface User {
  id: string
  email: string
  name: string
  role: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  profile?: {
    firstName?: string
    lastName?: string
    company?: string
    phone?: string
    preferences?: any
  }
}

interface Estimate {
  id: string
  projectName: string
  clientName?: string
  location?: string
  facilityType: string
  totalCost: number
  status: string
  version: number
  createdAt: string
  updatedAt: string
  rooms: any[]
  equipment: any[]
  user: {
    id: string
    name: string
    email: string
  }
}

interface ApiResponse<T> {
  success: boolean
  data: T
  error?: string
}

// API helper functions
class DatabaseAPI {
  private static async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || ''
    const url = `${baseUrl}/api${endpoint}`

    // Get auth token from cookie or localStorage
    let token = ''
    if (typeof window !== 'undefined') {
      // Try to get from localStorage first (for compatibility)
      token = localStorage.getItem('auth-token') || ''
    }

    const response = await fetch(url, {
      credentials: 'include', // Include cookies
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
      throw new Error(errorData.error || `HTTP ${response.status}`)
    }

    const data: ApiResponse<T> = await response.json()
    if (!data.success) {
      throw new Error(data.error || 'Request failed')
    }

    return data.data
  }

  // Authentication
  static async login(email: string, password: string): Promise<{ user: User; expiresAt: string }> {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
  }

  static async register(
    email: string,
    password: string,
    name: string,
    role = 'USER'
  ): Promise<{ user: User; expiresAt: string }> {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name, role }),
    })
  }

  static async logout(): Promise<{ message: string }> {
    return this.request('/auth/logout', {
      method: 'POST',
    })
  }

  static async getCurrentUser(): Promise<User> {
    return this.request('/auth/me')
  }

  // Estimates
  static async getEstimates(params?: {
    page?: number
    limit?: number
    status?: string
    facilityType?: string
    search?: string
  }): Promise<{
    estimates: Estimate[]
    total: number
    page: number
    limit: number
    totalPages: number
  }> {
    const searchParams = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString())
        }
      })
    }

    const endpoint = `/estimates${searchParams.toString() ? `?${searchParams}` : ''}`
    return this.request(endpoint)
  }

  static async getEstimate(id: string): Promise<Estimate> {
    return this.request(`/estimates/${id}`)
  }

  static async createEstimate(data: any): Promise<Estimate> {
    return this.request('/estimates', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  static async updateEstimate(id: string, data: any): Promise<Estimate> {
    return this.request(`/estimates/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  static async deleteEstimate(id: string): Promise<{ deleted: boolean }> {
    return this.request(`/estimates/${id}`, {
      method: 'DELETE',
    })
  }
}

// LocalStorage migration utilities
class LocalStorageMigration {
  static migrateEstimates(): any[] {
    if (typeof window === 'undefined') return []

    try {
      // Check for estimates from the embedded calculator
      const directEstimates = JSON.parse(localStorage.getItem('ds-arch-estimates-direct') || '[]')

      // Check for estimates from the auth context
      const authEstimates = JSON.parse(localStorage.getItem('ds-arch-estimates') || '{}')
      const authEstimatesArray = Object.values(authEstimates)

      // Combine and normalize estimates
      const allEstimates = [...directEstimates, ...authEstimatesArray]

      return allEstimates.map((estimate: any) => ({
        projectName: estimate.projectName || 'Untitled Project',
        clientName: estimate.clientName || '',
        location: estimate.location || '',
        facilityType: estimate.facilityType || 'HOSPITAL',
        specialRequirements: estimate.specialRequirements || '',
        squareFootage: estimate.squareFootage || 0,
        numberOfRooms: estimate.numberOfRooms || estimate.rooms?.length || 0,
        rooms: estimate.rooms || [],
        equipment: estimate.equipment || [],
        // Migrate metadata
        _migrated: true,
        _originalId: estimate.id,
        _originalCreatedAt: estimate.createdAt || estimate.savedAt
      }))
    } catch (error) {
      console.error('Error migrating localStorage estimates:', error)
      return []
    }
  }

  static clearLocalStorage(): void {
    if (typeof window === 'undefined') return

    try {
      localStorage.removeItem('ds-arch-estimates-direct')
      localStorage.removeItem('ds-arch-estimates')
      localStorage.removeItem('ds-arch-users')
      localStorage.removeItem('ds-arch-user')
      console.log('LocalStorage migration cleanup completed')
    } catch (error) {
      console.error('Error clearing localStorage:', error)
    }
  }
}

// Main database hook
export function useDatabase() {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Initialize and check authentication
  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = useCallback(async () => {
    try {
      setIsLoading(true)
      const currentUser = await DatabaseAPI.getCurrentUser()
      setUser(currentUser)
    } catch (error) {
      setUser(null)
      // Clear any invalid tokens
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth-token')
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    try {
      setError(null)
      setIsLoading(true)

      const result = await DatabaseAPI.login(email, password)
      setUser(result.user)

      // Store token in localStorage for API calls
      if (typeof window !== 'undefined') {
        localStorage.setItem('auth-token', 'cookie-based') // Placeholder since we use HTTP-only cookies
      }

      return { success: true }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Login failed'
      setError(message)
      return { success: false, error: message }
    } finally {
      setIsLoading(false)
    }
  }, [])

  const register = useCallback(async (email: string, password: string, name: string) => {
    try {
      setError(null)
      setIsLoading(true)

      const result = await DatabaseAPI.register(email, password, name)
      setUser(result.user)

      // Store token in localStorage for API calls
      if (typeof window !== 'undefined') {
        localStorage.setItem('auth-token', 'cookie-based')
      }

      return { success: true }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Registration failed'
      setError(message)
      return { success: false, error: message }
    } finally {
      setIsLoading(false)
    }
  }, [])

  const logout = useCallback(async () => {
    try {
      await DatabaseAPI.logout()
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      setUser(null)
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth-token')
      }
    }
  }, [])

  // Estimate operations
  const createEstimate = useCallback(async (estimateData: any) => {
    try {
      setError(null)
      return await DatabaseAPI.createEstimate(estimateData)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create estimate'
      setError(message)
      throw error
    }
  }, [])

  const getEstimates = useCallback(async (params?: any) => {
    try {
      setError(null)
      return await DatabaseAPI.getEstimates(params)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch estimates'
      setError(message)
      throw error
    }
  }, [])

  const updateEstimate = useCallback(async (id: string, data: any) => {
    try {
      setError(null)
      return await DatabaseAPI.updateEstimate(id, data)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update estimate'
      setError(message)
      throw error
    }
  }, [])

  const deleteEstimate = useCallback(async (id: string) => {
    try {
      setError(null)
      return await DatabaseAPI.deleteEstimate(id)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete estimate'
      setError(message)
      throw error
    }
  }, [])

  // Migration utilities
  const migrateFromLocalStorage = useCallback(async () => {
    if (!user) {
      throw new Error('User must be logged in to migrate data')
    }

    try {
      setError(null)
      const localEstimates = LocalStorageMigration.migrateEstimates()

      if (localEstimates.length === 0) {
        return { migrated: 0 }
      }

      const results = []
      for (const estimate of localEstimates) {
        try {
          const created = await DatabaseAPI.createEstimate(estimate)
          results.push(created)
        } catch (error) {
          console.error('Failed to migrate estimate:', estimate, error)
        }
      }

      // Clear localStorage after successful migration
      if (results.length > 0) {
        LocalStorageMigration.clearLocalStorage()
      }

      return { migrated: results.length, total: localEstimates.length }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Migration failed'
      setError(message)
      throw error
    }
  }, [user])

  return {
    // Auth state
    user,
    isLoading,
    error,

    // Auth methods
    login,
    register,
    logout,
    checkAuth,

    // Estimate methods
    createEstimate,
    getEstimates,
    updateEstimate,
    deleteEstimate,

    // Migration
    migrateFromLocalStorage,

    // Utilities
    clearError: () => setError(null),
    isAuthenticated: !!user
  }
}
