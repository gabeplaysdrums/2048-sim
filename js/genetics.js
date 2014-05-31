function encodeGenome(genes)
{
    return btoa(btoa(JSON.stringify(genes)));
}

function decodeGenome(genomeString)
{
    return JSON.parse(atob(atob(genomeString)));
}
