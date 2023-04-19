## [Link to webpage](https://xuj1210.github.io/battleship-montecarlo/frontend/src/)

## Introduction
This webpage showcases how an AI trained to use the [Monte Carlo method](https://en.wikipedia.org/wiki/Monte_Carlo_method) would play the board game [Battleship](https://en.wikipedia.org/wiki/Battleship_(game)). Before each move, the AI generates a heat map of how likely a ship is on each square by aggregating data from tens of thousands of possible ship configurations given the current game state (ie. opponent's ships remaining, previous hits and misses) and selects the square where a ship was present in the most configurations. This webpage visualizes this process with a heat-map that is displayed as the AI plays, giving you a glimpse into it's process.
