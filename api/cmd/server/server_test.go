package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/http/httptest"
	"path/filepath"
	"testing"
	"time"

	"github.com/tentaShiratori/kakeibo/api/internal/domain/model"
)

func TestServerNyushukkin(t *testing.T) {
	ts, _ := testServer(t)
	created := postNyushukkin(t, ts, `{"kind":"支出","amount":5000,"date":"2026-09-06","memo":"米"}`, http.StatusCreated)
	if created.ID == "" || created.Amount != 5000 || created.Kind != "支出" || created.Memo != "米" {
		t.Fatalf("created %+v", created)
	}

	listed := listNyushukkin(t, ts, "2026-09", http.StatusOK)
	if len(listed) != 1 || listed[0] != created {
		t.Fatalf("list %+v", listed)
	}

	corrected := putNyushukkin(t, ts, created.ID, `{"kind":"支出","amount":3000,"date":"2026-09-06","memo":"米"}`, http.StatusOK)
	if corrected.Amount != 3000 || corrected.ID != created.ID {
		t.Fatalf("corrected %+v", corrected)
	}

	income := postNyushukkin(t, ts, `{"kind":"収入","amount":200000,"date":"2026-08-31","memo":""}`, http.StatusCreated)
	september := listNyushukkin(t, ts, "2026-09", http.StatusOK)
	if len(september) != 1 || september[0].ID != created.ID {
		t.Fatalf("september %+v", september)
	}
	august := listNyushukkin(t, ts, "2026-08", http.StatusOK)
	if len(august) != 1 || august[0].ID != income.ID {
		t.Fatalf("august %+v", august)
	}

	removed := deleteNyushukkin(t, ts, created.ID, http.StatusOK)
	if removed.ID != created.ID {
		t.Fatalf("removed %+v", removed)
	}
	if got := listNyushukkin(t, ts, "2026-09", http.StatusOK); len(got) != 0 {
		t.Fatalf("expected empty september, got %+v", got)
	}
}

func TestServerRestartKeepsBook(t *testing.T) {
	now := mustTime("2026-09-06T12:00:00+09:00")
	path := filepath.Join(t.TempDir(), "kakeibo.json")
	book := OpenKakeibo(path)
	ids := 0
	ts := httptest.NewServer(newServer(book, func() time.Time { return now }, func() string {
		ids++
		return fmt.Sprintf("id-%d", ids)
	}))
	created := postNyushukkin(t, ts, `{"kind":"支出","amount":1,"date":"2026-09-06","memo":""}`, http.StatusCreated)
	ts.Close()

	reopened := httptest.NewServer(newServer(OpenKakeibo(path), func() time.Time { return now }, newID))
	t.Cleanup(reopened.Close)
	got := listNyushukkin(t, reopened, "2026-09", http.StatusOK)
	if len(got) != 1 || got[0] != created {
		t.Fatalf("after restart %+v", got)
	}
}

func TestServerValidation(t *testing.T) {
	ts, _ := testServer(t)
	cases := []struct {
		name   string
		body   string
		status int
		err    string
	}{
		{"種類が違う", `{"kind":"取引","amount":1,"date":"2026-09-06","memo":""}`, http.StatusBadRequest, model.KindError},
		{"0円", `{"kind":"支出","amount":0,"date":"2026-09-06","memo":""}`, http.StatusBadRequest, model.AmountError},
		{"小数", `{"kind":"支出","amount":1.5,"date":"2026-09-06","memo":""}`, http.StatusBadRequest, model.AmountError},
		{"明日", `{"kind":"支出","amount":1,"date":"2026-09-07","memo":""}`, http.StatusBadRequest, model.DateError},
		{"存在しない日", `{"kind":"支出","amount":1,"date":"2026-02-31","memo":""}`, http.StatusBadRequest, model.DateError},
		{"読めないJSON", `{`, http.StatusBadRequest, "入力が読めません"},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			_, body := doJSON(t, ts, http.MethodPost, "/nyushukkin", tc.body, tc.status)
			assertError(t, body, tc.err)
		})
	}
}

