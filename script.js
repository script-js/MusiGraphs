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
            "backgroundColor": "#232423",
            "fontName": "Roboto Slab",
            "titleTextStyle": {
                "color": "white"
            }
        });
        google.visualization.events.addListener(chart, 'select', selectHandler);
    } else {
        alert("Google Charts failed to load.")
    }
}

function selectHandler() {
    var selectedItem = chart.getSelection()[0];
    if (selectedItem) {
      var value = data.getValue(selectedItem.row, selectedItem.column);
      alert('The user selected ' + value);
    }
  }

function getTop5(group, title, container) {
    var sortedArray = Object.entries(group)
        .sort((a, b) => b[1] - a[1])
        .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});
    var list = document.createElement("ol")
    //stats.innerHTML = "<h2><u>Top " + title + "</u></h2>"
    Object.keys(sortedArray).forEach(function (k, i) {
        if (i < 6) {
            var skill = document.createElement("li")
            skill.innerHTML = k;
            list.appendChild(skill)
        }
    })
    container.appendChild(list)
}