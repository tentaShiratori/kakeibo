package nyushukkin

import "encoding/json"

type Nyushukkin struct {
	ID     string `json:"id"`
	Kind   string `json:"kind"`
	Amount int64  `json:"amount"`
	Date   string `json:"date"`
	Memo   string `json:"memo"`
}

type Input struct {
	Kind   string      `json:"kind"`
	Amount json.Number `json:"amount"`
	Date   string      `json:"date"`
	Memo   *string     `json:"memo"`
}
