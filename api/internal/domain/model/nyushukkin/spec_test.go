package nyushukkin

import (
	"encoding/json"
	"testing"
	"time"
)

const today = "2026-09-06"

func TestParseKind(t *testing.T) {
	t.Run("収入と支出を受け取る", func(t *testing.T) {
		got, err := parseKind("支出")
		if err != nil || got != "支出" {
			t.Fatalf("got %q %v", got, err)
		}
		got, err = parseKind("収入")
		if err != nil || got != "収入" {
			t.Fatalf("got %q %v", got, err)
		}
	})
	t.Run("それ以外は受け取らない", func(t *testing.T) {
		if _, err := parseKind("取引"); err == nil {
			t.Fatal("expected error")
		}
		if _, err := parseKind(""); err == nil {
			t.Fatal("expected error")
		}
	})
}

func TestParseDate(t *testing.T) {
	t.Run("今日以前の暦日を受け取る", func(t *testing.T) {
		got, err := parseDate("2026-09-06", today)
		if err != nil || got != "2026-09-06" {
			t.Fatalf("got %q %v", got, err)
		}
		got, err = parseDate("2026-09-05", today)
		if err != nil || got != "2026-09-05" {
			t.Fatalf("got %q %v", got, err)
		}
	})
	t.Run("未来と存在しない日は受け取らない", func(t *testing.T) {
		if _, err := parseDate("2026-09-07", today); err == nil {
			t.Fatal("expected future to fail")
		}
		if _, err := parseDate("2026-02-31", today); err == nil {
			t.Fatal("expected invalid day to fail")
		}
		if _, err := parseDate("09-06", today); err == nil {
			t.Fatal("expected short date to fail")
		}
		if _, err := parseDate("", today); err == nil {
			t.Fatal("expected empty to fail")
		}
	})
}

func TestParseAmount(t *testing.T) {
	t.Run("1円は受け取り0円は受け取らない", func(t *testing.T) {
		got, err := parseAmount("1")
		if err != nil || got != 1 {
			t.Fatalf("got %d %v", got, err)
		}
		if _, err := parseAmount("0"); err == nil {
			t.Fatal("expected 0 to fail")
		}
	})
	t.Run("安全な整数の上限は受け取り、それを超えたら受け取らない", func(t *testing.T) {
		got, err := parseAmount("9007199254740991")
		if err != nil || got != MaxSafe {
			t.Fatalf("got %d %v", got, err)
		}
		if _, err := parseAmount("9007199254740992"); err == nil {
			t.Fatal("expected overflow to fail")
		}
	})
	t.Run("負と小数と指数表記の金額は受け取らない", func(t *testing.T) {
		for _, raw := range []json.Number{"-1", "1.5", "1e2"} {
			if _, err := parseAmount(raw); err == nil {
				t.Fatalf("expected %s to fail", raw)
			}
		}
	})
}

func TestInMonthAndSort(t *testing.T) {
	items := []Nyushukkin{
		{ID: "a", Kind: "収入", Amount: 200000, Date: "2026-09-01", Memo: ""},
		{ID: "b", Kind: "支出", Amount: 5000, Date: "2026-09-06", Memo: ""},
		{ID: "c", Kind: "支出", Amount: 1200, Date: "2026-08-31", Memo: ""},
	}
	t.Run("指定した暦月の入出金だけ残す", func(t *testing.T) {
		got := InMonth(items, "2026-09")
		if len(got) != 2 || got[0].ID != "a" || got[1].ID != "b" {
			t.Fatalf("got %+v", got)
		}
	})
	t.Run("入出金が無い月は空", func(t *testing.T) {
		got := InMonth(items, "2026-07")
		if len(got) != 0 {
			t.Fatalf("got %+v", got)
		}
	})
	t.Run("入出日の新しい順にする", func(t *testing.T) {
		got := Sort(items[:2])
		if got[0].ID != "b" || got[1].ID != "a" {
			t.Fatalf("got %+v", got)
		}
	})
}

