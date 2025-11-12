package sessions

import (
	"context"
	"database/sql"
	"net"
	"time"

	"github.com/Cadimodev/haiji/backend/internal/auth"
	"github.com/Cadimodev/haiji/backend/internal/database"
	"github.com/google/uuid"
)

func IssueRefreshToken(ctx context.Context, q *database.Queries, userID uuid.UUID, ua string, ip net.IP, ttl time.Duration, refreshPepper []byte) (string, error) {

	tokenHex, raw, err := auth.MakeRefreshTokenPair()
	if err != nil {
		return "", err
	}

	tokenHash := auth.HMACSHA256(raw, refreshPepper)

	_, err = q.CreateRefreshToken(ctx, database.CreateRefreshTokenParams{
		UserID:    userID,
		TokenHash: tokenHash,
		ExpiresAt: time.Now().UTC().Add(ttl),
		UserAgent: sql.NullString{String: ua, Valid: ua != ""},
		Ip:        database.ToInet(ip),
	})
	if err != nil {
		return "", err
	}
	return tokenHex, nil
}

func RevokeAllAndIssueNewSession(ctx context.Context, q *database.Queries, userID uuid.UUID, ua string, ip net.IP, refreshTTL time.Duration, jwtSecret string, accessTTL time.Duration, refreshPepper []byte) (access string, refresh string, err error) {

	_ = q.RevokeAllRefreshTokensForUser(ctx, userID)
	refresh, err = IssueRefreshToken(ctx, q, userID, ua, ip, refreshTTL, refreshPepper)
	if err != nil {
		return "", "", err
	}
	access, err = auth.MakeJWT(userID, jwtSecret, accessTTL)
	if err != nil {
		return "", "", err
	}
	return access, refresh, nil
}
