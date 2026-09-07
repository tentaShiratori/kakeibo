package remove_nyushukkin

import (
	"github.com/tentaShiratori/kakeibo/api/internal/domain/model/nyushukkin"
	"github.com/tentaShiratori/kakeibo/api/internal/usecase"
)

func RemoveNyushukkin(app usecase.App, id string) (nyushukkin.Nyushukkin, error) {
	return app.Nyushukkin.Remove(id)
}
