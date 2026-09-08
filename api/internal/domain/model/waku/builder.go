package waku

func Create(input Input, id string, existing []Waku) (Waku, error) {
	return assemble(id, input, existing, "")
}

func Rename(current Waku, input Input, existing []Waku) (Waku, error) {
	return assemble(current.ID, input, existing, current.ID)
}

func assemble(id string, input Input, existing []Waku, exceptID string) (Waku, error) {
	name, err := ParseName(input.Name)
	if err != nil {
		return Waku{}, err
	}
	if HasName(existing, name, exceptID) {
		return Waku{}, validateError{DuplicateName}
	}
	return Waku{ID: id, Name: name}, nil
}

func Remove(items []Waku, id string) ([]Waku, Waku, error) {
	next := make([]Waku, 0, len(items))
	var removed Waku
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
		return nil, Waku{}, ErrNotFound
	}
	return next, removed, nil
}

func FromStored(row any) (Waku, bool) {
	rec, ok := row.(map[string]any)
	if !ok {
		return Waku{}, false
	}
	id, _ := rec["id"].(string)
	if id == "" {
		return Waku{}, false
	}
	name, err := ParseName(asString(rec["name"]))
	if err != nil {
		return Waku{}, false
	}
	return Waku{ID: id, Name: name}, true
}

func asString(v any) string {
	s, _ := v.(string)
	return s
}
