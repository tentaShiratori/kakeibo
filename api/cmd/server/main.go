package main

import (
	"log"
	"net/http"
	"os"
	"time"

	"github.com/tentaShiratori/kakeibo/api/internal/controller"
	"github.com/tentaShiratori/kakeibo/api/internal/infra/repository/book_file"
	"github.com/tentaShiratori/kakeibo/api/internal/infra/repository/nyushukkin_repository"
	"github.com/tentaShiratori/kakeibo/api/internal/infra/repository/waku_repository"
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
	file := book_file.Open(path)
	nyushukkinRepo := nyushukkin_repository.New(file)
	wakuRepo := waku_repository.New(file)
	app := usecase.New(nyushukkinRepo, wakuRepo, time.Now, uuid_utils.New)
	log.Fatal(http.ListenAndServe(":"+port, controller.New(app, nyushukkinRepo, wakuRepo)))
}
