package main

import (
	"fmt"
	"galaxy/genproto"
	"math"
	"math/rand/v2"
	"slices"
	"sort"
)

type World struct {
	galaxy *genproto.Galaxy
}

func RandomStar(starnames []string) (*genproto.Star, []string) {
	offset := rand.Int32N(MaxStarOffset*2) - MaxStarOffset

	var random_name string
	var returned_slice []string

	x := rand.Int32N(MaxX)
	y := rand.Int32N(MaxY)

	if len(starnames) == 0 {
		generated_name := fmt.Sprintf("Star %d", rand.Int())
		random_name = generated_name
	} else {
		random_index := rand.IntN(len(starnames))
		random_name = starnames[random_index]
		returned_slice = slices.Delete(starnames, random_index, random_index+1)
	}

	fmt.Println("Assigned star with name:", random_name, "- now left with", len(starnames)-1, "starnames")

	return &genproto.Star{
		Pos: &genproto.Point2D{
			X: &x,
			Y: &y,
		},
		Z:    int32(offset),
		Name: random_name,
	}, returned_slice
}

func NewGalaxy(starnames []string) *genproto.Galaxy {
	num_stars := rand.Int32N(MaxStars-MinStars) + MinStars

	galaxy := &genproto.Galaxy{}
	addStars(num_stars, galaxy, starnames)
	addHyperlines(galaxy)

	return galaxy
}

func StarDistance(star1 *genproto.Star, star2 *genproto.Star) float64 {
	diff_x := (*star1.Pos.X - *star2.Pos.X) * (*star1.Pos.X - *star2.Pos.X)
	diff_y := (*star1.Pos.Y - *star2.Pos.Y) * (*star1.Pos.Y - *star2.Pos.Y)
	return math.Sqrt(float64(diff_x + diff_y))
}

func removeInt32(slice []int32, val int32) []int32 {
	for i, v := range slice {
		if v == val {
			return append(slice[:i], slice[i+1:]...)
		}
	}
	return slice
}

// Use Prim's Algorithm for MST of Stars
// Naive, non-optimal implementation.
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

	type StarDistances struct {
		FromId int32
		ToId   int32
		Dist   float64
	}

	for {
		if len(available) == 0 {
			break
		}

		// Find the closest distance between any stars from two sets
		distances := []StarDistances{}
		for i := 0; i < len(done); i++ {
			for j := 0; j < len(available); j++ {
				star1 := galaxy.Stars[done[i]]
				star2 := galaxy.Stars[available[j]]

				dist := StarDistance(star1, star2)
				distances = append(distances, StarDistances{
					FromId: *star1.Id,
					ToId:   *star2.Id,
					Dist:   dist,
				})
			}
		}
		sort.Slice(distances, func(i, j int) bool {
			return distances[i].Dist < distances[j].Dist
		})

		// Register hyperline
		closest := distances[0]
		galaxy.Hyperlines = append(galaxy.Hyperlines, &genproto.Hyperline{
			FromId: &distances[0].FromId,
			ToId:   &distances[0].ToId,
		})

		// Update tracking collections
		done = append(done, closest.ToId)
		available = removeInt32(available, closest.ToId)
	}
}

func addStars(num_stars int32, galaxy *genproto.Galaxy, starnames []string) {
	var random_star *genproto.Star
	
	for i := 0; i < int(num_stars); i++ {
		currentID := int32(i)

		random_star, starnames = RandomStar(starnames)
		random_star.Id = &currentID
		galaxy.Stars = append(galaxy.Stars, random_star)

		fmt.Println("Added star with id:", *random_star.Id)
	}
}
