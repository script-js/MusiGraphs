var artistCounts = {}
var genreCounts = {}
var genreArtists = {}
var artistSongs = {};
var totalTracks = 0;

var accessToken = localStorage.getItem("accessToken")

async function getList(list) {
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
                if (!artistSongs[name]) {
                    artistSongs[name] = []
                }
                artistSongs[name].push({
                    url: k.track.external_urls.spotify,
                    icon: k.track.album.images[0].url,
                    title: k.track.name,
                    artists: k.track.artists.map((x) => x.name).toString().replaceAll(",", ", ")
                })
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
                        genreArtists[g].push({
                            url: artistData.external_urls.spotify,
                            icon: artistData.images[0].url,
                            title: artistData.name
                        });
                    }
                })
            })
        });
        if (data.tracks.next) {
            await getPage(data.tracks.next)
        }
        createChart(genreCounts, "Genres", genres)
        createChart(artistCounts, "Artists", artists)
        dataSection.style.display = "block";
    }
}

function getPage(url) {
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
            totalTracks += data.items.length
            data.tracks.items.forEach(function (k) {
                k.track.artists.forEach(async function (artist) {
                    var name = artist.name
                    if (!artistCounts[name]) {
                        artistCounts[name] = 1
                    } else {
                        artistCounts[name]++
                    }
                    if (!artistSongs[name]) {
                        artistSongs[name] = []
                    }
                    artistSongs[name].push({
                        url: k.track.external_urls.spotify,
                        icon: k.track.album.images[0].url,
                        title: k.track.name,
                        artists: k.track.artists.map((x) => x.name).toString().replaceAll(",", ", ")
                    })
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
                            genreArtists[g].push({
                                url: artistData.external_urls.spotify,
                                icon: artistData.images[0].url,
                                title: artistData.name
                            });
                        }
                    })
                })
            });
            if (data.next) {
                await getPage(data.next)
            }
            resolve()
        }
    })
}

function getPercentage(name, group) {
    return ((group[name] / totalTracks) * 100) + "%"
}

function createChart(group, title, topcontainer) {
    console.log(topcontainer)
    var dataset = [["Artist", "Amount of Songs"]];
    Object.keys(group).forEach(function (k) {
        dataset.push([k, group[k]])
    })
    if (google.visualization) {
        var table = google.visualization.arrayToDataTable(dataset)
        var chart = new google.visualization.PieChart(topcontainer.querySelector("#chart"));
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
        google.visualization.events.addListener(chart, 'select', function () {
            var selectedItem = chart.getSelection()[0];
            if (selectedItem) {
                var value = table.getValue(selectedItem.row, 0);
                if (group == artistCounts) {
                    artistSongs[value].forEach(function (s) {
                        var elem = document.createElement("a")
                        elem.href = s.url
                        elem.target = "_blank"
                        elem.classList = "song"
                        elem.innerHTML = `<img class="icon" src="${s.icon}" /><div style="text-align:start"><span class="title">${s.title}</span><br><span class="artists">${s.artists}</span></div>`
                        samesongs.appendChild(elem)
                    })
                } else if (group == genreCounts) {
                    artistSongs[value].forEach(function (s) {
                        var elem = document.createElement("a")
                        elem.href = s.url
                        elem.target = "_blank"
                        elem.classList = "song"
                        elem.innerHTML = `<img class="icon" src="${s.icon}" /><div style="text-align:start"><span class="title">${s.title}</span></div>`
                        samesongs.appendChild(elem)
                    })
                }
            } else {
                getTop5(group, topcontainer.querySelector("#info"))
            }
        });
    } else {
        alert("Google Charts failed to load.")
    }
    getTop5(group, topcontainer.querySelector("#info"))
}

function getTop5(group, container) {
    var sortedArray = Object.entries(group)
        .sort((a, b) => b[1] - a[1])
        .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});
    var list = document.createElement("ol")
    container.innerHTML = "<h2><u>Top 5</u></h2>"
    Object.keys(sortedArray).forEach(function (k, i) {
        if (i < 6) {
            var skill = document.createElement("li")
            skill.innerHTML = k;
            list.appendChild(skill)
        }
    })
    container.appendChild(list)
}