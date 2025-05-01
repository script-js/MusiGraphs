var artistCounts = {}
var genreCounts = {}
var genreArtists = {}
var artistSongs = {};

var accessToken = localStorage.getItem("accessToken")

async function getUserLists() {
    myLists.innerHTML = "";
    var response = await fetch('https://api.spotify.com/v1/me/playlists', {
        headers: {
            Authorization: 'Bearer ' + accessToken
        }
    });
    var data = await response.json();
    if (data.error) {
        if (data.error.message == "The access token expired" || data.error.message == "Invalid access token") {
            localStorage.removeItem("accessToken")
            location.reload()
        } else {
            alert("Error getting library: " + data.error.message)
        }
    } else {
        if (data.items.length > 0) {
            data.items.forEach(function (p) {
                var elem = document.createElement("div")
                elem.classList = "playlist clickable library"
                elem.onclick = function () { getList(p.id) }
                elem.innerHTML = `<img class="icon" src="${p.images[0].url}" /><div style="text-align:start"><span class="title">${p.name}</span></div>`
                myLists.appendChild(elem)
            })
        } else {
            myLists.innerHTML = "No playlists"
            addList()
        }
    }
}

async function getList(list) {
    chooser.style.display = "none"
    progressC.style.display = "block"
    var response = await fetch('https://api.spotify.com/v1/playlists/' + list, {
        headers: {
            Authorization: 'Bearer ' + accessToken
        }
    });
    var data = await response.json();
    if (data.error) {
        if (data.error.message == "The access token expired" || data.error.message == "Invalid access token") {
            spotifyAuth()
        } else {
            alert("Error getting playlist: " + data.error.message)
        }
    } else {
        progress.max = data.tracks.items.length;
        progress.value = 0;
        progressText.innerText = "0/" + data.tracks.items.length;
        for (var i = 0; i < data.tracks.items.length; i++) {
            var k = data.tracks.items[i];
            for (var i2 = 0; i2 < k.track.artists.length; i2++) {
                var artist = k.track.artists[i2];
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
                        genreArtists[g] = [{
                            url: artistData.external_urls.spotify,
                            icon: artistData.images[0].url,
                            title: artistData.name
                        }];
                    } else if (!genreArtists[g].map(x => x.title).includes(name)) {
                        genreArtists[g].push({
                            url: artistData.external_urls.spotify,
                            icon: artistData.images[0].url,
                            title: artistData.name
                        });
                    }
                })
            }
            progress.value++
            progressText.innerText = progress.value + "/" + progress.max
        };
        if (data.tracks.next) {
            await getPage(data.tracks.next)
        }
        createChart(genreCounts, "Genres", genres)
        createChart(artistCounts, "Artists", artists)
        window.onresize = function () {
            createChart(genreCounts, "Genres", genres)
            createChart(artistCounts, "Artists", artists)
        }
        if (window.innerWidth < 600) {
            dataSection.style.display = "block";
        } else {
            dataSection.style.display = "flex";
        }
        progressC.style.display = "none";
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
            if (data.error.message == "The access token expired" || data.error.message == "Invalid access token") {
                spotifyAuth()
            } else {
                alert("Error getting playlist: " + data.error.message)
            }
        } else {
            progress.max = data.items.length;
            progress.value = 0;
            progressText.innerText = "0/" + data.items.length;
            for (var i = 0; i < data.items.length; i++) {
                var k = data.items[i];
                if (k.track) {
                    for (var i2 = 0; i2 < k.track.artists.length; i2++) {
                        var artist = k.track.artists[i2];
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
                                genreArtists[g] = [{
                                    url: artistData.external_urls.spotify,
                                    icon: artistData.images[0].url,
                                    title: artistData.name
                                }];
                            } else if (!genreArtists[g].map(x => x.title).includes(name)) {
                                genreArtists[g].push({
                                    url: artistData.external_urls.spotify,
                                    icon: artistData.images[0].url,
                                    title: artistData.name
                                });
                            }
                        })
                    }
                }
                progress.value++
                progressText.innerText = progress.value + "/" + progress.max
            };
            if (data.next) {
                await getPage(data.next)
            }
            resolve()
        }
    })
}

