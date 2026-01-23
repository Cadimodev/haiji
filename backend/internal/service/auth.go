package service

import (
	"context"
	"database/sql"
	"errors"
	"net"
	"strings"
	"time"

	"github.com/Cadimodev/haiji/backend/internal/auth"
	"github.com/Cadimodev/haiji/backend/internal/database"
	"github.com/Cadimodev/haiji/backend/internal/dto"
	"github.com/Cadimodev/haiji/backend/internal/sessions"
)

type AuthService interface {
	Register(ctx context.Context, params dto.CreateUserRequest, userAgent string, ip string) (dto.UserWithTokenResponse, string, error)
	Login(ctx context.Context, params dto.LoginRequest, userAgent string, ip string) (dto.UserWithTokenResponse, string, error)
}

type authService struct {
	dbConn        *sql.DB
	db            database.Querier
	jwtSecret     string
	refreshPepper string
	platform      string
}

func NewAuthService(dbConn *sql.DB, db database.Querier, jwtSecret, refreshPepper, platform string) AuthService {
	return &authService{
		dbConn:        dbConn,
		db:            db,
		jwtSecret:     jwtSecret,
		refreshPepper: refreshPepper,
		platform:      platform,
	}
}

// Helper to convert DB user to DTO
func userToResponse(u database.User) dto.UserResponse {
	return dto.UserResponse{
		ID:        u.ID,
		Email:     u.Email,
		CreatedAt: u.CreatedAt,
		UpdatedAt: u.UpdatedAt,
		Username:  u.Username,
	}
}

func (s *authService) Register(ctx context.Context, params dto.CreateUserRequest, userAgent string, ip string) (dto.UserWithTokenResponse, string, error) {
	email := strings.ToLower(strings.TrimSpace(params.Email))
	username := strings.TrimSpace(params.Username)

	hashedPass, err := auth.HashPassword(params.Password)
	if err != nil {
		return dto.UserWithTokenResponse{}, "", err
	}

	tx, err := s.dbConn.BeginTx(ctx, nil)
	if err != nil {
		return dto.UserWithTokenResponse{}, "", err
	}
	defer tx.Rollback()

	var qtx database.Querier = s.db
	if q, ok := s.db.(*database.Queries); ok {
		qtx = q.WithTx(tx)
	}

	user, err := qtx.CreateUser(ctx, database.CreateUserParams{
		Email:          email,
		HashedPassword: hashedPass,
		Username:       username,
	})
	if err != nil {
		return dto.UserWithTokenResponse{}, "", err
	}

	accessToken, err := auth.MakeJWT(
		user.ID,
		s.jwtSecret,
		time.Hour,
	)
	if err != nil {
		return dto.UserWithTokenResponse{}, "", err
	}

	// Refresh Token
	parsedIP := net.ParseIP(ip)
	if parsedIP == nil {
		parsedIP = net.IP{127, 0, 0, 1}
	}

	refreshToken, err := sessions.IssueRefreshToken(
		ctx,
		qtx, // Use transaction query interface
		user.ID,
		userAgent,
		parsedIP,
		60*24*time.Hour,
		[]byte(s.refreshPepper),
	)
	if err != nil {
		return dto.UserWithTokenResponse{}, "", err
	}

	if err = tx.Commit(); err != nil {
		return dto.UserWithTokenResponse{}, "", err
	}

	return dto.UserWithTokenResponse{
		UserResponse: userToResponse(user),
		Token:        accessToken,
	}, refreshToken, nil
}

func (s *authService) Login(ctx context.Context, params dto.LoginRequest, userAgent string, ip string) (dto.UserWithTokenResponse, string, error) {
	user, err := s.db.GetUserByUsername(ctx, params.Username)
	if err != nil {
		return dto.UserWithTokenResponse{}, "", errors.New("incorrect username or password")
	}

	match, err := auth.CheckPasswordHash(params.Password, user.HashedPassword)
	if err != nil {
		return dto.UserWithTokenResponse{}, "", errors.New("incorrect username or password")
	}
	if !match {
		return dto.UserWithTokenResponse{}, "", errors.New("incorrect username or password")
	}

	accessToken, err := auth.MakeJWT(
		user.ID,
		s.jwtSecret,
		time.Hour,
	)
	if err != nil {
		return dto.UserWithTokenResponse{}, "", err
	}

	// Refresh Token
	parsedIP := net.ParseIP(ip)
	if parsedIP == nil {
		parsedIP = net.IP{127, 0, 0, 1}
	}

	refreshToken, err := sessions.IssueRefreshToken(
		ctx,
		s.db,
		user.ID,
		userAgent,
		parsedIP,
		60*24*time.Hour,
		[]byte(s.refreshPepper),
	)
	if err != nil {
		return dto.UserWithTokenResponse{}, "", err
	}

	return dto.UserWithTokenResponse{
		UserResponse: userToResponse(user),
		Token:        accessToken,
	}, refreshToken, nil
}
