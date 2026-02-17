package main

import (
	"galaxy/genproto"
	"log"
	"math/rand/v2"
)

const MaxStarOffset = 20
const MaxX = 800
const MaxY = 600
const MinStars = 5
const MaxStars = 20

type World struct {
	galaxy *genproto.Galaxy
}

// Response structure
type Response struct {
	Message string `json:"message"`
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
	world := World{galaxy: NewGalaxy()}
	server := Server{world: &world}

	err := server.Serve()
	if err != nil {
		log.Fatal(err)
	}
}
