package main

import (
	"encoding/json"
	"galaxy/genproto"
	"log"
	"math/rand/v2"
	"net/http"
)

const MaxStarOffset = 20
const MaxX = 800
const MaxY = 600
const MinStars = 5
const MaxStars = 20

type world struct {
	galaxy *genproto.Galaxy
}

// Response structure
type Response struct {
	Message string `json:"message"`
}

func (s *world) handleGetPoint(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(s.galaxy); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
}

func RandomStar() *genproto.Star {
	offset := rand.Int32N(MaxStarOffset*2) - MaxStarOffset

	x := rand.Int32N(MaxX)
	y := rand.Int32N(MaxY)

	return &genproto.Star{
		Pos: &genproto.Point2D{
			X: x,
			Y: y,
		},
		Z: int32(offset),
	}
}

func NewGalaxy() *genproto.Galaxy {
	num_stars := rand.Int32N(MaxStars-MinStars) + MinStars

	galaxy := &genproto.Galaxy{}
	for i := 0; i < int(num_stars); i++ {
		galaxy.Stars = append(galaxy.Stars, RandomStar())
	}

	return galaxy
}

func main() {
	world := world{galaxy: NewGalaxy()}

	http.HandleFunc("/", world.handleGetPoint)

	port := ":8081"
	log.Printf("Server starting on port %s\n", port)
	err := http.ListenAndServe(port, nil)
	if err != nil {
		log.Fatal(err)
	}
}
