package book_file

import (
	"encoding/json"
	"errors"
	"os"
	"sync"

	"github.com/tentaShiratori/kakeibo/api/internal/domain/model/nyushukkin"
	"github.com/tentaShiratori/kakeibo/api/internal/domain/model/waku"
)

type Book struct {
	Nyushukkin []nyushukkin.Nyushukkin `json:"nyushukkin"`
	Waku       []waku.Waku             `json:"waku"`
}

type File struct {
	mu   sync.Mutex
	path string
	book Book
}

func Open(path string) *File {
	return &File{path: path, book: loadBook(path)}
}

func (f *File) Nyushukkin() []nyushukkin.Nyushukkin {
	f.mu.Lock()
	defer f.mu.Unlock()
	return append([]nyushukkin.Nyushukkin{}, f.book.Nyushukkin...)
}

func (f *File) Waku() []waku.Waku {
	f.mu.Lock()
	defer f.mu.Unlock()
	return append([]waku.Waku{}, f.book.Waku...)
}

func (f *File) UpdateNyushukkin(fn func([]nyushukkin.Nyushukkin) ([]nyushukkin.Nyushukkin, error)) error {
	f.mu.Lock()
	defer f.mu.Unlock()
	next, err := fn(append([]nyushukkin.Nyushukkin{}, f.book.Nyushukkin...))
	if err != nil {
		return err
	}
	book := Book{Nyushukkin: next, Waku: append([]waku.Waku{}, f.book.Waku...)}
	if err := saveBook(f.path, book); err != nil {
		return err
	}
	f.book = book
	return nil
}

func (f *File) UpdateWaku(fn func([]waku.Waku) ([]waku.Waku, error)) error {
	f.mu.Lock()
	defer f.mu.Unlock()
	next, err := fn(append([]waku.Waku{}, f.book.Waku...))
	if err != nil {
		return err
	}
	book := Book{Nyushukkin: append([]nyushukkin.Nyushukkin{}, f.book.Nyushukkin...), Waku: next}
	if err := saveBook(f.path, book); err != nil {
		return err
	}
	f.book = book
	return nil
}

func loadBook(path string) Book {
	book, ok := readStoredFile(path)
	if ok {
		return book
	}
	book, ok = readStoredFile(path + ".bak")
	if ok {
		return book
	}
	return Book{}
}

func readStoredFile(path string) (Book, bool) {
	raw, err := os.ReadFile(path)
	if err != nil {
		return Book{}, false
	}
	return readStored(raw)
}

func readStored(raw []byte) (Book, bool) {
	var parsed any
	if err := json.Unmarshal(raw, &parsed); err != nil {
		return Book{}, false
	}
	if rows, ok := parsed.([]any); ok {
		return Book{Nyushukkin: parseNyushukkin(rows)}, true
	}
	rec, ok := parsed.(map[string]any)
	if !ok {
		return Book{}, false
	}
	if _, hasNyushukkin := rec["nyushukkin"]; !hasNyushukkin {
		if _, hasWaku := rec["waku"]; !hasWaku {
			return Book{}, false
		}
	}
	return Book{
		Nyushukkin: parseNyushukkin(asRows(rec["nyushukkin"])),
		Waku:       parseWaku(asRows(rec["waku"])),
	}, true
}

func asRows(v any) []any {
	rows, _ := v.([]any)
	if rows == nil {
		return []any{}
	}
	return rows
}

func parseNyushukkin(rows []any) []nyushukkin.Nyushukkin {
	items := make([]nyushukkin.Nyushukkin, 0, len(rows))
	for _, row := range rows {
		if item, ok := nyushukkin.FromStored(row); ok {
			items = append(items, item)
		}
	}
	return items
}

func parseWaku(rows []any) []waku.Waku {
	items := make([]waku.Waku, 0, len(rows))
	for _, row := range rows {
		if item, ok := waku.FromStored(row); ok {
			items = append(items, item)
		}
	}
	return items
}

func saveBook(path string, book Book) error {
	if book.Nyushukkin == nil {
		book.Nyushukkin = []nyushukkin.Nyushukkin{}
	}
	if book.Waku == nil {
		book.Waku = []waku.Waku{}
	}
	next, err := json.Marshal(book)
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
