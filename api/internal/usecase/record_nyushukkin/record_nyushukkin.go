package record_nyushukkin

import (
	"github.com/tentaShiratori/kakeibo/api/internal/domain/model/nyushukkin"
	"github.com/tentaShiratori/kakeibo/api/internal/domain/model/waku"
	"github.com/tentaShiratori/kakeibo/api/internal/usecase"
)

func RecordNyushukkin(app usecase.App, input nyushukkin.Input) (nyushukkin.Nyushukkin, error) {
	item, err := nyushukkin.Record(input, nyushukkin.TodayJST(app.Now()), app.NewID())
	if err != nil {
		return nyushukkin.Nyushukkin{}, err
	}
	if err := ensureWaku(app, item.WakuID); err != nil {
		return nyushukkin.Nyushukkin{}, err
	}
	if err := app.Nyushukkin.Record(item); err != nil {
		return nyushukkin.Nyushukkin{}, err
	}
	return item, nil
}

func ensureWaku(app usecase.App, id string) error {
	if id == "" {
		return nil
	}
	_, err := waku.Find(app.Waku.All(), id)
	return err
}
