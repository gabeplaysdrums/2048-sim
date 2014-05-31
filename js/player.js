function Player(name)
{
    this.name = function() {
        return name;
    };

    this.chooseMove = function(state) {
        throw "not implemented";
    };

    this.reset = function() { };
}

function RandomPlayer()
{
    Player.call(this, "random");

    this.chooseMove = function(state) {

        var moves = [];
        var validMoves = state.validMoves();

        for (dir in validMoves)
        {
            if (validMoves[dir])
            {
                moves.push(dir);
            }
        }

        if (moves.length > 0)
        {
            return moves[Math.floor(Math.random() * moves.length)];
        }

        return null;

    };
}

function PrecedencePlayer()
{
    Player.call(this, "precedence");

    var dirs = [
        Direction.Down,
        Direction.Left,
        Direction.Right,
        Direction.Up,
    ];

    this.chooseMove = function(state) {

        var validMoves = state.validMoves();

        for (var i=0; i < dirs.length; i++)
        {
            var dir = dirs[i];

            if (validMoves[dir])
            {
                return dir;
            }
        }

        return null;

    };
}

function SnakePlayer()
{
    Player.call(this, "snake");

    var self = this;
    var precedence = PrecedencePlayer();

    var dirs = [
        Direction.Down,
        Direction.Left,
        Direction.Right,
        Direction.Up,
    ];

    var weights = [
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [40, 30, 20, 10],
        [100, 200, 300, 400],
    ];

    this.chooseMove = function(state) {

        var validMoves = state.validMoves();
        var outcomes = [];

        function score(state_)
        {
            var sum = 0;

            state_.each(function(i, j, value) {
                sum += weights[i][j] * value + 100 * value / state_.nearestMatch(i, j).distance;
            });

            return sum;
        }

        for (var i=0; i < dirs.length; i++)
        {
            var dir = dirs[i];

            if (validMoves[dir])
            {
                var engine = new GameEngine(null, state.grid(), false);
                engine.applyMove(dir, false);
                outcomes.push({
                    "dir": dir,
                    "score": score(engine.state()),
                });
            }
        }

        if (outcomes.length > 0)
        {
            outcomes.sort(function(a, b) { return b.score - a.score; });
            return outcomes[0].dir;
        }

        return precedence.chooseMove(state);

    };
}

function SumHunterPlayer()
{
    Player.call(this, "sum-hunter");

    var self = this;

    var dirs = [
        Direction.Down,
        Direction.Left,
        Direction.Right,
    ];

    this.chooseMove = function(state) {

        var outcomes = [];
        var validMoves = state.validMoves();
        var engine = new GameEngine(null, state.grid());

        for (var i=0; i < dirs.length; i++)
        {
            var dir = dirs[i];

            if (validMoves[dir])
            {
                engine.reset();
                engine.applyMove(dir, false);
                outcomes.push({ "dir": dir, "sum": engine.state().weightedSumValues() });
            }
        }

        if (outcomes.length > 0)
        {
            outcomes.sort(function(a, b) { return b.sum - a.sum; });
            return outcomes[0].dir;
        }

        if (validMoves[Direction.Up])
        {
            return Direction.Up;
        }

        return null;

    };
}

function PrimaryDirectionPlayer()
{
    Player.call(this, "primary");

    var self = this;

    var primary;
    var resetSequence;

    var primaryDirs = [
        Direction.Down,
        Direction.Left,
    ];

    this.reset = function() {
        primary = Direction.Down;
        resetSequence = [];
    };

    this.chooseMove = function(state) {

        var validMoves = state.validMoves();

        function getResetSequenceDir()
        {
            while (resetSequence.length > 0)
            {
                var dir = resetSequence.shift();
                
                if (validMoves[dir])
                {
                    return dir;
                }
            }

            return null;
        }

        // do reset sequence
        var dir = getResetSequenceDir();

        if (dir)
        {
            return dir;
        }

        if (validMoves[primary])
        {
            return primary;
        }

        for (var i=0; i < primaryDirs.length; i++)
        {
            var dir = primaryDirs[i];
            primary = dir;

            if (validMoves[dir])
            {
                return primary;
            }
        }

        primary = Direction.Down;

        resetSequence = [
            Direction.Right,
            Direction.Down,
            Direction.Left,
        ];

        // do reset sequence
        var dir = getResetSequenceDir();

        if (dir)
        {
            return dir;
        }

        if (validMoves[Direction.Up])
        {
            return Direction.Up;
        }

        return null;

    };

    // ctor
    {
        self.reset();
    }
}

function shuffle(o)
{
    for(var j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
    return o;
}

function copyArray(x)
{
    var temp = [];

    for (var i=0; i < x.length; i++)
    {
        temp.push(x[i]);
    }

    return temp;
}

function GeneticPlayer(genes)
{
    Player.call(this, "genetic");

    var self = this;

    var dirs = [];

    var gridWeights = [
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
    ];

    var distWeights = [];

    var player = new RandomPlayer();

    this.chooseMove = function(state) {
        return player.chooseMove(state);
    };

    this.genes = function() {
        return genes;
    };

    function loadGenes(genes)
    {
        var g = 0;

        for (var i=0; i < DIRECTIONS.length; i++)
        {
            var index = genes[g]; g++;

            if (0 <= index && index < DIRECTIONS.length)
            {
                dirs.push(DIRECTIONS[index]);
            }
            else
            {
                throw "could not parse direction in genome";
            }
        }

        for (var i=0; i < GRID_SIZE; i++)
        {
            for (var j=0; j < GRID_SIZE; j++)
            {
                var w = genes[g]; g++;
                gridWeights[i][j] = w;
            }
        }

        for (var i=0; i < MAX_POW; i++)
        {
            var w = genes[g]; g++;
            distWeights.push(w);
        }
    }

    function randomGenes()
    {
        var genes = [];

        var dirIndexes = shuffle([ 0, 1, 2, 3 ]);

        while (dirIndexes.length > 0)
        {
            genes.push(dirIndexes[0]);
            dirIndexes.shift();
        }

        for (var i=0; i < GRID_SIZE; i++)
        {
            for (var j=0; j < GRID_SIZE; j++)
            {
                var w = 100 * Math.random();
                genes.push(w);
            }
        }

        for (var i=0; i < MAX_POW; i++)
        {
            var w = 100 * Math.random();
            genes.push(w);
        }

        return genes;
    }

    // ctor
    {
        if (genes === undefined)
        {
            genes = randomGenes();
        }

        loadGenes(genes);
    }
}
