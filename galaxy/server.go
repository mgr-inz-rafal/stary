package main

import (
	"encoding/json"
	"net/http"
	"log"
)

type Server struct {
	world *World
}

func (s *Server) handleGetPoint(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(s.world.galaxy); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
}

func (s *Server) Serve() error {
	http.HandleFunc("/", s.handleGetPoint)

	port := ":8081"
	log.Printf("Server starting on port %s\n", port)
	return http.ListenAndServe(port, nil)
}
