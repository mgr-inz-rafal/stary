package main

import (
	"encoding/json"
	"fmt"
	"galaxy/genproto"
	"log"
	"net/http"
)

type server struct {
	point *genproto.Point
}

// Response structure
type Response struct {
	Message string `json:"message"`
}

func (s *server) handleGetPoint(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(s.point); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
}

func main() {
	point := &genproto.Point{
		X: 10,
		Y: 20,
		Z: 0,
	}

	fmt.Printf("Point: %+v\n", point)

	srv := &server{
		point,
	}

	http.HandleFunc("/", srv.handleGetPoint)

	port := ":8081"
	log.Printf("Server starting on port %s\n", port)
	err := http.ListenAndServe(port, nil)
	if err != nil {
		log.Fatal(err)
	}
}
