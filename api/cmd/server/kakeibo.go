package main

import (
	"encoding/json"
	"errors"
	"os"
	"sync"

	"github.com/tentaShiratori/kakeibo/api/internal/domain/model"
)

type Kakeibo struct {
	mu    sync.Mutex
	path  string
	items []model.Nyushukkin
}

func OpenKakeibo(path string) *Kakeibo {
	return &Kakeibo{path: path, items: loadBook(path)}
}

func (k *Kakeibo) Record(item model.Nyushukkin) error {
	k.mu.Lock()
	defer k.mu.Unlock()
	next := append(append([]model.Nyushukkin{}, k.items...), item)
	if err := saveBook(k.path, next); err != nil {
		return err
	}
	k.items = next
	return nil
}

func (k *Kakeibo) Correct(item model.Nyushukkin) error {
	k.mu.Lock()
	defer k.mu.Unlock()
	next := append([]model.Nyushukkin{}, k.items...)
	found := false
	for i, current := range next {
		if current.ID == item.ID {
			next[i] = item
			found = true
			break
		}
	}
	if !found {
		return model.ErrNotFound
	}
	if err := saveBook(k.path, next); err != nil {
		return err
	}
	k.items = next
	return nil
}

func (k *Kakeibo) Remove(id string) (model.Nyushukkin, error) {
	k.mu.Lock()
	defer k.mu.Unlock()
	next, removed, err := model.RemoveNyushukkin(k.items, id)
	if err != nil {
		return model.Nyushukkin{}, err
	}
	if err := saveBook(k.path, next); err != nil {
		return model.Nyushukkin{}, err
	}
	k.items = next
	return removed, nil
}

func (k *Kakeibo) List(month string) []model.Nyushukkin {
	k.mu.Lock()
	defer k.mu.Unlock()
	return model.SortNyushukkin(model.NyushukkinInMonth(k.items, month))
}

func loadBook(path string) []model.Nyushukkin {
	items, ok := readStoredFile(path)
	if ok {
		return items
	}
	items, ok = readStoredFile(path + ".bak")
	if ok {
		return items
	}
	return []model.Nyushukkin{}
}

func readStoredFile(path string) ([]model.Nyushukkin, bool) {
	raw, err := os.ReadFile(path)
	if err != nil {
		return nil, false
	}
	return readStored(raw)
}

func readStored(raw []byte) ([]model.Nyushukkin, bool) {
	var parsed any
	if err := json.Unmarshal(raw, &parsed); err != nil {
		return nil, false
	}
	rows, ok := parsed.([]any)
	if !ok {
		return nil, false
	}
	items := make([]model.Nyushukkin, 0, len(rows))
	for _, row := range rows {
		if item, ok := model.AsNyushukkin(row); ok {
			items = append(items, item)
		}
	}
	return items, true
}

func saveBook(path string, items []model.Nyushukkin) error {
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
