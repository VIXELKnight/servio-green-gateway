import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export interface RateLimitResult {
  allowed: boolean;
  currentCount: number;
  resetAt: Date;
}

export interface RateLimitConfig {
  maxRequests: number;
  windowMinutes: number;
}

// Default limits for different endpoint types
export const RATE_LIMITS = {
  oauth: { maxRequests: 10, windowMinutes: 1 },     // 10 req/min - OAuth is sensitive
  chat: { maxRequests: 30, windowMinutes: 1 },      // 30 req/min - Allow conversation flow
  checkout: { maxRequests: 10, windowMinutes: 1 },  // 10 req/min - Payment endpoints
  webhook: { maxRequests: 100, windowMinutes: 1 },  // 100 req/min - Webhooks need higher limits
  default: { maxRequests: 60, windowMinutes: 1 },   // 60 req/min - General API
} as const;

/**
 * Extract client identifier from request
 * Prioritizes: X-Forwarded-For > X-Real-IP > CF-Connecting-IP > fallback
 */
export function getClientIdentifier(req: Request, fallback?: string): string {
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) {
    // Get the first IP in the chain (original client)
    return forwardedFor.split(",")[0].trim();
  }
  
  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp;
  
  const cfIp = req.headers.get("cf-connecting-ip");
  if (cfIp) return cfIp;
  
  // Fallback to provided identifier or anonymous
  return fallback || "anonymous";
}

/**
 * Check rate limit using database function
 */
export async function checkRateLimit(
  identifier: string,
  endpoint: string,
  config: RateLimitConfig = RATE_LIMITS.default
): Promise<RateLimitResult> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  try {
    const { data, error } = await supabase.rpc("check_rate_limit", {
      p_identifier: identifier,
      p_endpoint: endpoint,
      p_max_requests: config.maxRequests,
      p_window_minutes: config.windowMinutes,
    });
    
    if (error) {
      console.error("Rate limit check error:", error);
      // Fail open - allow the request if rate limiting fails
      return { allowed: true, currentCount: 0, resetAt: new Date() };
    }
    
    const result = data?.[0] || { allowed: true, current_count: 0, reset_at: new Date().toISOString() };
    
    return {
      allowed: result.allowed,
      currentCount: result.current_count,
      resetAt: new Date(result.reset_at),
    };
  } catch (error) {
    console.error("Rate limit check failed:", error);
    // Fail open
    return { allowed: true, currentCount: 0, resetAt: new Date() };
  }
}

/**
 * Create a rate limit exceeded response with proper headers
 */
export function rateLimitExceededResponse(
  result: RateLimitResult,
  corsHeaders: Record<string, string>
): Response {
  const retryAfter = Math.ceil((result.resetAt.getTime() - Date.now()) / 1000);
  
  return new Response(
    JSON.stringify({
      error: "Rate limit exceeded",
      message: "Too many requests. Please try again later.",
      retry_after: retryAfter,
    }),
    {
      status: 429,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
        "Retry-After": String(Math.max(1, retryAfter)),
        "X-RateLimit-Limit": String(RATE_LIMITS.default.maxRequests),
        "X-RateLimit-Remaining": "0",
        "X-RateLimit-Reset": result.resetAt.toISOString(),
      },
    }
  );
}

/**
 * Add rate limit headers to successful response
 */
export function addRateLimitHeaders(
  headers: Record<string, string>,
  result: RateLimitResult,
  config: RateLimitConfig = RATE_LIMITS.default
): Record<string, string> {
  return {
    ...headers,
    "X-RateLimit-Limit": String(config.maxRequests),
    "X-RateLimit-Remaining": String(Math.max(0, config.maxRequests - result.currentCount)),
    "X-RateLimit-Reset": result.resetAt.toISOString(),
  };
}
