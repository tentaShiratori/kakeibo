package main

import (
	"encoding/json"
	"errors"
	"os"
	"sync"
)

type Kakeibo struct {
	mu    sync.Mutex
	path  string
	items []Nyushukkin
}

func OpenKakeibo(path string) *Kakeibo {
	return &Kakeibo{path: path, items: loadBook(path)}
}

func (k *Kakeibo) Record(item Nyushukkin) error {
	k.mu.Lock()
	defer k.mu.Unlock()
	next := append(append([]Nyushukkin{}, k.items...), item)
	if err := saveBook(k.path, next); err != nil {
		return err
	}
	k.items = next
	return nil
}

func (k *Kakeibo) Correct(item Nyushukkin) error {
	k.mu.Lock()
	defer k.mu.Unlock()
	next := append([]Nyushukkin{}, k.items...)
	found := false
	for i, current := range next {
		if current.ID == item.ID {
			next[i] = item
			found = true
			break
		}
	}
	if !found {
		return errNotFound
	}
	if err := saveBook(k.path, next); err != nil {
		return err
	}
	k.items = next
	return nil
}

func (k *Kakeibo) Remove(id string) (Nyushukkin, error) {
	k.mu.Lock()
	defer k.mu.Unlock()
	next, removed, err := removeNyushukkin(k.items, id)
	if err != nil {
		return Nyushukkin{}, err
	}
	if err := saveBook(k.path, next); err != nil {
		return Nyushukkin{}, err
	}
	k.items = next
	return removed, nil
}

func (k *Kakeibo) List(month string) []Nyushukkin {
	k.mu.Lock()
	defer k.mu.Unlock()
	return sortNyushukkin(nyushukkinInMonth(k.items, month))
}

func loadBook(path string) []Nyushukkin {
	items, ok := readStoredFile(path)
	if ok {
		return items
	}
	items, ok = readStoredFile(path + ".bak")
	if ok {
		return items
	}
	return []Nyushukkin{}
}

func readStoredFile(path string) ([]Nyushukkin, bool) {
	raw, err := os.ReadFile(path)
	if err != nil {
		return nil, false
	}
	return readStored(raw)
}

func readStored(raw []byte) ([]Nyushukkin, bool) {
	var parsed any
	if err := json.Unmarshal(raw, &parsed); err != nil {
		return nil, false
	}
	rows, ok := parsed.([]any)
	if !ok {
		return nil, false
	}
	items := make([]Nyushukkin, 0, len(rows))
	for _, row := range rows {
		if item, ok := asNyushukkin(row); ok {
			items = append(items, item)
		}
	}
	return items, true
}

func saveBook(path string, items []Nyushukkin) error {
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
