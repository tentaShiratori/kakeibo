package correct_nyushukkin

import (
	"github.com/tentaShiratori/kakeibo/api/internal/domain/model/nyushukkin"
	"github.com/tentaShiratori/kakeibo/api/internal/usecase"
)

func CorrectNyushukkin(app usecase.App, id string, input nyushukkin.Input) (nyushukkin.Nyushukkin, error) {
	item, err := nyushukkin.Correct(nyushukkin.Nyushukkin{ID: id}, input, nyushukkin.TodayJST(app.Now()))
	if err != nil {
		return nyushukkin.Nyushukkin{}, err
	}
	if err := app.Nyushukkin.Correct(item); err != nil {
		return nyushukkin.Nyushukkin{}, err
	}
	return item, nil
}
