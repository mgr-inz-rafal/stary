package main

import (
	"fmt"
	"galaxy/genproto"
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
		random_star := RandomStar()
		random_star.Id = int32(i + 1) // To dodge the protobuf handling of 0 int values
		galaxy.Stars = append(galaxy.Stars, random_star)

		fmt.Println("Added star with id:", random_star.Id)
	}

	return galaxy
}
