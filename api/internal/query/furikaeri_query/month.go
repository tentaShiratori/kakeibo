package furikaeri_query

import (
	"github.com/tentaShiratori/kakeibo/api/internal/domain/model/nyushukkin"
	"github.com/tentaShiratori/kakeibo/api/internal/domain/model/waku"
	"github.com/tentaShiratori/kakeibo/api/internal/query/nyushukkin_query"
	"github.com/tentaShiratori/kakeibo/api/internal/query/waku_query"
)

type Furikaeri struct {
	Month string `json:"month"`
	nyushukkin.Totals
	Waku []Waku            `json:"waku"`
	None nyushukkin.Totals `json:"none"`
}

type Waku struct {
	ID   string `json:"id"`
	Name string `json:"name"`
	nyushukkin.Totals
}

func ByMonth(nyushukkinRepo nyushukkin_query.Repository, wakuRepo waku_query.Repository, month string) (Furikaeri, error) {
	parsed, err := nyushukkin.ParseMonth(month)
	if err != nil {
		return Furikaeri{}, err
	}
	inMonth := nyushukkin.InMonth(nyushukkinRepo.All(), parsed)
	wakus := waku_query.List(wakuRepo)
	known := map[string]struct{}{}
	for _, item := range wakus {
		known[item.ID] = struct{}{}
	}
	byWaku := map[string][]nyushukkin.Nyushukkin{}
	var none []nyushukkin.Nyushukkin
	for _, item := range inMonth {
		if _, ok := known[item.WakuID]; ok {
			byWaku[item.WakuID] = append(byWaku[item.WakuID], item)
			continue
		}
		none = append(none, item)
	}
	rows := make([]Waku, 0, len(wakus))
	for _, item := range wakus {
		rows = append(rows, row(item, byWaku[item.ID]))
	}
	return Furikaeri{
		Month:  parsed,
		Totals: nyushukkin.TotalsOf(inMonth),
		Waku:   rows,
		None:   nyushukkin.TotalsOf(none),
	}, nil
}

func row(item waku.Waku, items []nyushukkin.Nyushukkin) Waku {
	return Waku{ID: item.ID, Name: item.Name, Totals: nyushukkin.TotalsOf(items)}
}
