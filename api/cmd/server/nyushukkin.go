package main

import (
	"cmp"
	"encoding/json"
	"errors"
	"slices"
	"strconv"
	"strings"
	"time"
)

const (
	kindExpense = "支出"
	kindIncome  = "収入"
	kindError   = "収入か支出を選んでください"
	amountError = "金額は1円以上の整数円です"
	dateError   = "入出日は今日以前の日付です"
	monthError  = "暦月を指定してください"
	monthFormat = "暦月の形式が違います"
	notFound    = "その入出金はありません"
	maxSafe     = 9007199254740991
)

var (
	errNotFound = errors.New(notFound)
	jst         = time.FixedZone("JST", 9*3600)
)

type Nyushukkin struct {
	ID     string `json:"id"`
	Kind   string `json:"kind"`
	Amount int64  `json:"amount"`
	Date   string `json:"date"`
	Memo   string `json:"memo"`
}

type nyushukkinInput struct {
	Kind   string      `json:"kind"`
	Amount json.Number `json:"amount"`
	Date   string      `json:"date"`
	Memo   *string     `json:"memo"`
}

type validateError struct {
	msg string
}

func (e validateError) Error() string {
	return e.msg
}

func todayJST(now time.Time) string {
	return now.In(jst).Format("2006-01-02")
}

func parseKind(raw string) (string, error) {
	if raw == kindExpense || raw == kindIncome {
		return raw, nil
	}
	return "", validateError{kindError}
}

func parseAmount(raw json.Number) (int64, error) {
	s := string(raw)
	if s == "" || strings.ContainsAny(s, ".eE+-") {
		return 0, validateError{amountError}
	}
	v, err := strconv.ParseInt(s, 10, 64)
	if err != nil || v < 1 || v > maxSafe {
		return 0, validateError{amountError}
	}
	return v, nil
}

func parseDate(raw string, today string) (string, error) {
	date := strings.TrimSpace(raw)
	t, err := time.ParseInLocation("2006-01-02", date, jst)
	if err != nil || t.Format("2006-01-02") != date {
		return "", validateError{dateError}
	}
	if date > today {
		return "", validateError{dateError}
	}
	return date, nil
}

func parseMonth(raw string) (string, error) {
	month := strings.TrimSpace(raw)
	if month == "" {
		return "", validateError{monthError}
	}
	t, err := time.ParseInLocation("2006-01", month, jst)
	if err != nil || t.Format("2006-01") != month {
		return "", validateError{monthFormat}
	}
	return month, nil
}

func calendarMonth(date string) string {
	if len(date) < 7 {
		return ""
	}
	return date[:7]
}

func parseInput(input nyushukkinInput, today string) (kind string, amount int64, date string, memo string, err error) {
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

func recordNyushukkin(input nyushukkinInput, today string, id string) (Nyushukkin, error) {
	return assemble(id, input, today)
}

func correctNyushukkin(current Nyushukkin, input nyushukkinInput, today string) (Nyushukkin, error) {
	return assemble(current.ID, input, today)
}

func assemble(id string, input nyushukkinInput, today string) (Nyushukkin, error) {
	kind, amount, date, memo, err := parseInput(input, today)
	if err != nil {
		return Nyushukkin{}, err
	}
	return Nyushukkin{ID: id, Kind: kind, Amount: amount, Date: date, Memo: memo}, nil
}

func removeNyushukkin(items []Nyushukkin, id string) ([]Nyushukkin, Nyushukkin, error) {
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
		return nil, Nyushukkin{}, errNotFound
	}
	return next, removed, nil
}

func nyushukkinInMonth(items []Nyushukkin, month string) []Nyushukkin {
	out := make([]Nyushukkin, 0)
	for _, item := range items {
		if calendarMonth(item.Date) == month {
			out = append(out, item)
		}
	}
	return out
}

func sortNyushukkin(items []Nyushukkin) []Nyushukkin {
	out := slices.Clone(items)
	slices.SortFunc(out, func(a, b Nyushukkin) int {
		if a.Date != b.Date {
			return cmp.Compare(b.Date, a.Date)
		}
		return cmp.Compare(b.ID, a.ID)
	})
	return out
}

func asNyushukkin(row any) (Nyushukkin, bool) {
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
	if !ok || n != float64(int64(n)) || n < 1 || n > maxSafe {
		return 0, false
	}
	return int64(n), true
}
