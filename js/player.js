function Player(name)
{
    this.name = function() {
        return name;
    };

    this.chooseMove = function(state) {
        throw "not implemented";
    };
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

function PrimaryDirectionPlayer()
{
    Player.call(this, "primary");

    var primary = Direction.Down;

    var primaryDirs = [
        Direction.Down,
        Direction.Left,
    ];

    var resetSequence = [];

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
}
