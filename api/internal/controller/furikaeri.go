package controller

import (
	"net/http"

	"github.com/tentaShiratori/kakeibo/api/internal/query/furikaeri_query"
	"github.com/tentaShiratori/kakeibo/api/internal/query/nyushukkin_query"
	"github.com/tentaShiratori/kakeibo/api/internal/query/waku_query"
)

type Furikaeri struct {
	nyushukkin nyushukkin_query.Repository
	waku       waku_query.Repository
}

func (c *Furikaeri) get(w http.ResponseWriter, r *http.Request) {
	got, err := furikaeri_query.ByMonth(c.nyushukkin, c.waku, r.URL.Query().Get("month"))
	if err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, got)
}
