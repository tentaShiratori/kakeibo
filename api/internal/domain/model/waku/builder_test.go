package waku

import "testing"

func TestCreate(t *testing.T) {
	got, err := Create(Input{Name: " 食費 "}, "a", nil)
	if err != nil || got != (Waku{ID: "a", Name: "食費"}) {
		t.Fatalf("got %+v %v", got, err)
	}
	if _, err := Create(Input{Name: ""}, "a", nil); err == nil {
		t.Fatal("expected empty name error")
	}
	if _, err := Create(Input{Name: "食費"}, "b", []Waku{{ID: "a", Name: "食費"}}); err == nil {
		t.Fatal("expected duplicate")
	}
}

func TestRename(t *testing.T) {
	current := Waku{ID: "a", Name: "食費"}
	existing := []Waku{current, {ID: "b", Name: "家賃"}}
	got, err := Rename(current, Input{Name: "日用品"}, existing)
	if err != nil || got.Name != "日用品" || got.ID != "a" {
		t.Fatalf("got %+v %v", got, err)
	}
	got, err = Rename(current, Input{Name: "食費"}, existing)
	if err != nil || got.Name != "食費" {
		t.Fatalf("same name %+v %v", got, err)
	}
	if _, err := Rename(current, Input{Name: "家賃"}, existing); err == nil {
		t.Fatal("expected duplicate")
	}
}

func TestRemove(t *testing.T) {
	items := []Waku{{ID: "a", Name: "食費"}, {ID: "b", Name: "家賃"}}
	next, removed, err := Remove(items, "a")
	if err != nil || removed.ID != "a" || len(next) != 1 || next[0].ID != "b" {
		t.Fatalf("got %+v %+v %v", next, removed, err)
	}
	if _, _, err := Remove(items, "z"); err == nil {
		t.Fatal("expected missing")
	}
}
