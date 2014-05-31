function encodeGenome(genes)
{
    return btoa(JSON.stringify(genes));
}

function decodeGenome(genomeString)
{
    return JSON.parse(atob(genomeString));
}
