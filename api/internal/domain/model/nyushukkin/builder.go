package nyushukkin

import "strings"

func Record(input Input, today string, id string) (Nyushukkin, error) {
	return assemble(id, input, today)
}

func Correct(current Nyushukkin, input Input, today string) (Nyushukkin, error) {
	return assemble(current.ID, input, today)
}

func assemble(id string, input Input, today string) (Nyushukkin, error) {
	kind, amount, date, memo, err := parseInput(input, today)
	if err != nil {
		return Nyushukkin{}, err
	}
	return Nyushukkin{ID: id, Kind: kind, Amount: amount, Date: date, Memo: memo}, nil
}

func parseInput(input Input, today string) (kind string, amount int64, date string, memo string, err error) {
	kind, err = parseKind(input.Kind)
	if err != nil {
		return "", 0, "", "", err
	}
	amount, err = parseAmount(input.Amount)
	if err != nil {
		return "", 0, "", "", err
	}
	date, err = parseDate(input.Date, today)
	if err != nil {
		return "", 0, "", "", err
	}
	if input.Memo != nil {
		memo = strings.TrimSpace(*input.Memo)
	}
	return kind, amount, date, memo, nil
}

func Remove(items []Nyushukkin, id string) ([]Nyushukkin, Nyushukkin, error) {
	next := make([]Nyushukkin, 0, len(items))
	var removed Nyushukkin
	found := false
	for _, item := range items {
		if item.ID == id {
			removed = item
			found = true
			continue
		}
		next = append(next, item)
	}
	if !found {
		return nil, Nyushukkin{}, ErrNotFound
	}
	return next, removed, nil
}

func FromStored(row any) (Nyushukkin, bool) {
	rec, ok := row.(map[string]any)
	if !ok {
		return Nyushukkin{}, false
	}
	id, _ := rec["id"].(string)
	if id == "" {
		return Nyushukkin{}, false
	}
	kind, err := parseKind(asString(rec["kind"]))
	if err != nil {
		return Nyushukkin{}, false
	}
	amount, ok := asStoredAmount(rec["amount"])
	if !ok {
		return Nyushukkin{}, false
	}
	date, err := parseDate(asString(rec["date"]), "9999-12-31")
	if err != nil {
		return Nyushukkin{}, false
	}
	memo, ok := rec["memo"].(string)
	if !ok {
		return Nyushukkin{}, false
	}
	return Nyushukkin{ID: id, Kind: kind, Amount: amount, Date: date, Memo: memo}, true
}

func asString(v any) string {
	s, _ := v.(string)
	return s
}

func asStoredAmount(v any) (int64, bool) {
	n, ok := v.(float64)
	if !ok || n != float64(int64(n)) || n < 1 || n > MaxSafe {
		return 0, false
	}
	return int64(n), true
}
