package waku_query

import (
	"testing"

	"github.com/tentaShiratori/kakeibo/api/internal/domain/model/waku"
)

type stubRepo struct {
	items []waku.Waku
}

func (s stubRepo) All() []waku.Waku { return s.items }

func TestList(t *testing.T) {
	got := List(stubRepo{items: []waku.Waku{
		{ID: "b", Name: "家賃"},
		{ID: "a", Name: "食費"},
	}})
	if len(got) != 2 || got[0].Name != "家賃" || got[1].Name != "食費" {
		t.Fatalf("got %+v", got)
	}
	if empty := List(stubRepo{}); len(empty) != 0 {
		t.Fatalf("empty %+v", empty)
	}
}
