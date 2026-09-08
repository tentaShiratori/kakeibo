package record_nyushukkin

import (
	"testing"
	"time"

	"github.com/tentaShiratori/kakeibo/api/internal/domain/model/nyushukkin"
	"github.com/tentaShiratori/kakeibo/api/internal/domain/model/waku"
	"github.com/tentaShiratori/kakeibo/api/internal/usecase"
)

type stubNyushukkin struct {
	items []nyushukkin.Nyushukkin
}

func (s *stubNyushukkin) Record(item nyushukkin.Nyushukkin) error {
	s.items = append(s.items, item)
	return nil
}
func (s *stubNyushukkin) Correct(item nyushukkin.Nyushukkin) error { return nil }
func (s *stubNyushukkin) Remove(id string) (nyushukkin.Nyushukkin, error) {
	return nyushukkin.Nyushukkin{}, nil
}

type stubWaku struct {
	items []waku.Waku
}

func (s *stubWaku) Record(item waku.Waku) error         { return nil }
func (s *stubWaku) Correct(item waku.Waku) error        { return nil }
func (s *stubWaku) Remove(id string) (waku.Waku, error) { return waku.Waku{}, nil }
func (s *stubWaku) All() []waku.Waku                    { return s.items }
func (s *stubWaku) InUse(id string) bool                { return false }

func testApp(n *stubNyushukkin, w *stubWaku) usecase.App {
	now := time.Date(2026, 9, 6, 12, 0, 0, 0, time.FixedZone("JST", 9*3600))
	return usecase.App{
		Nyushukkin: n,
		Waku:       w,
		Now:        func() time.Time { return now },
		NewID:      func() string { return "n1" },
	}
}

func TestRecordNyushukkinWithoutWaku(t *testing.T) {
	n := &stubNyushukkin{}
	got, err := RecordNyushukkin(testApp(n, &stubWaku{}), nyushukkin.Input{
		Kind: "支出", Amount: "1", Date: "2026-09-06",
	})
	if err != nil || got.WakuID != "" || len(n.items) != 1 {
		t.Fatalf("got %+v %v items %+v", got, err, n.items)
	}
}

func TestRecordNyushukkinWithWaku(t *testing.T) {
	n := &stubNyushukkin{}
	w := &stubWaku{items: []waku.Waku{{ID: "w1", Name: "食費"}}}
	got, err := RecordNyushukkin(testApp(n, w), nyushukkin.Input{
		Kind: "支出", Amount: "1", Date: "2026-09-06", WakuID: "w1",
	})
	if err != nil || got.WakuID != "w1" {
		t.Fatalf("got %+v %v", got, err)
	}
}

func TestRecordNyushukkinMissingWaku(t *testing.T) {
	n := &stubNyushukkin{}
	_, err := RecordNyushukkin(testApp(n, &stubWaku{}), nyushukkin.Input{
		Kind: "支出", Amount: "1", Date: "2026-09-06", WakuID: "w1",
	})
	if err == nil || err.Error() != waku.NotFound {
		t.Fatalf("got %v", err)
	}
	if len(n.items) != 0 {
		t.Fatalf("should not record %+v", n.items)
	}
}
