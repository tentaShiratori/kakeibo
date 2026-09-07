package nyushukkin_query

import (
	"testing"

	"github.com/tentaShiratori/kakeibo/api/internal/domain/model/nyushukkin"
)

type stubRepo struct {
	items []nyushukkin.Nyushukkin
}

func (s stubRepo) All() []nyushukkin.Nyushukkin { return s.items }

func TestListByMonth(t *testing.T) {
	repo := stubRepo{items: []nyushukkin.Nyushukkin{
		{ID: "a", Kind: "収入", Amount: 200000, Date: "2026-09-01", Memo: ""},
		{ID: "b", Kind: "支出", Amount: 5000, Date: "2026-09-06", Memo: ""},
		{ID: "c", Kind: "支出", Amount: 1200, Date: "2026-08-31", Memo: ""},
	}}

	t.Run("指定した暦月の入出金だけ残す", func(t *testing.T) {
		got, err := ListByMonth(repo, "2026-09")
		if err != nil || len(got) != 2 || got[0].ID != "b" || got[1].ID != "a" {
			t.Fatalf("got %+v %v", got, err)
		}
	})
	t.Run("入出金が無い月は空", func(t *testing.T) {
		got, err := ListByMonth(repo, "2026-07")
		if err != nil || len(got) != 0 {
			t.Fatalf("got %+v %v", got, err)
		}
	})
	t.Run("暦月が空なら受け取れない", func(t *testing.T) {
		if _, err := ListByMonth(repo, ""); err == nil {
			t.Fatal("expected error")
		}
	})
	t.Run("形式が違う暦月は受け取れない", func(t *testing.T) {
		if _, err := ListByMonth(repo, "2026-13"); err == nil {
			t.Fatal("expected error")
		}
	})
}
