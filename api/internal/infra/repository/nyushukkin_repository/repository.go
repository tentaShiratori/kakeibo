package nyushukkin_repository

import (
	"encoding/json"
	"errors"
	"os"
	"sync"

	"github.com/tentaShiratori/kakeibo/api/internal/domain/model/nyushukkin"
)

type Repository struct {
	mu    sync.Mutex
	path  string
	items []nyushukkin.Nyushukkin
}

func New(path string) *Repository {
	return &Repository{path: path, items: loadBook(path)}
}

func (r *Repository) Record(item nyushukkin.Nyushukkin) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	next := append(append([]nyushukkin.Nyushukkin{}, r.items...), item)
	if err := saveBook(r.path, next); err != nil {
		return err
	}
	r.items = next
	return nil
}

func (r *Repository) Correct(item nyushukkin.Nyushukkin) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	next := append([]nyushukkin.Nyushukkin{}, r.items...)
	found := false
	for i, current := range next {
		if current.ID == item.ID {
			next[i] = item
			found = true
			break
		}
	}
	if !found {
		return nyushukkin.ErrNotFound
	}
	if err := saveBook(r.path, next); err != nil {
		return err
	}
	r.items = next
	return nil
}

func (r *Repository) Remove(id string) (nyushukkin.Nyushukkin, error) {
	r.mu.Lock()
	defer r.mu.Unlock()
	next, removed, err := nyushukkin.Remove(r.items, id)
	if err != nil {
		return nyushukkin.Nyushukkin{}, err
	}
	if err := saveBook(r.path, next); err != nil {
		return nyushukkin.Nyushukkin{}, err
	}
	r.items = next
	return removed, nil
}

func (r *Repository) All() []nyushukkin.Nyushukkin {
	r.mu.Lock()
	defer r.mu.Unlock()
	return append([]nyushukkin.Nyushukkin{}, r.items...)
}

func loadBook(path string) []nyushukkin.Nyushukkin {
	items, ok := readStoredFile(path)
	if ok {
		return items
	}
	items, ok = readStoredFile(path + ".bak")
	if ok {
		return items
	}
	return []nyushukkin.Nyushukkin{}
}

func readStoredFile(path string) ([]nyushukkin.Nyushukkin, bool) {
	raw, err := os.ReadFile(path)
	if err != nil {
		return nil, false
	}
	return readStored(raw)
}

func readStored(raw []byte) ([]nyushukkin.Nyushukkin, bool) {
	var parsed any
	if err := json.Unmarshal(raw, &parsed); err != nil {
		return nil, false
	}
	rows, ok := parsed.([]any)
	if !ok {
		return nil, false
	}
	items := make([]nyushukkin.Nyushukkin, 0, len(rows))
	for _, row := range rows {
		if item, ok := nyushukkin.FromStored(row); ok {
			items = append(items, item)
		}
	}
	return items, true
}

func saveBook(path string, items []nyushukkin.Nyushukkin) error {
	next, err := json.Marshal(items)
	if err != nil {
		return err
	}
	current, err := os.ReadFile(path)
	if err == nil {
		if _, ok := readStored(current); ok {
			if err := os.WriteFile(path+".bak", current, 0o600); err != nil {
				return err
			}
		}
	} else if !errors.Is(err, os.ErrNotExist) {
		return err
	}
	tmp := path + ".tmp"
	if err := os.WriteFile(tmp, next, 0o600); err != nil {
		return err
	}
	if err := os.Rename(tmp, path); err != nil {
		return err
	}
	if _, err := os.Stat(path + ".bak"); errors.Is(err, os.ErrNotExist) {
		if err := os.WriteFile(path+".bak", next, 0o600); err != nil {
			return err
		}
	}
	return nil
}
