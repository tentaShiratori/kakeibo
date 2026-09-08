package rename_waku

import (
	"github.com/tentaShiratori/kakeibo/api/internal/domain/model/waku"
	"github.com/tentaShiratori/kakeibo/api/internal/usecase"
)

func RenameWaku(app usecase.App, id string, input waku.Input) (waku.Waku, error) {
	current, err := waku.Find(app.Waku.All(), id)
	if err != nil {
		return waku.Waku{}, err
	}
	item, err := waku.Rename(current, input, app.Waku.All())
	if err != nil {
		return waku.Waku{}, err
	}
	if err := app.Waku.Correct(item); err != nil {
		return waku.Waku{}, err
	}
	return item, nil
}
