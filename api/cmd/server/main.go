package main

import (
	"crypto/rand"
	"fmt"
	"log"
	"net/http"
	"os"
	"time"
)

func main() {
	path := os.Getenv("KAKEIBO_FILE")
	if path == "" {
		path = "kakeibo.json"
	}
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	book := OpenKakeibo(path)
	handler := newServer(book, time.Now, newID)
	log.Fatal(http.ListenAndServe(":"+port, handler))
}

func newID() string {
	var b [16]byte
	if _, err := rand.Read(b[:]); err != nil {
		panic(err)
	}
	b[6] = (b[6] & 0x0f) | 0x40
	b[8] = (b[8] & 0x3f) | 0x80
	return fmt.Sprintf("%x-%x-%x-%x-%x", b[0:4], b[4:6], b[6:8], b[8:10], b[10:])
}
