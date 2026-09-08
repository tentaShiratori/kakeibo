package furikaeri_query

import (
	"testing"

	"github.com/tentaShiratori/kakeibo/api/internal/domain/model/nyushukkin"
	"github.com/tentaShiratori/kakeibo/api/internal/domain/model/waku"
)

type stubNyushukkin struct {
	items []nyushukkin.Nyushukkin
}

func (s stubNyushukkin) All() []nyushukkin.Nyushukkin { return s.items }

type stubWaku struct {
	items []waku.Waku
}

func (s stubWaku) All() []waku.Waku { return s.items }

func TestByMonth(t *testing.T) {
	n := stubNyushukkin{items: []nyushukkin.Nyushukkin{
		{ID: "a", Kind: "収入", Amount: 200000, Date: "2026-09-01"},
		{ID: "b", Kind: "支出", Amount: 3000, Date: "2026-09-06", WakuID: "food"},
		{ID: "c", Kind: "支出", Amount: 2000, Date: "2026-09-06"},
		{ID: "d", Kind: "支出", Amount: 1200, Date: "2026-08-31", WakuID: "food"},
		{ID: "e", Kind: "支出", Amount: 500, Date: "2026-09-02", WakuID: "gone"},
	}}
	w := stubWaku{items: []waku.Waku{
		{ID: "rent", Name: "家賃"},
		{ID: "food", Name: "食費"},
	}}

	t.Run("月の収支と枠別と枠なしを返す", func(t *testing.T) {
		got, err := ByMonth(n, w, "2026-09")
		if err != nil {
			t.Fatal(err)
		}
		if got.Month != "2026-09" || got.Income != 200000 || got.Expense != 5500 || got.Balance != 194500 {
			t.Fatalf("month %+v", got)
		}
		if len(got.Waku) != 2 || got.Waku[0].Name != "家賃" || got.Waku[0].Expense != 0 || got.Waku[1].Name != "食費" || got.Waku[1].Expense != 3000 {
			t.Fatalf("waku %+v", got.Waku)
		}
		if got.None.Income != 200000 || got.None.Expense != 2500 {
			t.Fatalf("none %+v", got.None)
		}
		assertSumsToMonth(t, got)
	})
	t.Run("入出金が無い月は0で枠なしも出す", func(t *testing.T) {
		got, err := ByMonth(n, w, "2026-07")
		if err != nil {
			t.Fatal(err)
		}
		if got.Income != 0 || got.Expense != 0 || got.None != (nyushukkin.Totals{}) || len(got.Waku) != 2 {
			t.Fatalf("got %+v", got)
		}
		assertSumsToMonth(t, got)
	})
	t.Run("枠が無くても枠なしを出す", func(t *testing.T) {
		got, err := ByMonth(n, stubWaku{}, "2026-09")
		if err != nil || len(got.Waku) != 0 || got.None.Expense != 5500 {
			t.Fatalf("got %+v %v", got, err)
		}
		assertSumsToMonth(t, got)
	})
	t.Run("暦月が空なら受け取れない", func(t *testing.T) {
		if _, err := ByMonth(n, w, ""); err == nil {
			t.Fatal("expected error")
		}
	})
	t.Run("形式が違う暦月は受け取れない", func(t *testing.T) {
		if _, err := ByMonth(n, w, "2026-13"); err == nil {
			t.Fatal("expected error")
		}
	})
}

func assertSumsToMonth(t *testing.T, got Furikaeri) {
	t.Helper()
	var income, expense int64
	for _, row := range got.Waku {
		income += row.Income
		expense += row.Expense
	}
	income += got.None.Income
	expense += got.None.Expense
	if income != got.Income || expense != got.Expense {
		t.Fatalf("waku+none %d/%d != month %d/%d", income, expense, got.Income, got.Expense)
	}
}
