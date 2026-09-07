package uuid_utils

import (
	"regexp"
	"testing"
)

var uuidv4 = regexp.MustCompile(`^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$`)

func TestNew(t *testing.T) {
	t.Run("UUID v4 を返す", func(t *testing.T) {
		got := New()
		if !uuidv4.MatchString(got) {
			t.Fatalf("got %q", got)
		}
	})
	t.Run("二回呼べば別の id になる", func(t *testing.T) {
		if New() == New() {
			t.Fatal("expected distinct ids")
		}
	})
	t.Run("空にはしない", func(t *testing.T) {
		if New() == "" {
			t.Fatal("expected non-empty id")
		}
	})
}
