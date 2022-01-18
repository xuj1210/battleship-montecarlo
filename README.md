# battleship-montecarlo

## Introduction

This webpage showcases the [Monte Carlo method](https://en.wikipedia.org/wiki/Monte_Carlo_method) through playing the board game "Battleship". In this case, the algorithm randomly places the remaining ships to be found on the current board state tens of thousands of times. It aggregates the frequency at which a ship occupied each unchecked squre on the board, resulting in a heat-map showing the spots where a ship is statistically most likely to be. It repeats this process until it successfully hits a ship, in which case it changes strategy to seek out the rest of the ship and destroy it. 
