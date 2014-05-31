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
    var self = this;

    var dirs = [];

    var gridWeights = [
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
    ];

    var distWeights = {};

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
            var value = Math.pow(2, i + 1);
            distWeights[value] = w;
        }
    }

    function randomWeight()
    {
        return 500 * Math.random();
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
                genes.push(randomWeight());
            }
        }

        for (var i=0; i < MAX_POW; i++)
        {
            genes.push(randomWeight());
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

    function hashCode(str)
    {
        var hash = 0;

        if (str.length == 0)
        {
            return hash;
        }

        for (var i = 0; i < str.length; i++)
        {
            char = str.charCodeAt(i);
            hash = ((hash<<5)-hash)+char;
            hash = hash & hash; // Convert to 32bit integer
        }

        if (hash < 0)
        {
    	    hash = 0xFFFFFFFF + hash + 1;
        }

        return hash;
    }

    Player.call(this, "genetic [" + hashCode(encodeGenome(genes)).toString(32) + "]");

    this.chooseMove = function(state) {

        var validMoves = state.validMoves();
        var outcomes = [];

        function score(state_)
        {
            var sum = 0;

            state_.each(function(i, j, value) {
                sum += gridWeights[i][j] * value + distWeights[value] * value / state_.nearestMatch(i, j).distance;
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

        return null;
    };

    this.genes = function() {
        return genes;
    };

    this.mate = function(player, crossoverRate, mutationRate) {

        if (crossoverRate === undefined)
        {
            crossoverRate = 1;
        }

        if (mutationRate === undefined)
        {
            mutationRate = 0;
        }

        var playerGenes = player.genes();

        var offset = DIRECTIONS.length;
        var index = offset;

        if (Math.random() < crossoverRate)
        {
            index += Math.floor(Math.random() * (playerGenes.length - offset));
        }

        var childGenes = [
            copyArray(playerGenes),
            copyArray(self.genes()),
        ];
        
        for (var k=0; k < childGenes.length; k++)
        {
            for (var i=index; i < childGenes[k].length; i++)
            {
                childGenes[k][i] = playerGenes[i];
            }
    
            for (var i=offset; i < childGenes[k].length; i++)
            {
                if (Math.random() < mutationRate)
                {
                    childGenes[k][i] = randomWeight();
                }
            }
        }

        var children = [];

        for (var i=0; i < childGenes.length; i++)
        {
            children.push(new GeneticPlayer(childGenes[i]));
        }

        return children;
    };

    self.inspect = function() {
        return {
            "dirs": dirs,
            "gridWeights": gridWeights,
            "distWeights": distWeights,
        };
    };
}

var SNAKE_GENES = [
    1, 2, 3, 0,   // directions
    0, 0, 0, 0,   // grid weights
    0, 0, 0, 0,   
    40, 30, 20, 10,
    100, 200, 300, 400,
    100, 100, 100, 100, 100, 100,   // distance weights, 2-64
    100, 100, 100, 100, 100, 100,   // 128 - 4096
    100,                            // 8192
];
