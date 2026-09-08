package waku

import (
	"errors"
	"strings"
)

const (
	NameError     = "名前を入れてください"
	DuplicateName = "同じ名前の枠があります"
	NotFound      = "その枠はありません"
	InUse         = "使っている枠は消せません"
)

var (
	ErrNotFound = errors.New(NotFound)
	ErrInUse    = errors.New(InUse)
)

type validateError struct {
	msg string
}

func (e validateError) Error() string {
	return e.msg
}

func ParseName(raw string) (string, error) {
	name := strings.TrimSpace(raw)
	if name == "" {
		return "", validateError{NameError}
	}
	return name, nil
}

func Find(items []Waku, id string) (Waku, error) {
	for _, item := range items {
		if item.ID == id {
			return item, nil
		}
	}
	return Waku{}, ErrNotFound
}

func HasName(items []Waku, name string, exceptID string) bool {
	for _, item := range items {
		if item.ID != exceptID && item.Name == name {
			return true
		}
	}
	return false
}
