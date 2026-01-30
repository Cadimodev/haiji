package handlers

import (
	"context"

	"github.com/Cadimodev/haiji/backend/internal/database"
	"github.com/Cadimodev/haiji/backend/internal/dto"
	"github.com/google/uuid"
)

// MockQuerier implements database.Querier for testing
type MockQuerier struct {
	database.Querier // Embed to satisfy interface for methods not explicitly mocked
	users            map[string]database.User
	refreshTokens    map[string]database.RefreshToken
}

// Ensure MockQuerier Satisfies the interface (will panic on unimplemented methods if called, which is expected for mocks)
var _ database.Querier = (*MockQuerier)(nil)

// MockAuthService implements service.AuthService for testing purposes
type MockAuthService struct {
	RegisterFunc     func(ctx context.Context, params dto.CreateUserRequest, userAgent string, ip string) (dto.UserWithTokenResponse, string, error)
	LoginFunc        func(ctx context.Context, params dto.LoginRequest, userAgent string, ip string) (dto.UserWithTokenResponse, string, error)
	UpdateUserFunc   func(ctx context.Context, userID uuid.UUID, params dto.UpdateUserRequest, userAgent string, ip string) (dto.UserWithTokenResponse, string, error)
	RefreshTokenFunc func(ctx context.Context, refreshTokenHex string) (dto.UserWithTokenResponse, string, error)
	RevokeTokenFunc  func(ctx context.Context, refreshTokenHex string) error
	GetUserFunc      func(ctx context.Context, userID uuid.UUID) (dto.UserResponse, error)
}

func (m *MockAuthService) Register(ctx context.Context, params dto.CreateUserRequest, userAgent string, ip string) (dto.UserWithTokenResponse, string, error) {
	if m.RegisterFunc != nil {
		return m.RegisterFunc(ctx, params, userAgent, ip)
	}
	return dto.UserWithTokenResponse{}, "", nil
}

func (m *MockAuthService) Login(ctx context.Context, params dto.LoginRequest, userAgent string, ip string) (dto.UserWithTokenResponse, string, error) {
	if m.LoginFunc != nil {
		return m.LoginFunc(ctx, params, userAgent, ip)
	}
	return dto.UserWithTokenResponse{}, "", nil
}

func (m *MockAuthService) UpdateUser(ctx context.Context, userID uuid.UUID, params dto.UpdateUserRequest, userAgent string, ip string) (dto.UserWithTokenResponse, string, error) {
	if m.UpdateUserFunc != nil {
		return m.UpdateUserFunc(ctx, userID, params, userAgent, ip)
	}
	return dto.UserWithTokenResponse{}, "", nil
}

func (m *MockAuthService) RefreshToken(ctx context.Context, refreshTokenHex string) (dto.UserWithTokenResponse, string, error) {
	if m.RefreshTokenFunc != nil {
		return m.RefreshTokenFunc(ctx, refreshTokenHex)
	}
	return dto.UserWithTokenResponse{}, "", nil
}

func (m *MockAuthService) RevokeToken(ctx context.Context, refreshTokenHex string) error {
	if m.RevokeTokenFunc != nil {
		return m.RevokeTokenFunc(ctx, refreshTokenHex)
	}
	return nil
}

func (m *MockAuthService) GetUser(ctx context.Context, userID uuid.UUID) (dto.UserResponse, error) {
	if m.GetUserFunc != nil {
		return m.GetUserFunc(ctx, userID)
	}
	return dto.UserResponse{}, nil
}
