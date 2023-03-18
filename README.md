# Troll Challenge Solution
A solution to the treasure troll challenge. See solution.js for solution.

Problem statement:

Summary: Your job is to write the brain of a treasure troll. This troll will start on a randomly generated map with scattered obstacles and stackable blocks. Somewhere on the field, there is a tower, atop which rests a golden treasure. To attain this treasure, your troll must stack blocks and build a staircase. The object is to write a clean and understandable solution that finds the treasure in as few moves as possible.

You can learn the game mechanics with the testing engine (use the arrow keys). The testing engine will automatically pull the file solution.js for automated testing purposes. This will be very helpful later on.

To defeat the challenge you must implement the Stacker class. The Stacker class only has one required method, turn. The simulator will call your turn method once each turn, passing in the JSON object currentCell, containing information about the current cell your treasure troll is on, and the four surrounding cells. Example Stacker Class

			cell = {
				left: {type: someValue, level: someValue},
				up: {type: someValue, level: someValue},
				right: {type: someValue, level: someValue},
				down: {type: someValue, level: someValue},
				type: someValue,
				level: someValue
			}
		
There are three types of tiles on the map. All are traversable except walls.

0 (empty)
1 (wall)
2 (block)
3 (gold)
All tiles also have an associated non-negative integer level (elevation off the ground). Empty cells are always at ground zero. Your troll can only move up or down by one level at a time.

Your turn method must then return a string representing one of six possible actions.

"left"
"up"
"right"
"down"
"pickup"
"drop"
The simulator will only count a turn if the action you specified was legal. So if you try to pickup a non-existent block, it simply won't do anything.

Solution in solution.js
