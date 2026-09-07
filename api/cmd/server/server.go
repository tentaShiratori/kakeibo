package main

import (
	"encoding/json"
	"errors"
	"net/http"
	"time"

	"github.com/tentaShiratori/kakeibo/api/internal/domain/model"
)

type server struct {
	book  *Kakeibo
	now   func() time.Time
	newID func() string
}

func newServer(book *Kakeibo, now func() time.Time, newID func() string) http.Handler {
	s := &server{book: book, now: now, newID: newID}
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
	item, err := model.RecordNyushukkin(input, model.TodayJST(s.now()), s.newID())
	if err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}
	if err := s.book.Record(item); err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	writeJSON(w, http.StatusCreated, item)
}

func (s *server) correct(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	input, err := decodeInput(r)
	if err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}
	current := model.Nyushukkin{ID: id}
	item, err := model.CorrectNyushukkin(current, input, model.TodayJST(s.now()))
	if err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}
	if err := s.book.Correct(item); err != nil {
		writeBookError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, item)
}

func (s *server) remove(w http.ResponseWriter, r *http.Request) {
	removed, err := s.book.Remove(r.PathValue("id"))
	if err != nil {
		writeBookError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, removed)
}

func (s *server) list(w http.ResponseWriter, r *http.Request) {
	month, err := model.ParseMonth(r.URL.Query().Get("month"))
	if err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, s.book.List(month))
}

func decodeInput(r *http.Request) (model.NyushukkinInput, error) {
	defer r.Body.Close()
	dec := json.NewDecoder(r.Body)
	dec.UseNumber()
	var input model.NyushukkinInput
	if err := dec.Decode(&input); err != nil {
		return model.NyushukkinInput{}, errors.New("入力が読めません")
	}
	return input, nil
}

func writeBookError(w http.ResponseWriter, err error) {
	if errors.Is(err, model.ErrNotFound) {
		writeError(w, http.StatusNotFound, err.Error())
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
