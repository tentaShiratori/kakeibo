package nyushukkin_repository

import (
	"github.com/tentaShiratori/kakeibo/api/internal/domain/model/nyushukkin"
	"github.com/tentaShiratori/kakeibo/api/internal/infra/repository/book_file"
)

type Repository struct {
	file *book_file.File
}

func New(file *book_file.File) *Repository {
	return &Repository{file: file}
}

func (r *Repository) Record(item nyushukkin.Nyushukkin) error {
	return r.file.UpdateNyushukkin(func(book book_file.Book) ([]nyushukkin.Nyushukkin, error) {
		return append(book.Nyushukkin, item), nil
	})
}

func (r *Repository) Correct(item nyushukkin.Nyushukkin) error {
	return r.file.UpdateNyushukkin(func(book book_file.Book) ([]nyushukkin.Nyushukkin, error) {
		next := append([]nyushukkin.Nyushukkin{}, book.Nyushukkin...)
		found := false
		for i, current := range next {
			if current.ID == item.ID {
				next[i] = item
				found = true
				break
			}
		}
		if !found {
			return nil, nyushukkin.ErrNotFound
		}
		return next, nil
	})
}

func (r *Repository) Remove(id string) (nyushukkin.Nyushukkin, error) {
	var removed nyushukkin.Nyushukkin
	err := r.file.UpdateNyushukkin(func(book book_file.Book) ([]nyushukkin.Nyushukkin, error) {
		next, item, err := nyushukkin.Remove(book.Nyushukkin, id)
		if err != nil {
			return nil, err
		}
		removed = item
		return next, nil
	})
	return removed, err
}

func (r *Repository) All() []nyushukkin.Nyushukkin {
	return r.file.Nyushukkin()
}
