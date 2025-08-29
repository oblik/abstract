import { NextRequest, NextResponse } from 'next/server'
import { generateCSRFToken, verifyCSRFToken } from '@/lib/authMiddleware'

// CSRF Token route
export async function GET(request: NextRequest) {
  // Generate new CSRF token
  const csrfToken = generateCSRFToken()
  
  // Store token in cookie
  const response = NextResponse.json({ csrfToken })
  response.cookies.set('csrf-token', csrfToken, {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 60 * 24 // 24 hours
  })
  
  return response
}