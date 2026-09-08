package waku_repository

import (
	"path/filepath"
	"testing"

	"github.com/tentaShiratori/kakeibo/api/internal/domain/model/nyushukkin"
	"github.com/tentaShiratori/kakeibo/api/internal/domain/model/waku"
	"github.com/tentaShiratori/kakeibo/api/internal/infra/repository/book_file"
	"github.com/tentaShiratori/kakeibo/api/internal/infra/repository/nyushukkin_repository"
)

func TestInUse(t *testing.T) {
	file := book_file.Open(filepath.Join(t.TempDir(), "kakeibo.json"))
	wakuRepo := New(file)
	nyushukkinRepo := nyushukkin_repository.New(file)
	item := waku.Waku{ID: "w1", Name: "食費"}
	if err := wakuRepo.Record(item); err != nil {
		t.Fatal(err)
	}
	if wakuRepo.InUse("w1") {
		t.Fatal("unused should not be in use")
	}
	if err := nyushukkinRepo.Record(nyushukkin.Nyushukkin{
		ID: "n1", Kind: "支出", Amount: 1, Date: "2026-09-06", WakuID: "w1",
	}); err != nil {
		t.Fatal(err)
	}
	if !wakuRepo.InUse("w1") {
		t.Fatal("attached should be in use")
	}
	if _, err := wakuRepo.Remove("w1"); err == nil {
		t.Fatal("expected in use")
	} else if err.Error() != waku.InUse {
		t.Fatalf("got %v", err)
	}
}
