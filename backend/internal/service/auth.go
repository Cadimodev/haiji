package service

import (
	"context"
	"errors"
	"net"
	"time"

	"github.com/Cadimodev/haiji/backend/internal/auth"
	"github.com/Cadimodev/haiji/backend/internal/database"
	"github.com/Cadimodev/haiji/backend/internal/dto"
	"github.com/Cadimodev/haiji/backend/internal/sessions"
	"github.com/google/uuid"
)

type AuthService interface {
	Register(ctx context.Context, params dto.CreateUserRequest, userAgent string, ip string) (dto.UserWithTokenResponse, string, error)
	Login(ctx context.Context, params dto.LoginRequest, userAgent string, ip string) (dto.UserWithTokenResponse, string, error)
	UpdateUser(ctx context.Context, userID uuid.UUID, params dto.UpdateUserRequest, userAgent string, ip string) (dto.UserWithTokenResponse, string, error)
	RefreshToken(ctx context.Context, refreshTokenHex string) (dto.UserWithTokenResponse, string, error)
	RevokeToken(ctx context.Context, refreshTokenHex string) error
	GetUser(ctx context.Context, userID uuid.UUID) (dto.UserResponse, error)
}

type authService struct {
	txManager     database.TxManager
	db            database.Querier
	jwtSecret     string
	refreshPepper string
	platform      string
}

func NewAuthService(txManager database.TxManager, db database.Querier, jwtSecret, refreshPepper, platform string) AuthService {
	return &authService{
		txManager:     txManager,
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
	params.Sanitize()
	email := params.Email
	username := params.Username

	hashedPass, err := auth.HashPassword(params.Password)
	if err != nil {
		return dto.UserWithTokenResponse{}, "", err
	}

	var response dto.UserWithTokenResponse
	var refreshToken string

	err = s.txManager.ExecTx(ctx, func(qtx database.Querier) error {
		user, err := qtx.CreateUser(ctx, database.CreateUserParams{
			Email:          email,
			HashedPassword: hashedPass,
			Username:       username,
		})
		if err != nil {
			return err
		}

		accessToken, err := auth.MakeJWT(
			user.ID,
			s.jwtSecret,
			time.Hour,
		)
		if err != nil {
			return err
		}

		// Refresh Token
		parsedIP := net.ParseIP(ip)
		if parsedIP == nil {
			parsedIP = net.IP{127, 0, 0, 1}
		}

		rt, err := sessions.IssueRefreshToken(
			ctx,
			qtx,
			user.ID,
			userAgent,
			parsedIP,
			60*24*time.Hour,
			[]byte(s.refreshPepper),
		)
		if err != nil {
			return err
		}

		response = dto.UserWithTokenResponse{
			UserResponse: userToResponse(user),
			Token:        accessToken,
		}
		refreshToken = rt

		return nil
	})

	if err != nil {
		return dto.UserWithTokenResponse{}, "", err
	}

	return response, refreshToken, nil
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

func (s *authService) UpdateUser(ctx context.Context, userID uuid.UUID, params dto.UpdateUserRequest, userAgent string, ip string) (dto.UserWithTokenResponse, string, error) {
	params.Sanitize()
	email := params.Email
	username := params.Username

	user, err := s.db.GetUserByID(ctx, userID)
	if err != nil {
		return dto.UserWithTokenResponse{}, "", errors.New("incorrect username or password")
	}

	result, err := auth.CheckPasswordHash(params.OldPassword, user.HashedPassword)
	if err != nil {
		return dto.UserWithTokenResponse{}, "", errors.New("incorrect username or password")
	}
	if !result {
		return dto.UserWithTokenResponse{}, "", errors.New("incorrect username or password")
	}

	hashedPassword, err := auth.HashPassword(params.NewPassword)
	if err != nil {
		return dto.UserWithTokenResponse{}, "", err
	}

	user, err = s.db.UpdateUser(ctx, database.UpdateUserParams{
		ID:             userID,
		Email:          email,
		HashedPassword: hashedPassword,
		Username:       username,
	})
	if err != nil {
		return dto.UserWithTokenResponse{}, "", err
	}

	// Rotate session
	parsedIP := net.ParseIP(ip)
	if parsedIP == nil {
		parsedIP = net.IP{127, 0, 0, 1}
	}

	newAccess, newRefresh, err := sessions.RevokeAllAndIssueNewSession(
		ctx,
		s.db,
		userID,
		userAgent,
		parsedIP,
		60*24*time.Hour,
		s.jwtSecret,
		time.Hour,
		[]byte(s.refreshPepper),
	)
	if err != nil {
		return dto.UserWithTokenResponse{}, "", err
	}

	return dto.UserWithTokenResponse{
		UserResponse: userToResponse(user),
		Token:        newAccess,
	}, newRefresh, nil
}

func (s *authService) RefreshToken(ctx context.Context, refreshTokenHex string) (dto.UserWithTokenResponse, string, error) {
	hash, err := auth.HashPresentedRefreshHex(refreshTokenHex, []byte(s.refreshPepper))
	if err != nil {
		return dto.UserWithTokenResponse{}, "", errors.New("malformed token")
	}

	user, err := s.db.GetUserFromRefreshTokenHash(ctx, hash)
	if err != nil {
		return dto.UserWithTokenResponse{}, "", errors.New("invalid or expired refresh token")
	}

	accessToken, err := auth.MakeJWT(
		user.ID,
		s.jwtSecret,
		time.Hour,
	)
	if err != nil {
		return dto.UserWithTokenResponse{}, "", err
	}

	// We purposely don't rotate the refresh token on every access token refresh
	// to avoid race conditions in the frontend (e.g. parallel requests invalidating each other).
	// Returning an empty string signals the handler to keep the existing cookie.

	return dto.UserWithTokenResponse{
		UserResponse: userToResponse(user),
		Token:        accessToken,
	}, "", nil
}

func (s *authService) RevokeToken(ctx context.Context, refreshTokenHex string) error {
	hash, err := auth.HashPresentedRefreshHex(refreshTokenHex, []byte(s.refreshPepper))
	if err != nil {
		return errors.New("malformed token")
	}

	err = s.db.RevokeRefreshTokenByHash(ctx, hash)
	if err != nil {
		return err
	}
	return nil
}

func (s *authService) GetUser(ctx context.Context, userID uuid.UUID) (dto.UserResponse, error) {
	user, err := s.db.GetUserByID(ctx, userID)
	if err != nil {
		return dto.UserResponse{}, err
	}
	return userToResponse(user), nil
}
