var Direction = {
  "Up": "up",
  "Down": "down",
  "Left": "left",
  "Right": "right",
};

function GameEngine(label)
{
    var self = this;

    var $game = null;
    var grid = [
        [ 0, 0, 0, 0],
        [ 0, 0, 0, 0],
        [ 0, 0, 0, 0],
        [ 0, 0, 0, 0],
    ];
    var moveCount = 0;
    var maxValue = 0;
    var state = null;

    var MIN_POW = 1;      // 2^1 = 2
    var MAX_POW = 11;     // 2^11 = 2048
    var GRID_SIZE = 4;

    function setCellValue(i, j, pow)
    {
        grid[i][j] = pow;
        var $cell = $game.find("tr:eq(" + i + ") td:eq(" + j + ")");

        for (var pow = MIN_POW; pow <= MAX_POW; pow++)
        {
            $cell.removeClass("v-" + Math.pow(2, pow))
        }

        $cell.addClass("v-" + self.state().value(i, j));
        maxValue = Math.max(maxValue, self.state().value(i, j));
    }

    function addRandom()
    {
        // find all locations that don't have a pow
        var locations = [];

        $.each(grid, function(i, row) {
            $.each(row, function(j, pow) {

                if (pow == 0)
                {
                    locations.push([ i, j ]);
                }

            });
        });

        // choose one of those locations at random
        var loc = locations[Math.floor(Math.random() * locations.length)];

        // choose a new value at random
        var pow = (Math.random() < 0.95) ? 1 : 2;

        // set the value
        setCellValue(loc[0], loc[1], pow);
    }

    function canMoveTo(pow, i, j)
    {
        return (
            i >= 0 && i < GRID_SIZE && 
            j >= 0 && j < GRID_SIZE && 
            (grid[i][j] === 0 || grid[i][j] === pow)
        );
    }

    function GameState()
    {
        this.value = function (i, j) {
            return Math.pow(2, grid[i][j]);
        };
    
        this.validMoves = function() {
            var moves = {};
            moves[Direction.Up] = false;
            moves[Direction.Down] = false;
            moves[Direction.Left] = false;
            moves[Direction.Right] = false;
    
            $.each(grid, function(i, row) {
                $.each(row, function(j, pow) {
    
                    if (pow === 0)
                    {
                        // continue
                        return true;
                    }
    
                    if (pow === MAX_POW)
                    {
                        moves[Direction.Up] = false;
                        moves[Direction.Down] = false;
                        moves[Direction.Left] = false;
                        moves[Direction.Right] = false;
                        return false;
                    }
    
                    if (i > 0 && canMoveTo(pow, i - 1, j))
                    {
                        moves[Direction.Up] = true;
                    }
    
                    if (i < GRID_SIZE - 1 && canMoveTo(pow, i + 1, j))
                    {
                        moves[Direction.Down] = true;
                    }
    
                    if (j > 0 && canMoveTo(pow, i, j - 1))
                    {
                        moves[Direction.Left] = true;
                    }
    
                    if (j < GRID_SIZE - 1 && canMoveTo(pow, i, j + 1))
                    {
                        moves[Direction.Right] = true;
                    }
    
                    if (moves[Direction.Up] && 
                        moves[Direction.Down] && 
                        moves[Direction.Left] && 
                        moves[Direction.Right])
                    {
                        // break
                        return false;
                    }
    
                });
            });
    
            return moves;
        };
    
        this.maxValue = function() {
            return maxValue;
        };
    
        this.sumValues = function() {
            var sum = 0;
    
            $.each(grid, function(i, row) {
                $.each(row, function(j, pow) {
    
                    if (pow === 0)
                    {
                        // continue
                        return true;
                    }
    
                    sum += Math.pow(2, pow);
    
                });
            });
    
            return sum;
        };

        this.moveCount = function() {
            return moveCount;
        };
    
        this.score = function() {
            return (moveCount > 0) ? self.state().sumValues() / moveCount + maxValue : 0;
        };
    }

    this.elem = function() {
        return $game;
    };

    this.applyMove = function(dir) {

        if (!self.state().validMoves()[dir])
        {
            return false;
        }

        var delta = (function(dir) {

            if (dir == Direction.Up)
                return [ -1, 0 ];
            else if (dir == Direction.Down)
                return [ 1, 0 ];
            else if (dir == Direction.Left)
                return [ 0, -1 ];
            else if (dir == Direction.Right)
                return [ 0, 1 ];
            else
                throw "invalid direction";

        })(dir);

        var combo = [
            [false, false, false, false],
            [false, false, false, false],
            [false, false, false, false],
            [false, false, false, false],
        ];

        var done;

        function move(i, j)
        {
            var pow = grid[i][j];

            if (pow === 0)
            {
                return;
            }

            var di = i + delta[0];
            var dj = j + delta[1];

            if (canMoveTo(pow, di, dj))
            {
                if (grid[di][dj] === 0)
                {
                    setCellValue(di, dj, pow);
                }
                else if (!combo[i][j] && !combo[di][dj])
                {
                    setCellValue(di, dj, pow + 1);
                    combo[i][j] = true;
                }
                else
                {
                    return;
                }

                combo[di][dj] = combo[i][j];
                setCellValue(i, j, 0);
                combo[i][j] = false;

                done = false;
            }
        }

        do
        {
            done = true;

            if (dir === Direction.Right)
            {
                for (var j = GRID_SIZE - 1; j >= 0; j--)
                {
                    for (var i=0; i < GRID_SIZE; i++)
                    {
                        move(i, j);
                    }
                }
            }
            else if (dir === Direction.Left)
            {
                for (var j = 0; j < GRID_SIZE; j++)
                {
                    for (var i=0; i < GRID_SIZE; i++)
                    {
                        move(i, j);
                    }
                }
            }
            else if (dir === Direction.Down)
            {
                for (var i = GRID_SIZE - 1; i >= 0; i--)
                {
                    for (var j=0; j < GRID_SIZE; j++)
                    {
                        move(i, j);
                    }
                }
            }
            else if (dir === Direction.Up)
            {
                for (var i = 0; i < GRID_SIZE - 1; i++)
                {
                    for (var j=0; j < GRID_SIZE; j++)
                    {
                        move(i, j);
                    }
                }
            }
        }
        while (!done);

        $.each([ Direction.Up, Direction.Down, Direction.Left, Direction.Right], function(i, dir) {
            $game.removeClass("move-" + dir);
        });
        $game.addClass("move-" + dir);

        addRandom();
        moveCount++;

        $game.find(".stats .move-count").text(self.state().moveCount());
        $game.find(".stats .max-value").text(self.state().maxValue());
        $game.find(".stats .sum-values").text(self.state().sumValues());
        $game.find(".stats .score").text(self.state().score().toFixed(3));

        return true;
    };

    this.state = function() {
        return state;
    };

    // ctor
    {
        var $container = $("<div />").html($("#game-template").render());
        $game = $container.children().first();
        $game.prop("engine", self);

        $game.find(".stats .label").text(label);

        state = new GameState();

        // add initial cells
        addRandom();
        addRandom();
    }
}
