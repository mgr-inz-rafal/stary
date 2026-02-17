package main

import (
	"log"
)

const MaxStarOffset = 20
const MaxX = 800
const MaxY = 600
const MinStars = 5
const MaxStars = 20

func main() {
	world := World{galaxy: NewGalaxy()}
	server := Server{world: &world}

	err := server.Serve()
	if err != nil {
		log.Fatal(err)
	}
}
