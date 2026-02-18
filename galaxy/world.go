package main

import (
	"fmt"
	"galaxy/genproto"
	"math"
	"math/rand/v2"
)

type World struct {
	galaxy *genproto.Galaxy
}

func RandomStar() *genproto.Star {
	offset := rand.Int32N(MaxStarOffset*2) - MaxStarOffset

	x := rand.Int32N(MaxX)
	y := rand.Int32N(MaxY)

	return &genproto.Star{
		Pos: &genproto.Point2D{
			X: &x,
			Y: &y,
		},
		Z: int32(offset),
	}
}

func NewGalaxy() *genproto.Galaxy {
	// num_stars := rand.Int32N(MaxStars-MinStars) + MinStars
	num_stars := int32(4)

	galaxy := &genproto.Galaxy{}
	addStars(num_stars, galaxy)
	addHyperlines(galaxy)

	return galaxy
}

func StarDistance(star1 *genproto.Star, star2 *genproto.Star) float64 {
	diff_x := (*star1.Pos.X-*star2.Pos.X)*(*star1.Pos.X-*star2.Pos.X);
	diff_y := (*star1.Pos.Y-*star2.Pos.Y)*(*star1.Pos.Y-*star2.Pos.Y);
	return math.Sqrt(float64(diff_x + diff_y));
}

// Use Prim's Algorithm for MST of Stars
func addHyperlines(galaxy *genproto.Galaxy) {
	if len(galaxy.Stars) <= 1 {
		fmt.Println("Not enough stars in galaxy to form hyperlines")
		return
	}

	if len(galaxy.Stars) == 2 {
		fmt.Println("TODO: Return just a single hyperline")
		return
	}

	done := []int32{}
	available := []int32{}

	// Consider the very first star as done
	done = append(done, 0)

	// Other stars are "available"
	// TODO: Can we initialize this in a smarter way?
	for i := 1; i < len(galaxy.Stars); i++ {
		available = append(available, int32(i))
	}

	// Find the closest distance between any stars from two sets
	distances := []float64{}
	for i := 0; i < len(done); i++ {
		for j := 0; j < len(available); j++ {
			star1 := galaxy.Stars[done[i]]
			star2 := galaxy.Stars[available[j]]

			dist := StarDistance(star1, star2)
			distances = append(distances, dist)
		}
	}
	fmt.Println("Distances: ", distances);

	from_id := int32(0)
	to_id := int32(1)
	galaxy.Hyperlines = append(galaxy.Hyperlines, &genproto.Hyperline{
		FromId: &from_id,
		ToId:   &to_id,
	})
}

func addStars(num_stars int32, galaxy *genproto.Galaxy) {
	for i := 0; i < int(num_stars); i++ {
		currentID := int32(i)
		random_star := RandomStar()
		random_star.Id = &currentID
		galaxy.Stars = append(galaxy.Stars, random_star)

		fmt.Println("Added star with id:", *random_star.Id)
	}
}
