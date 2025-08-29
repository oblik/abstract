import { useState, useEffect } from 'react'

// CSRF Token Hook
export function useCSRFToken() {
  const [csrfToken, setCSRFToken] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCSRFToken = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/auth/csrf', {
        method: 'GET',
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error('Failed to fetch CSRF token')
      }

      const data = await response.json()
      setCSRFToken(data.csrfToken)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCSRFToken()
  }, [])

  return { csrfToken, loading, error, refetch: fetchCSRFToken }
}

// 添加 CSRF token 到请求的函数
export async function fetchWithCSRF(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  // 获取 CSRF token
  const csrfResponse = await fetch('/api/auth/csrf', {
    method: 'GET',
    credentials: 'include'
  })

  if (!csrfResponse.ok) {
    throw new Error('Failed to get CSRF token')
  }

  const { csrfToken } = await csrfResponse.json()

  // 添加 CSRF token 到请求头
  const headers = {
    ...options.headers,
    'x-csrf-token': csrfToken,
    'Content-Type': 'application/json'
  }

  return fetch(url, {
    ...options,
    headers,
    credentials: 'include'
  })
}