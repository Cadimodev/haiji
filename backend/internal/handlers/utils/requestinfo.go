package utils

import (
	"net"
	"net/http"
	"strings"
)

func GetClientInfo(r *http.Request) (ip net.IP, ua string) {
	ua = r.UserAgent()

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
			return ip4, ua
		}
		if parsed.IsLoopback() {
			return net.ParseIP("127.0.0.1"), ua
		}
		return parsed, ua
	}
	return nil, ua
}
