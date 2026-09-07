package main

import (
	"encoding/json"
	"errors"
	"net/http"

	"github.com/tentaShiratori/kakeibo/api/internal/domain/model/nyushukkin"
	"github.com/tentaShiratori/kakeibo/api/internal/query/nyushukkin_query"
	"github.com/tentaShiratori/kakeibo/api/internal/usecase"
	"github.com/tentaShiratori/kakeibo/api/internal/usecase/correct_nyushukkin"
	"github.com/tentaShiratori/kakeibo/api/internal/usecase/record_nyushukkin"
	"github.com/tentaShiratori/kakeibo/api/internal/usecase/remove_nyushukkin"
)

type server struct {
	app usecase.App
}

func newServer(app usecase.App) http.Handler {
	s := &server{app: app}
	mux := http.NewServeMux()
	mux.HandleFunc("POST /nyushukkin", s.record)
	mux.HandleFunc("GET /nyushukkin", s.list)
	mux.HandleFunc("PUT /nyushukkin/{id}", s.correct)
	mux.HandleFunc("DELETE /nyushukkin/{id}", s.remove)
	return mux
}

func (s *server) record(w http.ResponseWriter, r *http.Request) {
	input, err := decodeInput(r)
	if err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}
	item, err := record_nyushukkin.RecordNyushukkin(s.app, input)
	if err != nil {
		writeUsecaseError(w, err)
		return
	}
	writeJSON(w, http.StatusCreated, item)
}

func (s *server) correct(w http.ResponseWriter, r *http.Request) {
	input, err := decodeInput(r)
	if err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}
	item, err := correct_nyushukkin.CorrectNyushukkin(s.app, r.PathValue("id"), input)
	if err != nil {
		writeUsecaseError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, item)
}

func (s *server) remove(w http.ResponseWriter, r *http.Request) {
	removed, err := remove_nyushukkin.RemoveNyushukkin(s.app, r.PathValue("id"))
	if err != nil {
		writeUsecaseError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, removed)
}

func (s *server) list(w http.ResponseWriter, r *http.Request) {
	items, err := nyushukkin_query.ListByMonth(s.app.Nyushukkin, r.URL.Query().Get("month"))
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
