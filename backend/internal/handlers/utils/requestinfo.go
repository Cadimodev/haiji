package utils

import (
	"log/slog"
	"net"
	"net/http"
	"strings"
)

func GetClientInfo(r *http.Request) (netIP interface{ String() string }, userAgent string) {
	userAgent = r.UserAgent()

	host := r.Header.Get("CF-Connecting-IP")
	if host == "" {
		host = r.Header.Get("X-Real-IP")
	}
	if host == "" {
		if xff := r.Header.Get("X-Forwarded-For"); xff != "" {
			host = strings.TrimSpace(strings.Split(xff, ",")[0])
		}
	}
	if host == "" {
		if h, _, err := net.SplitHostPort(r.RemoteAddr); err == nil {
			host = h
		}
	}

	if parsed := net.ParseIP(host); parsed != nil {
		if ip4 := parsed.To4(); ip4 != nil {
			return ip4, userAgent
		}
		if parsed.IsLoopback() {
			return net.ParseIP("127.0.0.1"), userAgent
		}
		return parsed, userAgent
	}
	return nil, userAgent
}

func LogRequest(r *http.Request) {
	slog.Info("Request", "method", r.Method, "path", r.URL.Path, "remote_addr", r.RemoteAddr)
}
