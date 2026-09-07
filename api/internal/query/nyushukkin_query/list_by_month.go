package nyushukkin_query

import (
	"github.com/tentaShiratori/kakeibo/api/internal/domain/model/nyushukkin"
)

type Repository interface {
	All() []nyushukkin.Nyushukkin
}

func ListByMonth(repo Repository, month string) ([]nyushukkin.Nyushukkin, error) {
	parsed, err := nyushukkin.ParseMonth(month)
	if err != nil {
		return nil, err
	}
	return nyushukkin.Sort(nyushukkin.InMonth(repo.All(), parsed)), nil
}
