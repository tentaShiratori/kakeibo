package controller

import (
	"encoding/json"
	"errors"
	"net/http"

	"github.com/tentaShiratori/kakeibo/api/internal/domain/model/waku"
	"github.com/tentaShiratori/kakeibo/api/internal/query/waku_query"
	"github.com/tentaShiratori/kakeibo/api/internal/usecase"
	"github.com/tentaShiratori/kakeibo/api/internal/usecase/create_waku"
	"github.com/tentaShiratori/kakeibo/api/internal/usecase/remove_waku"
	"github.com/tentaShiratori/kakeibo/api/internal/usecase/rename_waku"
)

type Waku struct {
	app   usecase.App
	query waku_query.Repository
}

func (c *Waku) create(w http.ResponseWriter, r *http.Request) {
	input, err := decodeWakuInput(r)
	if err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}
	item, err := create_waku.CreateWaku(c.app, input)
	if err != nil {
		writeWakuError(w, err)
		return
	}
	writeJSON(w, http.StatusCreated, item)
}

func (c *Waku) rename(w http.ResponseWriter, r *http.Request) {
	input, err := decodeWakuInput(r)
	if err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}
	item, err := rename_waku.RenameWaku(c.app, r.PathValue("id"), input)
	if err != nil {
		writeWakuError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, item)
}

func (c *Waku) remove(w http.ResponseWriter, r *http.Request) {
	removed, err := remove_waku.RemoveWaku(c.app, r.PathValue("id"))
	if err != nil {
		writeWakuError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, removed)
}

func (c *Waku) list(w http.ResponseWriter, _ *http.Request) {
	writeJSON(w, http.StatusOK, waku_query.List(c.query))
}

func decodeWakuInput(r *http.Request) (waku.Input, error) {
	defer r.Body.Close()
	var input waku.Input
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		return waku.Input{}, errors.New("入力が読めません")
	}
	return input, nil
}

func writeWakuError(w http.ResponseWriter, err error) {
	if errors.Is(err, waku.ErrNotFound) {
		writeError(w, http.StatusNotFound, err.Error())
		return
	}
	if errors.Is(err, waku.ErrInUse) {
		writeError(w, http.StatusConflict, err.Error())
		return
	}
	switch err.Error() {
	case waku.NameError, waku.DuplicateName:
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}
	writeError(w, http.StatusInternalServerError, err.Error())
}
