package remove_waku

import (
	"github.com/tentaShiratori/kakeibo/api/internal/domain/model/waku"
	"github.com/tentaShiratori/kakeibo/api/internal/usecase"
)

func RemoveWaku(app usecase.App, id string) (waku.Waku, error) {
	if _, err := waku.Find(app.Waku.All(), id); err != nil {
		return waku.Waku{}, err
	}
	if app.Waku.InUse(id) {
		return waku.Waku{}, waku.ErrInUse
	}
	return app.Waku.Remove(id)
}
