function StatsCollection()
{
    var self = this;
    var data = [];

    this.addData = function(score) {
        data.push(score);
        data.sort(function(a, b) { return a - b; });
    }

    this.min = function() {
        return (data.length > 0) ? data[0] : null;
    };

    this.max = function(n) {

        if (n === undefined)
        {
            n = data.length;
        }

        return (n > 0) ? data[n - 1] : null;
    };

    this.median = function(n) {

        if (n === undefined)
        {
            n = data.length;
        }

        if (n === 0)
        {
            return null;
        }

        var i = Math.floor(n / 2);

        if (n % 2 === 0)
        {
            return (data[i] + data[i + 1]) / 2;
        }

        return data[i];
    };

    this.mean = function(n) {

        if (n === undefined)
        {
            n = data.length;
        }

        var sum = 0;

        for (var i=0; i < n; i++)
        {
            sum += data[i];
        }

        return sum / data.length;
    };

    this.count = function() {
        return data.length;
    };
}
