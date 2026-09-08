package waku_repository

import (
	"github.com/tentaShiratori/kakeibo/api/internal/domain/model/waku"
	"github.com/tentaShiratori/kakeibo/api/internal/infra/repository/book_file"
)

type Repository struct {
	file *book_file.File
}

func New(file *book_file.File) *Repository {
	return &Repository{file: file}
}

func (r *Repository) Record(item waku.Waku) error {
	return r.file.UpdateWaku(func(items []waku.Waku) ([]waku.Waku, error) {
		return append(items, item), nil
	})
}

func (r *Repository) Correct(item waku.Waku) error {
	return r.file.UpdateWaku(func(items []waku.Waku) ([]waku.Waku, error) {
		next := append([]waku.Waku{}, items...)
		found := false
		for i, current := range next {
			if current.ID == item.ID {
				next[i] = item
				found = true
				break
			}
		}
		if !found {
			return nil, waku.ErrNotFound
		}
		return next, nil
	})
}

func (r *Repository) Remove(id string) (waku.Waku, error) {
	var removed waku.Waku
	err := r.file.UpdateWaku(func(items []waku.Waku) ([]waku.Waku, error) {
		next, item, err := waku.Remove(items, id)
		if err != nil {
			return nil, err
		}
		removed = item
		return next, nil
	})
	return removed, err
}

func (r *Repository) All() []waku.Waku {
	return r.file.Waku()
}

func (r *Repository) InUse(id string) bool {
	_ = id
	return false
}
