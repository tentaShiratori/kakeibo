package usecase

import (
	"time"

	"github.com/tentaShiratori/kakeibo/api/internal/domain/model/nyushukkin"
	"github.com/tentaShiratori/kakeibo/api/internal/domain/model/waku"
)

type NyushukkinRepository interface {
	Record(item nyushukkin.Nyushukkin) error
	Correct(item nyushukkin.Nyushukkin) error
	Remove(id string) (nyushukkin.Nyushukkin, error)
}

type WakuRepository interface {
	Record(item waku.Waku) error
	Correct(item waku.Waku) error
	Remove(id string) (waku.Waku, error)
	All() []waku.Waku
	InUse(id string) bool
}

type App struct {
	Nyushukkin NyushukkinRepository
	Waku       WakuRepository
	Now        func() time.Time
	NewID      func() string
}

func New(nyushukkin NyushukkinRepository, waku WakuRepository, now func() time.Time, newID func() string) App {
	return App{Nyushukkin: nyushukkin, Waku: waku, Now: now, NewID: newID}
}