function createChart(group, title, topcontainer) {
    var dataset = [["Artist", "Amount of Songs"]];
    Object.keys(group).forEach(function (k) {
        dataset.push([k, group[k]])
    })
    if (google.visualization) {
        var table = google.visualization.arrayToDataTable(dataset)
        var chart = new google.visualization.PieChart(topcontainer.querySelector("#chart"));
        if (window.innerWidth < 600) {
            var width = window.innerWidth;
        } else {
            var width = (window.innerWidth / 2) - 100
        }
        chart.draw(table, {
            title,
            "legend": "none",
            "chartArea": {
                "backgoundColor": "red"
            },
            "backgroundColor": "#232423",
            "fontName": "Roboto Slab",
            "titleTextStyle": {
                "color": "white",
                "fontSize": 25
            },
            height: (window.innerHeight / 2),
            width
        });
        google.visualization.events.addListener(chart, 'select', function () {
            var selectedItem = chart.getSelection()[0];
            if (selectedItem) {
                var value = table.getValue(selectedItem.row, 0);
                topcontainer.querySelector("#info").innerHTML = ""
                if (group == artistCounts) {
                    artistSongs[value].forEach(function (s) {
                        var elem = document.createElement("a")
                        elem.href = s.url
                        elem.target = "_blank"
                        elem.classList = "song"
                        elem.innerHTML = `<img class="icon" src="${s.icon}" /><div style="text-align:start"><span class="title">${s.title}</span><br><span class="artists">${s.artists}</span></div>`
                        topcontainer.querySelector("#info").appendChild(elem)
                    })
                } else if (group == genreCounts) {
                    genreArtists[value].forEach(function (s) {
                        var elem = document.createElement("a")
                        elem.href = s.url
                        elem.target = "_blank"
                        elem.classList = "song"
                        elem.innerHTML = `<img class="icon" src="${s.icon}" /><div style="text-align:start"><span class="title">${s.title}</span></div>`
                        topcontainer.querySelector("#info").appendChild(elem)
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
    container.innerHTML = "";
    var sortedArray = Object.entries(group)
        .sort((a, b) => b[1] - a[1])
        .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});
    var list = document.createElement("ol")
    container.innerHTML = "<h2><u>Top 5</u></h2>"
    Object.keys(sortedArray).forEach(function (k, i) {
        if (i < 6) {
            var itm = document.createElement("li")
            itm.innerHTML = k + " - " + sortedArray[k] + " songs";
            list.appendChild(itm)
        }
    })
    container.appendChild(list)
}

if (!accessToken) {
    chooser.innerHTML = `<button onclick="spotifyAuth()" class="loginBtn">
    <svg viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg" fill="#FFFFFF"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <rect x="0" fill="none" width="20" height="20"></rect> <g> <path d="M10 2c-4.4 0-8 3.6-8 8s3.6 8 8 8 8-3.6 8-8-3.6-8-8-8zm3.7 11.5c-.1.2-.5.3-.7.2-2.1-1.2-4.7-1.5-7-.8-.3 0-.5-.1-.6-.4 0-.2.1-.5.4-.6 2.6-.8 5.4-.4 7.8.9.1.2.2.5.1.7zm1-2.1c-.1 0-.1 0 0 0-.2.3-.6.4-.9.2-2.4-1.4-5.3-1.7-8-.9-.3.1-.7-.1-.8-.4-.1-.4.1-.7.4-.9 3-.9 6.3-.5 9 1.1.3.2.4.6.3.9zm0-2.3c-2.6-1.5-6.8-1.7-9.3-.9-.4.1-.8-.1-.9-.5-.1-.4.1-.8.5-1 2.8-.8 7.5-.7 10.5 1.1.4.2.5.7.3 1-.3.4-.7.5-1.1.3z"></path> </g> </g></svg>
    Log in to Spotify
    </button>
    `
} else {
    getUserLists()
}