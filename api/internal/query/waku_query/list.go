package waku_query

import (
	"cmp"
	"slices"

	"github.com/tentaShiratori/kakeibo/api/internal/domain/model/waku"
)

type Repository interface {
	All() []waku.Waku
}

func List(repo Repository) []waku.Waku {
	out := slices.Clone(repo.All())
	slices.SortFunc(out, func(a, b waku.Waku) int {
		if a.Name != b.Name {
			return cmp.Compare(a.Name, b.Name)
		}
		return cmp.Compare(a.ID, b.ID)
	})
	return out
}
