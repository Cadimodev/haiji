package middleware

import (
	"net"
	"net/http"
	"sync"
	"time"
)

// tokenBucket represents a bucket of tokens for a key (IP)
type tokenBucket struct {
	tokens     float64
	lastRefill time.Time
}

// RateLimiter implements one token bucket per key
type RateLimiter struct {
	mu         sync.Mutex
	buckets    map[string]*tokenBucket
	capacity   float64 // max tokens
	refillRate float64 // tokens per second
}

// maxRequests: maximum number of requests allowed in the given interval.
// per: time interval in which those maxRequests tokens are "refilled".
func NewRateLimiter(maxRequests int, per time.Duration) *RateLimiter {
	if maxRequests <= 0 {
		maxRequests = 1
	}
	if per <= 0 {
		per = time.Minute
	}

	// tokens per second (maxRequests / per)
	refillRate := float64(maxRequests) / per.Seconds()

	return &RateLimiter{
		buckets:    make(map[string]*tokenBucket),
		capacity:   float64(maxRequests),
		refillRate: refillRate,
	}
}

// The allow function checks if one more request is allowed for the given key.
// If there are not enough tokens, it returns false.
func (rl *RateLimiter) allow(key string) bool {
	now := time.Now()

	rl.mu.Lock()
	defer rl.mu.Unlock()

	bucket, ok := rl.buckets[key]
	if !ok {
		rl.buckets[key] = &tokenBucket{
			tokens:     rl.capacity - 1,
			lastRefill: now,
		}
		return true
	}

	// Fill tokens according to the elapsed time
	elapsed := now.Sub(bucket.lastRefill).Seconds()
	if elapsed > 0 {
		bucket.tokens += elapsed * rl.refillRate
		if bucket.tokens > rl.capacity {
			bucket.tokens = rl.capacity
		}
	}

	bucket.lastRefill = now

	if bucket.tokens < 1 {
		return false
	}

	bucket.tokens -= 1
	return true
}

func (rl *RateLimiter) Middleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		ip := clientIP(r)
		key := ip

		if !rl.allow(key) {
			w.Header().Set("Retry-After", "60")
			http.Error(w, http.StatusText(http.StatusTooManyRequests), http.StatusTooManyRequests)
			return
		}

		next.ServeHTTP(w, r)
	})
}

// clientIP attempts to obtain the client's real IP address, taking proxies into account.
func clientIP(r *http.Request) string {
	// If its behind a reverse proxy (nginx, caddy, etc.)
	/*
		if xff := r.Header.Get("X-Forwarded-For"); xff != "" {
			parts := strings.Split(xff, ",")
			ip := strings.TrimSpace(parts[0])
			if ip != "" {
				return ip
			}
		}

		if xrip := r.Header.Get("X-Real-IP"); xrip != "" {
			return xrip
		}
	*/

	host, _, err := net.SplitHostPort(r.RemoteAddr)
	if err != nil {
		return r.RemoteAddr
	}

	return host
}
