package main

import (
	"log"
	"net/http"
	"os"
	"time"

	"github.com/tentaShiratori/kakeibo/api/internal/infra/repository/nyushukkin_repository"
	"github.com/tentaShiratori/kakeibo/api/internal/lib/uuid_utils"
	"github.com/tentaShiratori/kakeibo/api/internal/usecase"
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
	app := usecase.New(nyushukkin_repository.New(path), time.Now, uuid_utils.New)
	log.Fatal(http.ListenAndServe(":"+port, newServer(app)))
}