func TestHasWaku(t *testing.T) {
	items := []Nyushukkin{
		{ID: "a", WakuID: "w1"},
		{ID: "b"},
	}
	t.Run("付いている枠は使用中", func(t *testing.T) {
		if !HasWaku(items, "w1") {
			t.Fatal("expected in use")
		}
	})
	t.Run("付いていない枠と空は使用中ではない", func(t *testing.T) {
		if HasWaku(items, "w2") {
			t.Fatal("expected unused")
		}
		if HasWaku(items, "") {
			t.Fatal("empty id is not in use")
		}
	})
}

func TestTotalsOf(t *testing.T) {
	items := []Nyushukkin{
		{ID: "a", Kind: "収入", Amount: 200000, Date: "2026-09-01"},
		{ID: "b", Kind: "支出", Amount: 5000, Date: "2026-09-06"},
		{ID: "c", Kind: "支出", Amount: 1200, Date: "2026-08-31"},
	}
	t.Run("収入と支出と収支を足す", func(t *testing.T) {
		got := TotalsOf(items)
		want := Totals{Income: 200000, Expense: 6200, Balance: 193800}
		if got != want {
			t.Fatalf("got %+v want %+v", got, want)
		}
	})
	t.Run("空は0", func(t *testing.T) {
		got := TotalsOf(nil)
		if got != (Totals{}) {
			t.Fatalf("got %+v", got)
		}
	})
}

func TestFromStoredWakuID(t *testing.T) {
	t.Run("枠が無い保存も読める", func(t *testing.T) {
		got, ok := FromStored(map[string]any{
			"id": "a", "kind": "支出", "amount": float64(1), "date": "2026-09-06", "memo": "",
		})
		if !ok || got.WakuID != "" {
			t.Fatalf("got %+v %v", got, ok)
		}
	})
	t.Run("枠が一つ付いた保存を読める", func(t *testing.T) {
		got, ok := FromStored(map[string]any{
			"id": "a", "kind": "支出", "amount": float64(1), "date": "2026-09-06", "memo": "", "wakuId": "w1",
		})
		if !ok || got.WakuID != "w1" {
			t.Fatalf("got %+v %v", got, ok)
		}
	})
	t.Run("枠が文字列でなければ読まない", func(t *testing.T) {
		if _, ok := FromStored(map[string]any{
			"id": "a", "kind": "支出", "amount": float64(1), "date": "2026-09-06", "memo": "", "wakuId": []any{"w1", "w2"},
		}); ok {
			t.Fatal("expected skip")
		}
	})
}

func TestParseMonth(t *testing.T) {
	t.Run("暦月を受け取る", func(t *testing.T) {
		got, err := ParseMonth("2026-09")
		if err != nil || got != "2026-09" {
			t.Fatalf("got %q %v", got, err)
		}
	})
	t.Run("空と形式が違う暦月は受け取らない", func(t *testing.T) {
		if _, err := ParseMonth(""); err == nil {
			t.Fatal("expected empty to fail")
		}
		if _, err := ParseMonth("2026-13"); err == nil {
			t.Fatal("expected month 13 to fail")
		}
		if _, err := ParseMonth("2026-9"); err == nil {
			t.Fatal("expected short month to fail")
		}
	})
}

func TestTodayJST(t *testing.T) {
	if got := TodayJST(mustTime("2026-09-06T00:00:00+09:00")); got != "2026-09-06" {
		t.Fatalf("got %s", got)
	}
	if got := TodayJST(mustTime("2026-09-06T23:59:59+09:00")); got != "2026-09-06" {
		t.Fatalf("got %s", got)
	}
	if got := TodayJST(mustTime("2026-09-05T15:00:00Z")); got != "2026-09-06" {
		t.Fatalf("utc evening should be next jst day, got %s", got)
	}
}

func ptr(s string) *string {
	return &s
}

func mustTime(v string) time.Time {
	tm, err := time.Parse(time.RFC3339, v)
	if err != nil {
		panic(err)
	}
	return tm
}
