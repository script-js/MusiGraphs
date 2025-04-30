var artistCounts = {}
var genreCounts = {}
var genreArtists = {}
var totalTracks = 0;

var accessToken = localStorage.getItem("accessToken")

function getList(list) {
    return new Promise(async function (resolve) {
        var response = await fetch('https://api.spotify.com/v1/playlists/' + list, {
            headers: {
                Authorization: 'Bearer ' + accessToken
            }
        });
        var data = await response.json();
        if (data.error) {
            if (data.error.message == "The access token expired") {
                spotifyAuth()
            } else {
                alert("Error getting playlist: " + data.error.message)
            }
        } else {
            totalTracks = data.tracks.items.length
            data.tracks.items.forEach(function (k) {
                k.track.artists.forEach(async function (artist) {
                    var name = artist.name
                    if (!artistCounts[name]) {
                        artistCounts[name] = 1
                    } else {
                        artistCounts[name]++
                    }
                    var artistData = await (await fetch(artist.href, {
                        headers: {
                            Authorization: 'Bearer ' + accessToken
                        }
                    })).json();
                    artistData.genres.forEach(function (g) {
                        if (!genreCounts[g]) {
                            genreCounts[g] = 1
                        } else {
                            genreCounts[g]++
                        }
                        if (!genreArtists[g]) {
                            genreArtists[g] = [name];
                        } else if (!genreArtists[g].includes(name)) {
                            genreArtists[g].push(name);
                        }
                    })
                })
            });
            if (data.tracks.next) {
                await getPage(data.tracks.next, playlists.length - 1)
            }
            resolve()
        }
    })
}

async function getPage(url, index) {
    return new Promise(async function (resolve) {
        var response = await fetch(url, {
            headers: {
                Authorization: 'Bearer ' + accessToken
            }
        });
        var data = await response.json();
        if (data.error) {
            if (data.error.message == "The access token expired") {
                spotifyAuth()
            } else {
                alert("Error getting playlist: " + data.error.message)
            }
        } else {
            console.log(data)
            totalTracks += data.items.length
            data.tracks.items.forEach(function (k) {
                k.track.artists.forEach(async function (artist) {
                    var name = artist.name
                    if (!artistCounts[name]) {
                        artistCounts[name] = 1
                    } else {
                        artistCounts[name]++
                    }
                    var artistData = await (await fetch(artist.url, {
                        headers: {
                            Authorization: 'Bearer ' + accessToken
                        }
                    })).json();
                    artistData.genres.forEach(function (g) {
                        if (!genreCounts[g]) {
                            genreCounts[g] = 1;
                        } else {
                            genreCounts[g]++;
                        }
                        if (!genreArtists[g]) {
                            genreArtists[g] = [name];
                        } else if (!genreArtists[g].includes(name)) {
                            genreArtists[g].push(name);
                        }
                    })
                })
            });
            if (data.next) {
                await getPage(data.next, playlists.length - 1)
            }
            resolve()
        }
    })
}

function getPercentage(name, group) {
    return ((group[name] / totalTracks) * 100) + "%"
}

function createChart(group, title, container) {
    var dataset = [["Artist", "Amount of Songs"]];
    Object.keys(group).forEach(function (k) {
        dataset.push([k, group[k]])
    })
    if (google.visualization) {
        var table = google.visualization.arrayToDataTable(dataset)
        var chart = new google.visualization.PieChart(container);
        chart.draw(table, {
            title,
            "legend": "none",
            "chartArea": {
                "backgoundColor": "red"
            },
            "backgroundColor": "inherit",
            "fontName": "Roboto Slab"
        });
    } else {
        alert("Google Charts failed to load.")
    }
}