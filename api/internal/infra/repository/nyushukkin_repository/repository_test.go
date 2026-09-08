package nyushukkin_repository

import (
	"os"
	"path/filepath"
	"testing"

	"github.com/tentaShiratori/kakeibo/api/internal/domain/model/nyushukkin"
	"github.com/tentaShiratori/kakeibo/api/internal/infra/repository/book_file"
)

func TestPersistAndReload(t *testing.T) {
	path := filepath.Join(t.TempDir(), "kakeibo.json")
	repo := New(book_file.Open(path))
	item := nyushukkin.Nyushukkin{ID: "a", Kind: "支出", Amount: 5000, Date: "2026-09-06", Memo: "米"}
	if err := repo.Record(item); err != nil {
		t.Fatal(err)
	}

	reloaded := New(book_file.Open(path))
	got := nyushukkin.InMonth(reloaded.All(), "2026-09")
	if len(got) != 1 || got[0] != item {
		t.Fatalf("got %+v", got)
	}
}

func TestPersistWakuID(t *testing.T) {
	path := filepath.Join(t.TempDir(), "kakeibo.json")
	file := book_file.Open(path)
	repo := New(file)
	item := nyushukkin.Nyushukkin{ID: "a", Kind: "支出", Amount: 1, Date: "2026-09-06", Memo: "", WakuID: "w1"}
	if err := repo.Record(item); err != nil {
		t.Fatal(err)
	}
	reloaded := New(book_file.Open(path))
	got := reloaded.All()
	if len(got) != 1 || got[0].WakuID != "w1" {
		t.Fatalf("got %+v", got)
	}
}

func TestMissingFileIsEmpty(t *testing.T) {
	repo := New(book_file.Open(filepath.Join(t.TempDir(), "missing.json")))
	if got := repo.All(); len(got) != 0 {
		t.Fatalf("got %+v", got)
	}
}

func TestBrokenFileUsesBackup(t *testing.T) {
	dir := t.TempDir()
	path := filepath.Join(dir, "kakeibo.json")
	item := nyushukkin.Nyushukkin{ID: "a", Kind: "支出", Amount: 1, Date: "2026-09-06", Memo: ""}
	if err := os.WriteFile(path+".bak", []byte(`[{"id":"a","kind":"支出","amount":1,"date":"2026-09-06","memo":""}]`), 0o600); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(path, []byte("nope"), 0o600); err != nil {
		t.Fatal(err)
	}
	repo := New(book_file.Open(path))
	got := nyushukkin.InMonth(repo.All(), "2026-09")
	if len(got) != 1 || got[0] != item {
		t.Fatalf("got %+v", got)
	}
}

func TestEmptyArrayIsEmptyBook(t *testing.T) {
	path := filepath.Join(t.TempDir(), "kakeibo.json")
	if err := os.WriteFile(path, []byte("[]"), 0o600); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(path+".bak", []byte(`[{"id":"a","kind":"支出","amount":1,"date":"2026-09-06","memo":""}]`), 0o600); err != nil {
		t.Fatal(err)
	}
	repo := New(book_file.Open(path))
	if got := repo.All(); len(got) != 0 {
		t.Fatalf("empty book should not fall back, got %+v", got)
	}
}

func TestSkipsInvalidRows(t *testing.T) {
	path := filepath.Join(t.TempDir(), "kakeibo.json")
	raw := `[{"id":"a","kind":"支出","amount":1,"date":"2026-09-06","memo":""},{"id":"b","kind":"取引","amount":1,"date":"2026-09-06","memo":""}]`
	if err := os.WriteFile(path, []byte(raw), 0o600); err != nil {
		t.Fatal(err)
	}
	repo := New(book_file.Open(path))
	got := nyushukkin.InMonth(repo.All(), "2026-09")
	if len(got) != 1 || got[0].ID != "a" {
		t.Fatalf("got %+v", got)
	}
}

func TestCorrectAndRemove(t *testing.T) {
	path := filepath.Join(t.TempDir(), "kakeibo.json")
	repo := New(book_file.Open(path))
	a := nyushukkin.Nyushukkin{ID: "a", Kind: "支出", Amount: 5000, Date: "2026-09-06", Memo: ""}
	b := nyushukkin.Nyushukkin{ID: "b", Kind: "収入", Amount: 2000, Date: "2026-09-01", Memo: ""}
	if err := repo.Record(a); err != nil {
		t.Fatal(err)
	}
	if err := repo.Record(b); err != nil {
		t.Fatal(err)
	}
	a.Amount = 3000
	if err := repo.Correct(a); err != nil {
		t.Fatal(err)
	}
	if _, err := repo.Remove("b"); err != nil {
		t.Fatal(err)
	}
	if _, err := repo.Remove("z"); err == nil {
		t.Fatal("expected missing remove to fail")
	}
	if err := repo.Correct(nyushukkin.Nyushukkin{ID: "z", Kind: "支出", Amount: 1, Date: "2026-09-06"}); err == nil {
		t.Fatal("expected missing correct to fail")
	}

	reloaded := New(book_file.Open(path))
	got := nyushukkin.InMonth(reloaded.All(), "2026-09")
	if len(got) != 1 || got[0].ID != "a" || got[0].Amount != 3000 {
		t.Fatalf("got %+v", got)
	}
}

func TestBothBrokenIsEmpty(t *testing.T) {
	path := filepath.Join(t.TempDir(), "kakeibo.json")
	if err := os.WriteFile(path, []byte("{}"), 0o600); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(path+".bak", []byte("nope"), 0o600); err != nil {
		t.Fatal(err)
	}
	repo := New(book_file.Open(path))
	if got := repo.All(); len(got) != 0 {
		t.Fatalf("got %+v", got)
	}
}
