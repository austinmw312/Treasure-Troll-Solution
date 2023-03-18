/*
TREASURE TROLL SOLUTION
Average for 100 runs: 491.19 turns, 2536.52ms

HIGH-LEVEL STRATEGY:

	Divide the problem into 3 stages and 1 final step:

	- STAGE 1: Initial exploration
	- STAGE 2: Build first level of staircase
	- STAGE 3: Build intermediate levels
	- FINAL STEP: Reach treasure

	STAGE 1: This stage consists of searching the map for the tower and 
	storing all information (cell types and cell heights) we discover 
	in a grid (we'll call it 'map').

	STAGE 2: After the tower has been found, we move on to STAGE 2, in which 
	we lay down one layer of blocks in a circle around the tower as the 
	foundation for our staircase.

		foundation = ######

	STAGE 3: This stage consists of adding layers one at a time to the 
	foundation, but each time, omitting one block at the beginning, thus 
	creating the staircase.

					  ####
					 #####
		staircase = ######

	FINAL STEP: Finally, we save time by carrying a block to the top of the
	staircase (height = 6) and placing the block right under the troll to 
	reach a height of 7. Then we proceed to the treasure.
*/


function Stacker(){

var
EMPTY = 0,
WALL = 1,
BLOCK = 2,
GOLD = 3;


// Moveset will be our queue of moves to execute in order (one move each turn)
var moveset = [];


/* Create an empty 35 x 35 array 'map' (double the size of the maze
to avoid overflow, since we don't know where we start).
This is where we will store information about what we see as we go,
namely, cell type and cell level (or height) as a tuple. */
var map = new Array(35);
for (var i = 0; i < 35; i++) {
  map[i] = new Array(35);
  for (var j = 0; j < 35; j++) {
	// Initialize everything to WALL since we don't know types at start
	// and don't want to attempt traversing through what could be a wall
    map[i][j] = [WALL, undefined];
  }
}


// Create an array 'visited' of same size to remember cells we've visited
var visited = new Array(35);
for (var i = 0; i < 35; i++) {
	visited[i] = new Array(35).fill(false);
}


// Initialize our current position in the map (middle of the map)
var cur_pos = [17, 17]


// Initialize global variables

// Booleans
var towerFound = false; // How we will know when the exploration stage is over 
var stage2 = false; // How we will decide when to execute stage 2 functions
var stage3 = false;
var holdingBlock = false;

// Arrays
var tower = undefined; // Location of the tower
var targets = undefined; // Target cells for staircase
var cur_targets = undefined; // Target cells for current layer of staircase


this.turn = function(cell){
	/* Return the move to execute on the current turn. 
	Move will be drawn from moveset. */

	// Current cell is visited
	visited[cur_pos[0]][cur_pos[1]] = true;

	// Update map with info on surrounding cells
	map[cur_pos[0]][cur_pos[1]] = [cell.type, cell.level];
	map[cur_pos[0] - 1][cur_pos[1]] = [cell.up.type, cell.up.level];
	map[cur_pos[0] + 1][cur_pos[1]] = [cell.down.type, cell.down.level];
	map[cur_pos[0]][cur_pos[1] - 1] = [cell.left.type, cell.left.level];
	map[cur_pos[0]][cur_pos[1] + 1] = [cell.right.type, cell.right.level];


	// STAGE 1: Check if tower has been found
	if (!towerFound && (cell.up.type === GOLD || cell.down.type === GOLD ||
		cell.left.type === GOLD || cell.right.type === GOLD)) {

		// Tower is found, move to stage 2
		towerFound = true;
		stage2 = true;

		if (cell.up.type === GOLD) {
			tower = [cur_pos[0] - 1, cur_pos[1]]; // Store location of the tower
			// Encircle tower to gain info about surrounding cells
			// (we need this info because this is where we will build staircase)
			moveset = encircleTower("up");
		}
		if (cell.down.type === GOLD) {
			tower = [cur_pos[0] + 1, cur_pos[1]];
			moveset = encircleTower("down");
		}
		if (cell.right.type === GOLD) {
			tower = [cur_pos[0], cur_pos[1] + 1];
			moveset = encircleTower("right");
		}
		if (cell.left.type === GOLD) {
			tower = [cur_pos[0], cur_pos[1] - 1];
			moveset = encircleTower("left");
		}

		// Set target cells for building staircase on (arranged in circle around tower)
		targets = [[tower[0], tower[1] + 1], [tower[0] + 1, tower[1] + 1],
				   [tower[0] + 1, tower[1]], [tower[0] + 1, tower[1] - 1],
				   [tower[0], tower[1] - 1], [tower[0] - 1, tower[1] - 1]];

		// Create a copy (this will be target list for first level of the staircase)
		cur_targets = targets.slice();
	}


	// STAGE 1: Explore, find tower
	if (!towerFound) {
		// Tower not yet found, explore the map

		if (moveset.length === 0) {
			// Moveset is empty (troll is not in the middle of doing something else)

			// Retrieve the nearest unvisited cell
			var nearest_unvisited = findNearestUnvisitedCell(cur_pos, visited, map);

			// Set moveset to the shortest path to the nearest unvisited cell
			moveset = shortestPathBFS(cur_pos, nearest_unvisited, map);
		}
	}


	// STAGE 2: Build first layer of staircase (layer with height of 1)
	if (stage2 && holdingBlock) {
		// If troll is holding a block, it should drop it at the target location

		if (moveset.length === 0 && cur_targets.length > 0) {
			// There are targets remaining in current layer

			// Retrieve target cell in staircase from current targets list
			var target = cur_targets.shift();

			// Iterate through current targets until we find one that is not a block
			while (target !== undefined && map[target[0]][target[1]][0] === BLOCK) {
				target = cur_targets.shift();
			}

			// If target cell does not have a block, deliver block to target cell
			if (target !== undefined) {
				moveset = shortestPathBFS(cur_pos, target, map);
				moveset.push("drop");
			}
		}
		// Once all targets have blocks, stage 2 is complete
		if (cur_targets.length === 0) {
			stage2 = false;
			stage3 = true;
		}
	}


	// STAGE 2 / STAGE 3: Retrieve a block to add to the staircase
	if (towerFound && !holdingBlock) {
		// If troll is not yet holding a block, it should find one and pick it up

		if (moveset.length === 0) {

			// Find nearest block not being used in staircase
			var nearest_block = findNearestUnusedBlock(cur_pos, map);

			// Find nearest unvisited cell 
			var nearest_unvisited = findNearestUnvisitedCell(cur_pos, visited, map);

			// Retrieve paths to both
			var path_to_block = [];
			var path_to_unvisited = [];
			if (nearest_block !== null) {
				path_to_block = shortestPathBFS(cur_pos, nearest_block, map);
			}
			if (nearest_unvisited !== null) {
				path_to_unvisited = shortestPathBFS(cur_pos, nearest_unvisited, map);
			}

			// Update moveset
			if (nearest_block === null) { // We didn't find a block, we have to explore
				moveset = path_to_unvisited; // Explore
			}
			if (nearest_unvisited === null && nearest_block !== null) {
				// All cells have been visited already
				moveset = path_to_block; // Go to nearest block
				moveset.push("pickup"); // Pick it up
			}
			// If both paths are available, choose the shorter of the two
			// (prioritize finding blocks close to the tower)
			if (nearest_block !== null && nearest_unvisited !== null 
				&& path_to_block.length < path_to_unvisited.length) {
					moveset = path_to_block;
					moveset.push("pickup");
			}
			else if (nearest_block !== null && nearest_unvisited !== null) {
				moveset = path_to_unvisited;
			}
		}
	}


	// STAGE 3: Build intermediate levels of staircase
	if (stage3 && holdingBlock) {
		// If troll is holding a block, it should drop it at target cell in staircase

		if (cur_targets.length === 0) { // We've used up all targets in current layer
			targets.pop(); // Omit a cell in the next layer to create staircase effect
			cur_targets = targets.slice(); // Create copy for next layer of targets
		}
		if (moveset.length === 0 && cur_targets.length > 0) { 
			// There are still targets in the current layer
			var target = cur_targets.shift(); // Retrieve target
			moveset = shortestPathBFS(cur_pos, target, map); // Deliver block to target
			moveset.push("drop");
		}
	}


	// FINAL STEP: Carry block to top of staircase, place under troll to reach treasure
	if (towerFound && targets.length === 0 && holdingBlock) { 
		// No targets left, staircase is done
		// Troll has block, it just needs to carry it to top

		if (moveset.length === 0) {
			var target = [tower[0], tower[1] + 1]; // Top of staircase
			moveset = shortestPathBFS(cur_pos, target, map); // Traverse to top
			moveset.push("drop"); // Drop block under troll
			moveset.push("left"); // Reach treasure
		}
	}


	// Execute next move in moveset
	var move = moveset.shift(); // First element is next move (queue)
	if (move === "up") {
		cur_pos[0] = cur_pos[0] - 1; // Update position accordingly
	}
	if (move === "down") {
		cur_pos[0] = cur_pos[0] + 1;
	}
	if (move === "left") {
		cur_pos[1] = cur_pos[1] - 1;
	}
	if (move === "right") {
		cur_pos[1] = cur_pos[1] + 1;
	}
	if (move === "pickup") {
		holdingBlock = true; // Update bools
	}
	if (move === "drop") {
		holdingBlock = false;
	}
	return move;

}


// HELPER FUNCTIONS


function encircleTower(direction_of_tower) {
	/* Return the moveset to scan vicinity of tower (move in partial circle 
	around tower) depending on where troll starts in relation to tower. */

	if (direction_of_tower === "down") {
		return ["right", "down", "down", "left", "left", "up"];
	}
	if (direction_of_tower === "up") {
		return ["right", "up", "up", "left", "left", "down"];
	}
	if (direction_of_tower === "left") {
		return ["up", "left", "left", "down", "down", "right"];
	}
	if (direction_of_tower === "right") {
		return ["down", "right", "right", "up", "up", "left"];
	}
}


function findNearestUnvisitedCell(start, visit, map) {
	/* Breadth-first-search on map and return 
	coordinates of the nearest unvisited cell. */

    var queue = [start];
    
	// Local visited array for BFS
	var local_visit = new Array(visit.length);
    for (var i = 0; i < local_visit.length; i++) {
        local_visit[i] = new Array(visit[i].length).fill(false);
    }
    local_visit[start[0]][start[1]] = true;
    
	// BFS
    while (queue.length > 0) {

        var current = queue.shift();

        if (visit[current[0]][current[1]] === false) { 
			// Current cell is not visited
            return current;
        }
		
        var neighbors = getNeighbors(current, map); // Retrieve valid neighbors

		// Add valid neighbors to the queue if not visited
        for (var i = 0; i < neighbors.length; i++) {
            var neighbor = neighbors[i];
            if (!local_visit[neighbor[0]][neighbor[1]]) { 
				local_visit[neighbor[0]][neighbor[1]] = true;
				queue.push(neighbor);
            }
        }
    }
    return null;
}


function findNearestUnusedBlock(start, map) {
	/* BFS on map and return coordinates of the nearest unused block,
	(block that is not already in staircase). */

    var queue = [start];
    
	// Local visited array for BFS
	var local_visit = new Array(map.length);
    for (var i = 0; i < local_visit.length; i++) {
        local_visit[i] = new Array(map[i].length).fill(false);
    }
    local_visit[start[0]][start[1]] = true;

	// Blocks in these cells are already being used for the staircase
	var tower_vicinity = [[tower[0], tower[1]], [tower[0], tower[1] + 1],
						  [tower[0] + 1, tower[1] + 1], [tower[0] + 1, tower[1]],
						  [tower[0] + 1, tower[1] - 1], [tower[0], tower[1] - 1],
						  [tower[0] - 1, tower[1] - 1]];

	// BFS
    while (queue.length > 0) {
        var current = queue.shift();
        var x = current[0];
        var y = current[1];

		// Return coords if block is not already being used
        if (map[x][y][0] === BLOCK && 
			!tower_vicinity.some(coord => coord[0] === x && coord[1] === y)) {

            return current;
        }
		
		// Retrieve neighbors of current cell
        var neighbors = getNeighbors(current, map);

		// Add valid neighbors to queue
        for (var i = 0; i < neighbors.length; i++) {
            var neighbor = neighbors[i];

            if (!local_visit[neighbor[0]][neighbor[1]]) {
				local_visit[neighbor[0]][neighbor[1]] = true;
				queue.push(neighbors[i]);
            }
        }
    }
    return null;
}


function shortestPathBFS(start, end, grid) {
    /* BFS on grid and return the shortest path from start to end
	in sequence of steps in order from left to right,
	eg. ["right", "right", "down"]. */
    
	var queue = [start];

	// Local visited array for BFS
    var local_visit = new Array(grid.length);
    for (var i = 0; i < local_visit.length; i++) {
        local_visit[i] = new Array(grid[i].length).fill(false);
    }
    local_visit[start[0]][start[1]] = true;
  
	// BFS
    while (queue.length > 0) {
        var current = queue.shift();
  
        if (current[0] === end[0] && current[1] === end[1]) {
            // Reconstruct path from goal to start by following parent pointers
            var path = [];
            while (current.parent) {
                path.unshift(current.action); // Action taken to get to current
                current = current.parent; // Retrieve cell we came from
            }
            return path;
        }

        var neighbors = getNeighbors(current, grid);

		// Add valid neighbors to queue
        for (var i = 0; i < neighbors.length; i++) {
            var neighbor = neighbors[i];
            if (!local_visit[neighbor[0]][neighbor[1]]) {
                local_visit[neighbor[0]][neighbor[1]] = true;
                neighbor.parent = current; // Parent of neighbor is current cell
                neighbor.action = getAction(current, neighbor); // Store action
                queue.push(neighbor);
            }
        }
    }
    // No path was found
    return [];
}


function getNeighbors(cell, grid) {
	/* Retrieve the traversable neighbors of current cell,
	ie. cells that are not walls and have a height difference not 
	greater than 1 from the current cell. */

	var cur_height = grid[cell[0]][cell[1]][1];
    var i = cell[0];
    var j = cell[1];
    var neighbors = [];

    if (i > 0 && grid[i - 1][j][0] !== WALL 
		&& Math.abs(cur_height - grid[i - 1][j][1]) <= 1) {
		neighbors.push([i - 1, j]); // Up
    }
    if (j > 0 && grid[i][j - 1][0] !== WALL 
		&& Math.abs(cur_height - grid[i][j - 1][1]) <= 1) {
        neighbors.push([i, j - 1]); // Left
    }
    if (i < grid.length-1 && grid[i + 1][j][0] !== WALL 
		&& Math.abs(cur_height - grid[i + 1][j][1]) <= 1) {
        neighbors.push([i + 1, j]); // Down
    }
    if (j < grid[i].length - 1 && grid[i][j + 1][0] !== WALL 
		&& Math.abs(cur_height - grid[i][j + 1][1]) <= 1) {
        neighbors.push([i, j + 1]); // Right
    }
    return neighbors;
}

  
function getAction(cell1, cell2) {
    /* Return the action that takes us from cell1 to cell2. */

    if (cell2[0] < cell1[0]) {
        return "up";
    } else if (cell2[0] > cell1[0]) {
        return "down";
    } else if (cell2[1] < cell1[1]) {
        return "left";
    } else if (cell2[1] > cell1[1]) {
        return "right";
    } else { // Cells are the same
        return;
    }


}
}
