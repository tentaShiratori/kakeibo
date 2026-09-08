package create_waku

import (
	"github.com/tentaShiratori/kakeibo/api/internal/domain/model/waku"
	"github.com/tentaShiratori/kakeibo/api/internal/usecase"
)

func CreateWaku(app usecase.App, input waku.Input) (waku.Waku, error) {
	item, err := waku.Create(input, app.NewID(), app.Waku.All())
	if err != nil {
		return waku.Waku{}, err
	}
	if err := app.Waku.Record(item); err != nil {
		return waku.Waku{}, err
	}
	return item, nil
}
