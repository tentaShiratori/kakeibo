package controller

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/tentaShiratori/kakeibo/api/internal/domain/model/waku"
)

func TestWaku(t *testing.T) {
	ts := testServer(t)
	created := postWaku(t, ts, `{"name":"食費"}`, http.StatusCreated)
	if created.ID == "" || created.Name != "食費" {
		t.Fatalf("created %+v", created)
	}
	listed := listWaku(t, ts)
	if len(listed) != 1 || listed[0] != created {
		t.Fatalf("list %+v", listed)
	}

	renamed := putWaku(t, ts, created.ID, `{"name":"日用品"}`, http.StatusOK)
	if renamed.Name != "日用品" || renamed.ID != created.ID {
		t.Fatalf("renamed %+v", renamed)
	}

	_, body := doJSON(t, ts, http.MethodPost, "/waku", `{"name":"日用品"}`, http.StatusBadRequest)
	assertError(t, body, waku.DuplicateName)

	other := postWaku(t, ts, `{"name":"家賃"}`, http.StatusCreated)
	listed = listWaku(t, ts)
	if len(listed) != 2 || listed[0].Name != "家賃" || listed[1].Name != "日用品" {
		t.Fatalf("sorted %+v", listed)
	}

	removed := deleteWaku(t, ts, other.ID, http.StatusOK)
	if removed.ID != other.ID {
		t.Fatalf("removed %+v", removed)
	}
	if got := listWaku(t, ts); len(got) != 1 || got[0].ID != created.ID {
		t.Fatalf("after remove %+v", got)
	}
}

func TestWakuValidation(t *testing.T) {
	ts := testServer(t)
	_, body := doJSON(t, ts, http.MethodPost, "/waku", `{"name":""}`, http.StatusBadRequest)
	assertError(t, body, waku.NameError)
	_, body = doJSON(t, ts, http.MethodPost, "/waku", `{`, http.StatusBadRequest)
	assertError(t, body, "入力が読めません")
	_, body = doJSON(t, ts, http.MethodPut, "/waku/missing", `{"name":"食費"}`, http.StatusNotFound)
	assertError(t, body, waku.NotFound)
	_, body = doJSON(t, ts, http.MethodDelete, "/waku/missing", "", http.StatusNotFound)
	assertError(t, body, waku.NotFound)
}

func TestWakuAssignsID(t *testing.T) {
	ts := testServer(t)
	created := postWaku(t, ts, `{"id":"client","name":"食費"}`, http.StatusCreated)
	if created.ID == "client" || created.ID == "" {
		t.Fatalf("api should assign id, got %q", created.ID)
	}
}

func TestNyushukkinWaku(t *testing.T) {
	ts := testServer(t)
	food := postWaku(t, ts, `{"name":"食費"}`, http.StatusCreated)
	rent := postWaku(t, ts, `{"name":"家賃"}`, http.StatusCreated)

	created := postNyushukkin(t, ts, `{"kind":"支出","amount":1,"date":"2026-09-06","memo":""}`, http.StatusCreated)
	if created.WakuID != "" {
		t.Fatalf("expected no waku, got %+v", created)
	}

	attached := putNyushukkin(t, ts, created.ID, `{"kind":"支出","amount":1,"date":"2026-09-06","memo":"","wakuId":"`+food.ID+`"}`, http.StatusOK)
	if attached.WakuID != food.ID {
		t.Fatalf("attached %+v", attached)
	}
	listed := listNyushukkin(t, ts, "2026-09", http.StatusOK)
	if len(listed) != 1 || listed[0].WakuID != food.ID {
		t.Fatalf("list %+v", listed)
	}

	changed := putNyushukkin(t, ts, created.ID, `{"kind":"支出","amount":1,"date":"2026-09-06","memo":"","wakuId":"`+rent.ID+`"}`, http.StatusOK)
	if changed.WakuID != rent.ID {
		t.Fatalf("changed %+v", changed)
	}

	_, body := doJSON(t, ts, http.MethodDelete, "/waku/"+rent.ID, "", http.StatusConflict)
	assertError(t, body, waku.InUse)

	detached := putNyushukkin(t, ts, created.ID, `{"kind":"支出","amount":1,"date":"2026-09-06","memo":""}`, http.StatusOK)
	if detached.WakuID != "" {
		t.Fatalf("detached %+v", detached)
	}
	deleteWaku(t, ts, rent.ID, http.StatusOK)

	withWaku := postNyushukkin(t, ts, `{"kind":"支出","amount":2,"date":"2026-09-06","memo":"","wakuId":"`+food.ID+`"}`, http.StatusCreated)
	if withWaku.WakuID != food.ID {
		t.Fatalf("recorded %+v", withWaku)
	}

	_, body = doJSON(t, ts, http.MethodPost, "/nyushukkin", `{"kind":"支出","amount":1,"date":"2026-09-06","memo":"","wakuId":"missing"}`, http.StatusBadRequest)
	assertError(t, body, waku.NotFound)

	_, body = doJSON(t, ts, http.MethodPost, "/nyushukkin", `{"kind":"支出","amount":1,"date":"2026-09-06","memo":"","wakuId":["`+food.ID+`","`+rent.ID+`"]}`, http.StatusBadRequest)
	assertError(t, body, "入力が読めません")
}

func postWaku(t *testing.T, ts *httptest.Server, body string, status int) waku.Waku {
	t.Helper()
	_, raw := doJSON(t, ts, http.MethodPost, "/waku", body, status)
	var item waku.Waku
	if err := json.Unmarshal(raw, &item); err != nil {
		t.Fatal(err)
	}
	return item
}

func putWaku(t *testing.T, ts *httptest.Server, id, body string, status int) waku.Waku {
	t.Helper()
	_, raw := doJSON(t, ts, http.MethodPut, "/waku/"+id, body, status)
	var item waku.Waku
	if err := json.Unmarshal(raw, &item); err != nil {
		t.Fatal(err)
	}
	return item
}

func deleteWaku(t *testing.T, ts *httptest.Server, id string, status int) waku.Waku {
	t.Helper()
	_, raw := doJSON(t, ts, http.MethodDelete, "/waku/"+id, "", status)
	var item waku.Waku
	if err := json.Unmarshal(raw, &item); err != nil {
		t.Fatal(err)
	}
	return item
}

func listWaku(t *testing.T, ts *httptest.Server) []waku.Waku {
	t.Helper()
	_, raw := doJSON(t, ts, http.MethodGet, "/waku", "", http.StatusOK)
	var items []waku.Waku
	if err := json.Unmarshal(raw, &items); err != nil {
		t.Fatal(err)
	}
	return items
}