func TestServerNotFoundAndMonth(t *testing.T) {
	ts, _ := testServer(t)
	_, body := doJSON(t, ts, http.MethodPut, "/nyushukkin/missing", `{"kind":"支出","amount":1,"date":"2026-09-06","memo":""}`, http.StatusNotFound)
	assertError(t, body, model.NotFound)
	_, body = doJSON(t, ts, http.MethodDelete, "/nyushukkin/missing", "", http.StatusNotFound)
	assertError(t, body, model.NotFound)

	_, body = doJSON(t, ts, http.MethodGet, "/nyushukkin", "", http.StatusBadRequest)
	assertError(t, body, model.MonthError)
	_, body = doJSON(t, ts, http.MethodGet, "/nyushukkin?month=2026-13", "", http.StatusBadRequest)
	assertError(t, body, model.MonthFormat)

	empty := listNyushukkin(t, ts, "2026-07", http.StatusOK)
	if empty == nil || len(empty) != 0 {
		t.Fatalf("empty list should be [], got %#v", empty)
	}

	_, body = doJSON(t, ts, http.MethodPost, "/nyushukkin", `{"kind":"支出","amount":9007199254740991,"date":"2026-09-06","memo":""}`, http.StatusCreated)
	var maxItem model.Nyushukkin
	if err := json.Unmarshal(body, &maxItem); err != nil || maxItem.Amount != model.MaxSafe {
		t.Fatalf("max safe %+v %s", maxItem, body)
	}
	_, body = doJSON(t, ts, http.MethodPost, "/nyushukkin", `{"kind":"支出","amount":9007199254740992,"date":"2026-09-06","memo":""}`, http.StatusBadRequest)
	assertError(t, body, model.AmountError)
}

func TestServerAssignsID(t *testing.T) {
	ts, _ := testServer(t)
	created := postNyushukkin(t, ts, `{"id":"client","kind":"支出","amount":1,"date":"2026-09-06","memo":""}`, http.StatusCreated)
	if created.ID == "client" || created.ID == "" {
		t.Fatalf("api should assign id, got %q", created.ID)
	}
}

func testServer(t *testing.T) (*httptest.Server, *Kakeibo) {
	t.Helper()
	now := mustTime("2026-09-06T12:00:00+09:00")
	book := OpenKakeibo(filepath.Join(t.TempDir(), "kakeibo.json"))
	n := 0
	ts := httptest.NewServer(newServer(book, func() time.Time { return now }, func() string {
		n++
		return fmt.Sprintf("id-%d", n)
	}))
	t.Cleanup(ts.Close)
	return ts, book
}

func postNyushukkin(t *testing.T, ts *httptest.Server, body string, status int) model.Nyushukkin {
	t.Helper()
	_, raw := doJSON(t, ts, http.MethodPost, "/nyushukkin", body, status)
	var item model.Nyushukkin
	if err := json.Unmarshal(raw, &item); err != nil {
		t.Fatal(err)
	}
	return item
}

func putNyushukkin(t *testing.T, ts *httptest.Server, id, body string, status int) model.Nyushukkin {
	t.Helper()
	_, raw := doJSON(t, ts, http.MethodPut, "/nyushukkin/"+id, body, status)
	var item model.Nyushukkin
	if err := json.Unmarshal(raw, &item); err != nil {
		t.Fatal(err)
	}
	return item
}

func deleteNyushukkin(t *testing.T, ts *httptest.Server, id string, status int) model.Nyushukkin {
	t.Helper()
	_, raw := doJSON(t, ts, http.MethodDelete, "/nyushukkin/"+id, "", status)
	var item model.Nyushukkin
	if err := json.Unmarshal(raw, &item); err != nil {
		t.Fatal(err)
	}
	return item
}

func listNyushukkin(t *testing.T, ts *httptest.Server, month string, status int) []model.Nyushukkin {
	t.Helper()
	_, raw := doJSON(t, ts, http.MethodGet, "/nyushukkin?month="+month, "", status)
	var items []model.Nyushukkin
	if err := json.Unmarshal(raw, &items); err != nil {
		t.Fatal(err)
	}
	return items
}

func doJSON(t *testing.T, ts *httptest.Server, method, path, body string, status int) (*http.Response, []byte) {
	t.Helper()
	var r io.Reader
	if body != "" || method == http.MethodPost || method == http.MethodPut {
		r = bytes.NewBufferString(body)
	}
	req, err := http.NewRequest(method, ts.URL+path, r)
	if err != nil {
		t.Fatal(err)
	}
	if r != nil {
		req.Header.Set("Content-Type", "application/json")
	}
	res, err := http.DefaultClient.Do(req)
	if err != nil {
		t.Fatal(err)
	}
	defer res.Body.Close()
	raw, err := io.ReadAll(res.Body)
	if err != nil {
		t.Fatal(err)
	}
	if res.StatusCode != status {
		t.Fatalf("%s %s status %d want %d body %s", method, path, res.StatusCode, status, raw)
	}
	return res, raw
}

func assertError(t *testing.T, raw []byte, want string) {
	t.Helper()
	var payload struct {
		Error string `json:"error"`
	}
	if err := json.Unmarshal(raw, &payload); err != nil {
		t.Fatal(err)
	}
	if payload.Error != want {
		t.Fatalf("error %q want %q", payload.Error, want)
	}
}

func mustTime(v string) time.Time {
	tm, err := time.Parse(time.RFC3339, v)
	if err != nil {
		panic(err)
	}
	return tm
}
