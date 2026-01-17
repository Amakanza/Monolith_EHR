import { NextRequest, NextResponse } from 'next/server';

// Simple in-memory rate limiter
// In production, use Redis or another distributed store
class RateLimiter {
  private requests = new Map<string, { count: number; resetTime: number }>();
  
  constructor(
    private windowMs: number = 60000, // 1 minute
    private maxRequests: number = 100   // 100 requests per minute
  ) {}

  isAllowed(ip: string): { allowed: boolean; resetTime?: number } {
    const now = Date.now();
    const key = ip;
    const existing = this.requests.get(key);

    if (!existing || now > existing.resetTime) {
      // New window or expired window
      this.requests.set(key, {
        count: 1,
        resetTime: now + this.windowMs
      });
      return { allowed: true };
    }

    if (existing.count >= this.maxRequests) {
      return { 
        allowed: false, 
        resetTime: existing.resetTime 
      };
    }

    // Increment counter
    existing.count++;
    return { allowed: true };
  }

  // Cleanup expired entries periodically
  cleanup() {
    const now = Date.now();
    for (const [key, value] of this.requests.entries()) {
      if (now > value.resetTime) {
        this.requests.delete(key);
      }
    }
  }
}

// Create different limiters for different endpoints
const strictLimiter = new RateLimiter(60000, 30);   // 30 requests per minute
const standardLimiter = new RateLimiter(60000, 100); // 100 requests per minute
const lenientLimiter = new RateLimiter(60000, 200);  // 200 requests per minute

// Cleanup every 5 minutes
setInterval(() => {
  strictLimiter.cleanup();
  standardLimiter.cleanup();
  lenientLimiter.cleanup();
}, 300000);

function getClientIP(request: NextRequest): string {
  // Try various headers for the real IP
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const clientIP = request.ip;
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  if (realIP) {
    return realIP;
  }
  
  return clientIP || 'unknown';
}

export interface RateLimitConfig {
  windowMs?: number;
  maxRequests?: number;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

export function createRateLimit(config: RateLimitConfig = {}) {
  const limiter = new RateLimiter(
    config.windowMs || 60000,
    config.maxRequests || 100
  );

  return function rateLimitMiddleware(request: NextRequest) {
    const ip = getClientIP(request);
    const result = limiter.isAllowed(ip);

    if (!result.allowed) {
      const headers = new Headers();
      headers.set('X-RateLimit-Limit', String(config.maxRequests || 100));
      headers.set('X-RateLimit-Remaining', '0');
      headers.set('X-RateLimit-Reset', String(Math.ceil((result.resetTime || 0) / 1000)));
      headers.set('Retry-After', String(Math.ceil((result.resetTime! - Date.now()) / 1000)));

      return new NextResponse(
        JSON.stringify({
          error: 'Too many requests',
          code: 'RATE_LIMITED',
          statusCode: 429,
          details: {
            limit: config.maxRequests || 100,
            resetTime: result.resetTime
          }
        }),
        {
          status: 429,
          headers,
        }
      );
    }

    // Add rate limit headers to successful responses
    const currentUsage = limiter.isAllowed(ip);
    const headers = new Headers();
    headers.set('X-RateLimit-Limit', String(config.maxRequests || 100));
    
    // Get current count from the internal requests map
    const requestData = (limiter as any).requests.get(ip);
    const currentCount = requestData?.count || 0;
    
    headers.set('X-RateLimit-Remaining', String(Math.max(0, (config.maxRequests || 100) - currentCount)));
    headers.set('X-RateLimit-Reset', String(Math.ceil((currentUsage.resetTime || 0) / 1000)));

    return { headers };
  };
}

// Predefined rate limiters for different endpoint types
export const rateLimit = {
  // For sensitive operations like authentication, clinic creation
  strict: createRateLimit({ windowMs: 60000, maxRequests: 30 }),
  
  // For general API endpoints
  standard: createRateLimit({ windowMs: 60000, maxRequests: 100 }),
  
  // For less sensitive operations like data fetching
  lenient: createRateLimit({ windowMs: 60000, maxRequests: 200 }),
  
  // For user search (more restrictive to prevent scraping)
  search: createRateLimit({ windowMs: 60000, maxRequests: 20 }),
};