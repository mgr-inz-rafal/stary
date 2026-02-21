package main

import (
	"bufio"
	"fmt"
	"log"
	"os"
)

const MaxStarOffset = 20
const MaxX = 800
const MaxY = 600
const MinStars = 5
const MaxStars = 20

func main() {
	file, open_err := os.Open("starnames.txt")
	if open_err != nil {
		log.Fatal(open_err)
	}
	defer file.Close()

	starnames := []string{}
	scanner := bufio.NewScanner(file)
	for scanner.Scan() {
		starnames = append(starnames, scanner.Text())
	}

	fmt.Println("Loaded", len(starnames), "starnames")

	world := World{galaxy: NewGalaxy(starnames)}
	server := Server{world: &world, hub: NewHub()}

	go server.startWeatherLoop(&world)

	serve_err := server.Serve()
	if serve_err != nil {
		log.Fatal(open_err)
	}
}
