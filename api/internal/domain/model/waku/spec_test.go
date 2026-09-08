package waku

import "testing"

func TestParseName(t *testing.T) {
	t.Run("前後の空白を除いた名前を受け取る", func(t *testing.T) {
		got, err := ParseName("  食費  ")
		if err != nil || got != "食費" {
			t.Fatalf("got %q %v", got, err)
		}
	})
	t.Run("空は受け取らない", func(t *testing.T) {
		if _, err := ParseName(""); err == nil {
			t.Fatal("expected error")
		}
		if _, err := ParseName("   "); err == nil {
			t.Fatal("expected error")
		}
	})
}

func TestHasName(t *testing.T) {
	items := []Waku{{ID: "a", Name: "食費"}, {ID: "b", Name: "家賃"}}
	if !HasName(items, "食費", "") {
		t.Fatal("expected duplicate")
	}
	if HasName(items, "食費", "a") {
		t.Fatal("same id is not duplicate")
	}
	if HasName(items, "交通", "") {
		t.Fatal("missing name")
	}
}
