package main

import (
	"os"
	"path/filepath"
	"testing"

	"github.com/tentaShiratori/kakeibo/api/internal/domain/model"
)

func TestKakeiboPersistAndReload(t *testing.T) {
	path := filepath.Join(t.TempDir(), "kakeibo.json")
	book := OpenKakeibo(path)
	item := model.Nyushukkin{ID: "a", Kind: "支出", Amount: 5000, Date: "2026-09-06", Memo: "米"}
	if err := book.Record(item); err != nil {
		t.Fatal(err)
	}

	reloaded := OpenKakeibo(path)
	got := reloaded.List("2026-09")
	if len(got) != 1 || got[0] != item {
		t.Fatalf("got %+v", got)
	}
}

func TestKakeiboMissingFileIsEmpty(t *testing.T) {
	book := OpenKakeibo(filepath.Join(t.TempDir(), "missing.json"))
	if got := book.List("2026-09"); len(got) != 0 {
		t.Fatalf("got %+v", got)
	}
}

func TestKakeiboBrokenFileUsesBackup(t *testing.T) {
	dir := t.TempDir()
	path := filepath.Join(dir, "kakeibo.json")
	item := model.Nyushukkin{ID: "a", Kind: "支出", Amount: 1, Date: "2026-09-06", Memo: ""}
	if err := os.WriteFile(path+".bak", []byte(`[{"id":"a","kind":"支出","amount":1,"date":"2026-09-06","memo":""}]`), 0o600); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(path, []byte("nope"), 0o600); err != nil {
		t.Fatal(err)
	}
	book := OpenKakeibo(path)
	got := book.List("2026-09")
	if len(got) != 1 || got[0] != item {
		t.Fatalf("got %+v", got)
	}
}

func TestKakeiboEmptyArrayIsEmptyBook(t *testing.T) {
	path := filepath.Join(t.TempDir(), "kakeibo.json")
	if err := os.WriteFile(path, []byte("[]"), 0o600); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(path+".bak", []byte(`[{"id":"a","kind":"支出","amount":1,"date":"2026-09-06","memo":""}]`), 0o600); err != nil {
		t.Fatal(err)
	}
	book := OpenKakeibo(path)
	if got := book.List("2026-09"); len(got) != 0 {
		t.Fatalf("empty book should not fall back, got %+v", got)
	}
}

func TestKakeiboSkipsInvalidRows(t *testing.T) {
	path := filepath.Join(t.TempDir(), "kakeibo.json")
	raw := `[{"id":"a","kind":"支出","amount":1,"date":"2026-09-06","memo":""},{"id":"b","kind":"取引","amount":1,"date":"2026-09-06","memo":""}]`
	if err := os.WriteFile(path, []byte(raw), 0o600); err != nil {
		t.Fatal(err)
	}
	book := OpenKakeibo(path)
	got := book.List("2026-09")
	if len(got) != 1 || got[0].ID != "a" {
		t.Fatalf("got %+v", got)
	}
}

func TestKakeiboCorrectAndRemove(t *testing.T) {
	path := filepath.Join(t.TempDir(), "kakeibo.json")
	book := OpenKakeibo(path)
	a := model.Nyushukkin{ID: "a", Kind: "支出", Amount: 5000, Date: "2026-09-06", Memo: ""}
	b := model.Nyushukkin{ID: "b", Kind: "収入", Amount: 2000, Date: "2026-09-01", Memo: ""}
	if err := book.Record(a); err != nil {
		t.Fatal(err)
	}
	if err := book.Record(b); err != nil {
		t.Fatal(err)
	}
	a.Amount = 3000
	if err := book.Correct(a); err != nil {
		t.Fatal(err)
	}
	if _, err := book.Remove("b"); err != nil {
		t.Fatal(err)
	}
	if _, err := book.Remove("z"); err == nil {
		t.Fatal("expected missing remove to fail")
	}
	if err := book.Correct(model.Nyushukkin{ID: "z", Kind: "支出", Amount: 1, Date: "2026-09-06"}); err == nil {
		t.Fatal("expected missing correct to fail")
	}

	reloaded := OpenKakeibo(path)
	got := reloaded.List("2026-09")
	if len(got) != 1 || got[0].ID != "a" || got[0].Amount != 3000 {
		t.Fatalf("got %+v", got)
	}
}

func TestKakeiboBothBrokenIsEmpty(t *testing.T) {
	path := filepath.Join(t.TempDir(), "kakeibo.json")
	if err := os.WriteFile(path, []byte("{}"), 0o600); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(path+".bak", []byte("nope"), 0o600); err != nil {
		t.Fatal(err)
	}
	book := OpenKakeibo(path)
	if got := book.List("2026-09"); len(got) != 0 {
		t.Fatalf("got %+v", got)
	}
}
