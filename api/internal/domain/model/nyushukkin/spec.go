package nyushukkin

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
	KindError   = "収入か支出を選んでください"
	AmountError = "金額は1円以上の整数円です"
	DateError   = "入出日は今日以前の日付です"
	MonthError  = "暦月を指定してください"
	MonthFormat = "暦月の形式が違います"
	NotFound    = "その入出金はありません"
	MaxSafe     = 9007199254740991
)

var (
	ErrNotFound = errors.New(NotFound)
	jst         = time.FixedZone("JST", 9*3600)
)

type validateError struct {
	msg string
}

func (e validateError) Error() string {
	return e.msg
}

func TodayJST(now time.Time) string {
	return now.In(jst).Format("2006-01-02")
}

func parseKind(raw string) (string, error) {
	if raw == kindExpense || raw == kindIncome {
		return raw, nil
	}
	return "", validateError{KindError}
}

func parseAmount(raw json.Number) (int64, error) {
	s := string(raw)
	if s == "" || strings.ContainsAny(s, ".eE+-") {
		return 0, validateError{AmountError}
	}
	v, err := strconv.ParseInt(s, 10, 64)
	if err != nil || v < 1 || v > MaxSafe {
		return 0, validateError{AmountError}
	}
	return v, nil
}

func parseDate(raw string, today string) (string, error) {
	date := strings.TrimSpace(raw)
	t, err := time.ParseInLocation("2006-01-02", date, jst)
	if err != nil || t.Format("2006-01-02") != date {
		return "", validateError{DateError}
	}
	if date > today {
		return "", validateError{DateError}
	}
	return date, nil
}

func ParseMonth(raw string) (string, error) {
	month := strings.TrimSpace(raw)
	if month == "" {
		return "", validateError{MonthError}
	}
	t, err := time.ParseInLocation("2006-01", month, jst)
	if err != nil || t.Format("2006-01") != month {
		return "", validateError{MonthFormat}
	}
	return month, nil
}

func calendarMonth(date string) string {
	if len(date) < 7 {
		return ""
	}
	return date[:7]
}

func InMonth(items []Nyushukkin, month string) []Nyushukkin {
	out := make([]Nyushukkin, 0)
	for _, item := range items {
		if calendarMonth(item.Date) == month {
			out = append(out, item)
		}
	}
	return out
}

func HasWaku(items []Nyushukkin, wakuID string) bool {
	if wakuID == "" {
		return false
	}
	for _, item := range items {
		if item.WakuID == wakuID {
			return true
		}
	}
	return false
}

func Sort(items []Nyushukkin) []Nyushukkin {
	out := slices.Clone(items)
	slices.SortFunc(out, func(a, b Nyushukkin) int {
		if a.Date != b.Date {
			return cmp.Compare(b.Date, a.Date)
		}
		return cmp.Compare(b.ID, a.ID)
	})
	return out
}
