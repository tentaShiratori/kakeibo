package remove_waku

import (
	"testing"
	"time"

	"github.com/tentaShiratori/kakeibo/api/internal/domain/model/waku"
	"github.com/tentaShiratori/kakeibo/api/internal/usecase"
)

type stubWaku struct {
	items []waku.Waku
	inUse bool
}

func (s *stubWaku) Record(item waku.Waku) error  { s.items = append(s.items, item); return nil }
func (s *stubWaku) Correct(item waku.Waku) error { return nil }
func (s *stubWaku) Remove(id string) (waku.Waku, error) {
	next, removed, err := waku.Remove(s.items, id)
	if err != nil {
		return waku.Waku{}, err
	}
	s.items = next
	return removed, nil
}
func (s *stubWaku) All() []waku.Waku { return s.items }
func (s *stubWaku) InUse(id string) bool {
	_ = id
	return s.inUse
}

func TestRemoveWaku(t *testing.T) {
	item := waku.Waku{ID: "a", Name: "食費"}
	repo := &stubWaku{items: []waku.Waku{item}}
	app := usecase.App{Waku: repo, Now: time.Now, NewID: func() string { return "x" }}
	got, err := RemoveWaku(app, "a")
	if err != nil || got != item || len(repo.items) != 0 {
		t.Fatalf("got %+v %v items %+v", got, err, repo.items)
	}
}

func TestRemoveWakuInUse(t *testing.T) {
	item := waku.Waku{ID: "a", Name: "食費"}
	repo := &stubWaku{items: []waku.Waku{item}, inUse: true}
	app := usecase.App{Waku: repo, Now: time.Now, NewID: func() string { return "x" }}
	if _, err := RemoveWaku(app, "a"); err == nil {
		t.Fatal("expected in use")
	} else if err.Error() != waku.InUse {
		t.Fatalf("got %v", err)
	}
	if len(repo.items) != 1 {
		t.Fatalf("should keep %+v", repo.items)
	}
}

func TestRemoveWakuMissing(t *testing.T) {
	repo := &stubWaku{}
	app := usecase.App{Waku: repo, Now: time.Now, NewID: func() string { return "x" }}
	if _, err := RemoveWaku(app, "a"); err == nil {
		t.Fatal("expected missing")
	}
}
