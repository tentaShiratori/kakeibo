package nyushukkin_query

import (
	"github.com/tentaShiratori/kakeibo/api/internal/domain/model/nyushukkin"
	"github.com/tentaShiratori/kakeibo/api/internal/usecase"
)

func ListByMonth(repo usecase.NyushukkinRepository, month string) ([]nyushukkin.Nyushukkin, error) {
	parsed, err := nyushukkin.ParseMonth(month)
	if err != nil {
		return nil, err
	}
	return nyushukkin.Sort(nyushukkin.InMonth(repo.All(), parsed)), nil
}
