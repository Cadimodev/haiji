package utils

import (
	"net/http"
	"time"
)

func SetRefreshCookie(w http.ResponseWriter, token string) {

	cookie := http.Cookie{
		Name:     "refresh_token",
		Value:    token,
		Path:     "/api/refresh-token",
		Expires:  time.Now().Add(24 * time.Hour),
		HttpOnly: true,
		Secure:   false, // TODO: Change it to true when https
		SameSite: http.SameSiteLaxMode,
	}

	http.SetCookie(w, &cookie)
}

func ClearRefreshCookie(w http.ResponseWriter) {

	cookie := http.Cookie{
		Name:     "refresh_token",
		Value:    "",
		Path:     "/api/refresh-token",
		Expires:  time.Unix(0, 0),
		HttpOnly: true,
	}

	http.SetCookie(w, &cookie)
}
