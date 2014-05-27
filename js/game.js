var Direction = {
  "Up": "up",
  "Down": "down",
  "Left": "left",
  "Right": "right",
};

var MIN_POW = 1;      // 2^1 = 2
var MAX_POW = 13;     // 2^13 = 8192
var GRID_SIZE = 4;

function GameState(grid)
{
    var self = this;

    this.grid = function() {

        var gridCopy = [
            [0, 0, 0, 0],
            [0, 0, 0, 0],
            [0, 0, 0, 0],
            [0, 0, 0, 0],
        ];

        for (var i=0; i < GRID_SIZE; i++)
        {
            for (var j=0; j < GRID_SIZE; j++)
            {
                gridCopy[i][j] = grid[i][j];
            }
        }

        return gridCopy;
    };

    this.isBlank = function(i, j) {
        return grid[i][j] === 0;
    };

    this.value = function(i, j) {
        return self.isBlank(i, j) ? 0 : Math.pow(2, grid[i][j]);
    };

    this.each = function(callback) {

        for (var i=0; i < GRID_SIZE; i++)
        {
            for (var j=0; j < GRID_SIZE; j++)
            {
                if (callback(i, j, self.value(i, j)) === false)
                {
                    break;
                }
            }
        }
    };

    this.maxValue = function() {

        var maxValue = 0;

        self.each(function(i, j, value) {
            maxValue = Math.max(maxValue, value);
        });

        return maxValue;
    };

    this.sumValues = function() {
        
        var sum = 0;

        self.each(function(i, j, value) {
            sum += value;
        });

        return sum;
    };

    this.weightedSumValues = function() {

        var sum = 0;

        for (var i=0; i < GRID_SIZE; i++)
        {
            for (var j=0; j < GRID_SIZE; j++)
            {
                sum += grid[i][j] * self.value(i, j);
            }
        }

        return sum;

    };

    this.tiles = function() {

        var tiles = [];

        self.each(function(i, j, value) {
            if (value !== 0)
            {
                tiles.push([i, j, value]);
            }
        });

        return tiles;
    };

    this.blanks = function() {

        var blanks = [];

        self.each(function(i, j, value) {
            if (value === 0)
            {
                blanks.push([i, j]);
            }
        });

        return blanks;
    };

    this.canMoveTo = function(value, i, j) {
        return (
            i >= 0 && i < GRID_SIZE && 
            j >= 0 && j < GRID_SIZE && 
            (self.isBlank(i, j) || self.value(i, j) === value)
        );
    };

    this.validMoves = function() {

        var moves = {};
        moves[Direction.Up] = false;
        moves[Direction.Down] = false;
        moves[Direction.Left] = false;
        moves[Direction.Right] = false;

        self.each(function(i, j, value) {
            if (value === 0)
            {
                // continue
                return true;
            }

            if (i > 0 && self.canMoveTo(value, i - 1, j))
            {
                moves[Direction.Up] = true;
            }

            if (i < GRID_SIZE - 1 && self.canMoveTo(value, i + 1, j))
            {
                moves[Direction.Down] = true;
            }

            if (j > 0 && self.canMoveTo(value, i, j - 1))
            {
                moves[Direction.Left] = true;
            }

            if (j < GRID_SIZE - 1 && self.canMoveTo(value, i, j + 1))
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

        return moves;
    };

    this.validMoveCount = function() {

        var count = 0;
        var validMoves = self.validMoves();

        for (k in Direction)
        {
            if (validMoves[Direction[k]])
            {
                count++;
            }
        }

        return count;
    };

    this.completed = function() {
        return self.validMoveCount() === 0;
    };

    this.nearestMatch = function(i, j) {

        var match = null;
        var matchDist = GRID_SIZE * GRID_SIZE;
        var value = self.value(i, j);
        
        function d(i, j, di, dj)
        {
            return Math.abs(i - di) + Math.abs(j - dj);
        }

        if (value !== 0)
        {
            self.each(function(di, dj, dvalue) {

                if (i === di && j === dj)
                {
                    return true;
                }
    
                if (value === dvalue)
                {
                    var dist = d(i, j, di, dj);
    
                    if (dist < matchDist)
                    {
                        match = [di, dj];
                        matchDist = dist;
                    }
                }
            });
        }

        return {
            "location": match,
            "distance": matchDist,
        };

    };

    this.highest = function() {

        var set = {};
        
        self.each(function(i, j, value) {

            if (!set[value])
            {
                set[value] = true;
            }

        });

        var list = [];

        for (var k in set)
        {
            list.push(parseInt(k));
        }

        list.sort(function(a, b) { return b - a; });

        return list;
    };
}

function GameEngine(label, initialGrid, render)
{
    var self = this;

    if (render === undefined)
    {
        render = true;
    }

    var grid = [
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
    ];
    var state = new GameState(grid);
    var moveCount;
    var $game;

    function setCell(i, j, pow)
    {
        grid[i][j] = pow;

        if (render)
        {
            var $cell = $game.find("tr:eq(" + i + ") td:eq(" + j + ")");
    
            for (var pow = MIN_POW; pow <= MAX_POW; pow++)
            {
                $cell.removeClass("v-" + Math.pow(2, pow))
            }
    
            $cell.addClass("v-" + self.state().value(i, j));
            return $cell;
        }

        return null;
    }

    function addRandom()
    {
        // find blank locations
        var locations = state.blanks();

        if (locations.length === 0)
        {
            return;
        }

        // choose one of those locations at random
        var loc = locations[Math.floor(Math.random() * locations.length)];

        // choose a new value at random
        var pow = (Math.random() < 0.95) ? 1 : 2;

        // set the value
        var $cell = setCell(loc[0], loc[1], pow);

        if (render)
        {
            $cell.addClass("new");
        }
    }

    function updateStats()
    {
        if (render)
        {
            $game.find(".stats .move-count").text(self.moveCount());
            $game.find(".stats .max-value").text(state.maxValue());
            $game.find(".stats .sum-values").text(state.sumValues());
            $game.find(".stats .score").text(self.score().toFixed(3));
        }
    }

    function clearNew()
    {
        if (render)
        {
            $game.find("td").removeClass("new");
        }
    }

    this.moveCount = function() {
        return moveCount;
    };
    
    this.score = function() {
        return (moveCount > 0) ? self.state().sumValues() / moveCount + state.maxValue() : 0;
    };

    this.elem = function() {
        return $game;
    };

    this.applyMove = function(dir, addNew) {

        if (addNew === undefined)
        {
            addNew = true;
        }

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
            var value = state.value(i, j);

            if (pow === 0)
            {
                return;
            }

            var di = i + delta[0];
            var dj = j + delta[1];

            if (state.canMoveTo(value, di, dj))
            {
                if (grid[di][dj] === 0)
                {
                    setCell(di, dj, pow);
                }
                else if (!combo[i][j] && !combo[di][dj])
                {
                    setCell(di, dj, pow + 1);
                    combo[i][j] = true;
                }
                else
                {
                    return;
                }

                combo[di][dj] = combo[i][j];
                setCell(i, j, 0);
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
                for (var i = 0; i < GRID_SIZE; i++)
                {
                    for (var j=0; j < GRID_SIZE; j++)
                    {
                        move(i, j);
                    }
                }
            }
        }
        while (!done);

        if (render)
        {
            $.each([ Direction.Up, Direction.Down, Direction.Left, Direction.Right], function(i, dir) {
                $game.removeClass("move-" + dir);
            });
            $game.addClass("move-" + dir);
        }

        if (addNew)
        {
            clearNew();
            addRandom();
        }

        moveCount++;
        updateStats();

        return true;
    };

    this.state = function() {
        return state;
    };

    this.reset = function() {

        for (var i=0; i < GRID_SIZE; i++)
        {
            for (var j=0; j < GRID_SIZE; j++)
            {
                setCell(i, j, initialGrid ? initialGrid[i][j] : 0);
            }
        }

        moveCount = 0;

        if (!initialGrid)
        {
            clearNew();
            addRandom();
            addRandom();
        }

        updateStats();
    };

    // ctor
    {
        if (render)
        {
            var $container = $("<div />").html($("#game-template").render());
            $game = $container.children().first();
            $game.prop("engine", self);
            $game.find(".stats .label").text(label);
        }

        self.reset();
    }
}
