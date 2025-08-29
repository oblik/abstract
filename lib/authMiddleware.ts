import { jwtVerify } from 'jose'
import { NextRequest, NextResponse } from 'next/server'

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || process.env.NEXT_PUBLIC_JWT_SECRET)

export async function verifyAuth(request: NextRequest) {
  try {
    // 从 cookie 中获取 token
    const token = request.cookies.get('user-token')?.value
    
    if (!token) {
      return { authenticated: false, error: 'No token provided' }
    }

    // 验证 JWT token
    const verified = await jwtVerify(token, JWT_SECRET)
    
    return {
      authenticated: true,
      payload: verified.payload,
      walletAddress: verified.payload.walletAddress
    }
  } catch (error) {
    console.error('JWT 验证失败 ❌ JWT verification failed:', error)
    return { authenticated: false, error: 'Invalid token' }
  }
}

export function createAuthHandler(handler: (req: NextRequest, context: any) => Promise<NextResponse>) {
  return async (request: NextRequest, context: any) => {
    const auth = await verifyAuth(request)
    
    if (!auth.authenticated) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    // 将认证信息添加到上下文中
    context.auth = auth
    
    return handler(request, context)
  }
}

// 速率限制存储（简单实现）
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

export async function rateLimit(
  request: NextRequest,
  limit: number = 100,
  windowMs: number = 60 * 60 * 1000
) {
  const ip = request.headers.get('x-forwarded-for') || 
             request.headers.get('x-real-ip') || 
             'unknown'
  const key = `${ip}:${request.nextUrl.pathname}`
  const now = Date.now()
  
  const record = rateLimitStore.get(key)
  
  if (!record || now > record.resetTime) {
    // 创建新的记录
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + windowMs
    })
    return { allowed: true, remaining: limit - 1 }
  }
  
  if (record.count >= limit) {
    return { allowed: false, remaining: 0 }
  }
  
  record.count++
  return { allowed: true, remaining: limit - record.count }
}

// CSRF Token 生成和验证
export function generateCSRFToken(): string {
  return crypto.randomUUID()
}

export function verifyCSRFToken(token: string, sessionToken: string): boolean {
  // 在实际应用中，应该将 CSRF token 与 session 绑定
  // 这里简化实现，仅检查 token 格式
  return token.length === 36 && /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(token)
}

// 输入验证和清理
export function sanitizeInput(input: string): string {
  // 移除潜在的 XSS 攻击代码
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .trim()
}

export function validateWalletAddress(address: string): boolean {
  // 简单的钱包地址验证
  return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address)
}

export function validateUsername(username: string): boolean {
  // 用户名验证：3-20个字符，只允许字母、数字、下划线
  return /^[a-zA-Z0-9_]{3,20}$/.test(username)
}

export function validateEmail(email: string): boolean {
  // Email validation
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

// CSRF verification middleware function
export async function verifyCSRF(request: NextRequest): Promise<boolean> {
  try {
    // Get CSRF token from header
    const csrfToken = request.headers.get('x-csrf-token')
    
    if (!csrfToken) {
      return false
    }
    
    // Get session token from cookie
    const sessionToken = request.cookies.get('user-token')?.value
    
    if (!sessionToken) {
      return false
    }
    
    // Verify CSRF token
    return verifyCSRFToken(csrfToken, sessionToken)
  } catch (error) {
    console.error('CSRF 验证失败 ❌ CSRF verification failed:', error)
    return false
  }
}

// Create handler wrapper with CSRF verification
export function withCSRF(handler: (req: NextRequest, context?: any) => Promise<NextResponse>) {
  return async (request: NextRequest, context?: any) => {
    // For GET, HEAD, OPTIONS requests, no CSRF verification needed
    const method = request.method
    if (['GET', 'HEAD', 'OPTIONS'].includes(method)) {
      return handler(request, context)
    }
    
    // For state-changing operations (POST, PUT, DELETE, etc.), CSRF verification required
    const isValidCSRF = await verifyCSRF(request)
    if (!isValidCSRF) {
      return NextResponse.json(
        { error: 'Invalid CSRF token' },
        { status: 403 }
      )
    }
    
    return handler(request, context)
  }
}