package dto

type CreateRoomRequest struct {
	Duration int      `json:"duration" validate:"required,min=30,max=600"`
	Groups   []string `json:"groups" validate:"required,min=1"`
}
