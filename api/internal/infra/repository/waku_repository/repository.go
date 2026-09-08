package waku_repository

import (
	"github.com/tentaShiratori/kakeibo/api/internal/domain/model/nyushukkin"
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
	return r.file.UpdateWaku(func(book book_file.Book) ([]waku.Waku, error) {
		return append(book.Waku, item), nil
	})
}

func (r *Repository) Correct(item waku.Waku) error {
	return r.file.UpdateWaku(func(book book_file.Book) ([]waku.Waku, error) {
		next := append([]waku.Waku{}, book.Waku...)
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
	err := r.file.UpdateWaku(func(book book_file.Book) ([]waku.Waku, error) {
		if nyushukkin.HasWaku(book.Nyushukkin, id) {
			return nil, waku.ErrInUse
		}
		next, item, err := waku.Remove(book.Waku, id)
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
	return nyushukkin.HasWaku(r.file.Nyushukkin(), id)
}
