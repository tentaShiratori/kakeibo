package usecase

import (
	"time"

	"github.com/tentaShiratori/kakeibo/api/internal/domain/model/nyushukkin"
)

type NyushukkinRepository interface {
	Record(item nyushukkin.Nyushukkin) error
	Correct(item nyushukkin.Nyushukkin) error
	Remove(id string) (nyushukkin.Nyushukkin, error)
}

type App struct {
	Nyushukkin NyushukkinRepository
	Now        func() time.Time
	NewID      func() string
}

func New(repo NyushukkinRepository, now func() time.Time, newID func() string) App {
	return App{Nyushukkin: repo, Now: now, NewID: newID}
}
