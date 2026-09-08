package controller

import (
	"encoding/json"
	"errors"
	"net/http"

	"github.com/tentaShiratori/kakeibo/api/internal/domain/model/nyushukkin"
	"github.com/tentaShiratori/kakeibo/api/internal/domain/model/waku"
	"github.com/tentaShiratori/kakeibo/api/internal/query/nyushukkin_query"
	"github.com/tentaShiratori/kakeibo/api/internal/query/waku_query"
	"github.com/tentaShiratori/kakeibo/api/internal/usecase"
	"github.com/tentaShiratori/kakeibo/api/internal/usecase/correct_nyushukkin"
	"github.com/tentaShiratori/kakeibo/api/internal/usecase/record_nyushukkin"
	"github.com/tentaShiratori/kakeibo/api/internal/usecase/remove_nyushukkin"
)

type Nyushukkin struct {
	app   usecase.App
	query nyushukkin_query.Repository
}

func New(app usecase.App, nyushukkinQuery nyushukkin_query.Repository, wakuQuery waku_query.Repository) http.Handler {
	n := &Nyushukkin{app: app, query: nyushukkinQuery}
	wakuCtl := &Waku{app: app, query: wakuQuery}
	furikaeriCtl := &Furikaeri{nyushukkin: nyushukkinQuery, waku: wakuQuery}
	mux := http.NewServeMux()
	mux.HandleFunc("POST /nyushukkin", n.record)
	mux.HandleFunc("GET /nyushukkin", n.list)
	mux.HandleFunc("PUT /nyushukkin/{id}", n.correct)
	mux.HandleFunc("DELETE /nyushukkin/{id}", n.remove)
	mux.HandleFunc("POST /waku", wakuCtl.create)
	mux.HandleFunc("GET /waku", wakuCtl.list)
	mux.HandleFunc("PUT /waku/{id}", wakuCtl.rename)
	mux.HandleFunc("DELETE /waku/{id}", wakuCtl.remove)
	mux.HandleFunc("GET /furikaeri", furikaeriCtl.get)
	return withCORS(mux)
}

func withCORS(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		next.ServeHTTP(w, r)
	})
}

func (c *Nyushukkin) record(w http.ResponseWriter, r *http.Request) {
	input, err := decodeInput(r)
	if err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}
	item, err := record_nyushukkin.RecordNyushukkin(c.app, input)
	if err != nil {
		writeUsecaseError(w, err)
		return
	}
	writeJSON(w, http.StatusCreated, item)
}

func (c *Nyushukkin) correct(w http.ResponseWriter, r *http.Request) {
	input, err := decodeInput(r)
	if err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}
	item, err := correct_nyushukkin.CorrectNyushukkin(c.app, r.PathValue("id"), input)
	if err != nil {
		writeUsecaseError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, item)
}

func (c *Nyushukkin) remove(w http.ResponseWriter, r *http.Request) {
	removed, err := remove_nyushukkin.RemoveNyushukkin(c.app, r.PathValue("id"))
	if err != nil {
		writeUsecaseError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, removed)
}

func (c *Nyushukkin) list(w http.ResponseWriter, r *http.Request) {
	items, err := nyushukkin_query.ListByMonth(c.query, r.URL.Query().Get("month"))
	if err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, items)
}

func decodeInput(r *http.Request) (nyushukkin.Input, error) {
	defer r.Body.Close()
	dec := json.NewDecoder(r.Body)
	dec.UseNumber()
	var input nyushukkin.Input
	if err := dec.Decode(&input); err != nil {
		return nyushukkin.Input{}, errors.New("入力が読めません")
	}
	return input, nil
}

func writeUsecaseError(w http.ResponseWriter, err error) {
	if errors.Is(err, nyushukkin.ErrNotFound) {
		writeError(w, http.StatusNotFound, err.Error())
		return
	}
	if errors.Is(err, waku.ErrNotFound) {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}
	switch err.Error() {
	case nyushukkin.KindError, nyushukkin.AmountError, nyushukkin.DateError, nyushukkin.MonthError, nyushukkin.MonthFormat:
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}
	writeError(w, http.StatusInternalServerError, err.Error())
}

func writeError(w http.ResponseWriter, status int, msg string) {
	writeJSON(w, status, map[string]string{"error": msg})
}

func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(v)
}
