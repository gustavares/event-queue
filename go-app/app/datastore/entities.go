package datastore

// "github.com/google/uuid"

type UserEntity struct {
	ID string `json:"id"`
	// ID       uuid.UUID `json:"id"`
	Username string `json:"Username"`
	Email    string `json:"email"`
	Phone    string `json:"phone"`
	Deleted  bool   `json:"deleted"`
}

// func (s *SocialEntity) ParseUuid(socialID sql.NullString) (*uuid.UUID, error) {
// 	if socialID.Valid {
// 		uuid, err := uuid.Parse(socialID.String)
// 		if err != nil {
// 			log.Printf("Error parsing social ID: %v", err)
// 			return nil, ErrUuidParseFailure
// 		}

// 		return &uuid, nil
// 	}

// 	return nil, ErrInvalidNullString
// }
