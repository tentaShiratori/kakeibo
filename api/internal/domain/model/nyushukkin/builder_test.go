package nyushukkin

import "testing"

func TestRecord(t *testing.T) {
	t.Run("金額と入出日があれば支出を残せる", func(t *testing.T) {
		got, err := Record(Input{
			Kind: "支出", Amount: "5000", Date: "2026-09-06", Memo: ptr(""),
		}, today, "a")
		if err != nil {
			t.Fatal(err)
		}
		want := Nyushukkin{ID: "a", Kind: "支出", Amount: 5000, Date: "2026-09-06", Memo: ""}
		if got != want {
			t.Fatalf("got %+v want %+v", got, want)
		}
	})
	t.Run("収入も残せる", func(t *testing.T) {
		got, err := Record(Input{
			Kind: "収入", Amount: "200000", Date: "2026-09-01", Memo: ptr("給料"),
		}, today, "b")
		if err != nil {
			t.Fatal(err)
		}
		want := Nyushukkin{ID: "b", Kind: "収入", Amount: 200000, Date: "2026-09-01", Memo: "給料"}
		if got != want {
			t.Fatalf("got %+v want %+v", got, want)
		}
	})
	t.Run("必須が欠けたら残せない", func(t *testing.T) {
		if _, err := Record(Input{
			Kind: "支出", Amount: "", Date: today, Memo: ptr(""),
		}, today, "c"); err == nil {
			t.Fatal("expected error")
		}
	})
	t.Run("空白だけのメモは空にする", func(t *testing.T) {
		got, err := Record(Input{
			Kind: "支出", Amount: "1", Date: today, Memo: ptr("   "),
		}, today, "d")
		if err != nil || got.Memo != "" {
			t.Fatalf("got %+v %v", got, err)
		}
	})
	t.Run("メモが無いときは空", func(t *testing.T) {
		got, err := Record(Input{
			Kind: "支出", Amount: "1", Date: today,
		}, today, "e")
		if err != nil || got.Memo != "" {
			t.Fatalf("got %+v %v", got, err)
		}
	})
}

func TestCorrect(t *testing.T) {
	current := Nyushukkin{ID: "a", Kind: "支出", Amount: 5000, Date: "2026-09-06", Memo: ""}
	got, err := Correct(current, Input{
		Kind: "支出", Amount: "3000", Date: "2026-09-06", Memo: ptr(""),
	}, today)
	if err != nil {
		t.Fatal(err)
	}
	if got.Amount != 3000 || got.ID != "a" {
		t.Fatalf("got %+v", got)
	}
}

func TestRemove(t *testing.T) {
	items := []Nyushukkin{
		{ID: "a", Kind: "支出", Amount: 5000, Date: "2026-09-06", Memo: ""},
		{ID: "b", Kind: "支出", Amount: 5000, Date: "2026-09-06", Memo: ""},
	}
	t.Run("ある入出金を消せる", func(t *testing.T) {
		got, removed, err := Remove(items, "a")
		if err != nil || removed.ID != "a" || len(got) != 1 || got[0].ID != "b" {
			t.Fatalf("got %+v removed %+v %v", got, removed, err)
		}
	})
	t.Run("無い入出金は消せない", func(t *testing.T) {
		if _, _, err := Remove(items, "z"); err == nil {
			t.Fatal("expected error")
		}
	})
}
