package utils

import (
	"net/http"
	"time"
)

func SetRefreshCookie(w http.ResponseWriter, token string, secure bool) {

	cookie := http.Cookie{
		Name:     "refresh_token",
		Value:    token,
		Path:     "/api/refresh-token",
		Expires:  time.Now().Add(24 * time.Hour),
		HttpOnly: true,
		Secure:   secure,
		SameSite: http.SameSiteLaxMode,
	}

	http.SetCookie(w, &cookie)
}

func ClearRefreshCookie(w http.ResponseWriter, secure bool) {

	cookie := http.Cookie{
		Name:     "refresh_token",
		Value:    "",
		Path:     "/api/refresh-token",
		Expires:  time.Unix(0, 0),
		HttpOnly: true,
		Secure:   secure,
		SameSite: http.SameSiteLaxMode,
	}

	http.SetCookie(w, &cookie)
}
