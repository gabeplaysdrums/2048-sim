function encodeGenome(genes)
{
    return btoa(btoa(JSON.stringify(genes)));
}

function decodeGenome(genomeString)
{
    return JSON.parse(atob(atob(genomeString)));
}

function chooseFittest(population, n)
{
    if (n === undefined)
    {
        n = population.length;
    }

    population.sort(function(a, b) { return b.fitness - a.fitness; });

    var sum = 0;

    for (var i=0; i < n; i++)
    {
        sum += population[i].fitness;
    }

    var roulette = Math.random() * sum;
    sum = 0;

    for (var i=0; i < n; i++)
    {
        sum += population[i].fitness;

        if (roulette < sum)
        {
            return population[i];
        }
    }

    throw "unexpected";
}
