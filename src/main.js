import './style.css'

var tracks = [
  { id: 1, title: 'Night Drive', artist: 'Chris Haugen', genre: 'Demo sample', color: '#d6e6e1', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' },
  { id: 2, title: 'Golden Hour', artist: 'Vibe Tracks', genre: 'Demo sample', color: '#f2d8a7', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3' },
  { id: 3, title: 'Sunday Stroll', artist: 'TrackTribe', genre: 'Demo sample', color: '#e6c6b8', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3' }
]
var remoteTracks = []
var app = document.querySelector('#app')
var audio = new Audio()
var currentId = 1
var isPlaying = false
var searchTimer
var playlist = JSON.parse(localStorage.getItem('imu6-playlist') || '[]')
var nextPageToken = ''
var activeSearch = ''
var ytPlayer = null
var ytApiReady = false

function allTracks() { return tracks.concat(remoteTracks) }
function currentTrack() { return allTracks().filter(function (track) { return String(track.id) === String(currentId) })[0] }
function escapeHtml(value) { return String(value || '').replace(/[&<>"']/g, function (character) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character] }) }
function art(track, small) { return '<div class="art ' + (small ? 'art-small' : '') + '" style="background:' + track.color + '"><span>' + escapeHtml(track.title.split(' ').map(function (word) { return word[0] }).join('')) + '</span></div>' }
function trackRow(track) { return '<div class="track-wrap"><button class="track' + (String(track.id) === String(currentId) ? ' active' : '') + '" data-track="' + escapeHtml(track.id) + '">' + art(track, true) + '<span class="track-copy"><strong>' + escapeHtml(track.title) + '</strong><small>' + escapeHtml(track.artist) + ' &middot; ' + escapeHtml(track.genre) + '</small></span><span class="track-more">&#9656;</span></button><button class="add-track" data-add-track="' + escapeHtml(track.id) + '" aria-label="Add ' + escapeHtml(track.title) + ' to playlist">+</button></div>' }

window.onYouTubeIframeAPIReady = function () { ytApiReady = true }
function loadYouTubeApi() { if (document.querySelector('#youtube-api')) return; var script = document.createElement('script'); script.id = 'youtube-api'; script.src = 'https://www.youtube.com/iframe_api'; document.head.appendChild(script) }

app.innerHTML = '<main class="phone-shell"><header class="topbar"><div><span class="eyebrow">YOUR POCKET RADIO</span><h1>iMu<span>6</span></h1></div><button class="icon-button" aria-label="Open profile">&#9673;</button></header><section class="hero"><p class="eyebrow">SATURDAY, SEPTEMBER 22</p><h2>Good music,<br><em>wherever you are.</em></h2><p class="hero-note">Real songs through the official YouTube player.</p></section><nav class="tabs" aria-label="Main navigation"><button class="tab active" data-view="home">Home</button><button class="tab" data-view="search">Search</button><button class="tab" data-view="library">Library</button></nav><section id="youtube-player" class="youtube-player" aria-label="YouTube player"></section><section id="content"></section><section class="now-playing"><div id="now-art"></div><div class="now-copy"><strong id="now-title"></strong><small id="now-artist"></small></div><button class="play-button" id="play" aria-label="Play or pause">&#9654;</button></section><footer class="footer-note">YouTube playback stays inside the official player</footer></main>'

function render(view, query) {
  var content = document.querySelector('#content')
  var visible = view === 'library' ? playlist : tracks.slice(0, 3)
  if (view === 'search') {
    visible = query ? remoteTracks : tracks.slice(0, 3)
    content.innerHTML = '<div class="search-wrap"><input id="search-input" type="search" placeholder="Search YouTube music" value="' + escapeHtml(query || '') + '"><span>&#8981;</span></div><div class="section-heading"><h3>Find a real song</h3><span id="search-status">' + (query ? 'searching...' : 'YouTube') + '</span></div><div id="search-results">' + (visible.length ? visible.map(trackRow).join('') : '<p class="empty">Search for an artist or song.</p>') + '</div><button id="load-more" class="load-more" type="button"' + (nextPageToken ? '' : ' hidden') + '>Load more songs</button><p class="catalog-note">Results are provided by YouTube. Playback uses the official embedded player.</p>'
  } else if (view === 'library') {
    content.innerHTML = '<div class="section-heading"><h3>Your playlist</h3><span>' + visible.length + ' saved</span></div>' + (visible.length ? visible.map(trackRow).join('') : '<p class="empty">Add songs from Search to build your playlist.</p>')
  } else {
    content.innerHTML = '<div class="section-heading"><h3>Quick picks</h3><span>demo samples</span></div>' + visible.map(trackRow).join('') + '<div class="section-heading lower"><h3>Search the real catalog</h3></div><p class="empty compact">Use Search to find songs from YouTube.</p>'
  }
  bindContent(view, query)
}
function updatePlayer() {
  var track = currentTrack()
  document.querySelector('#now-art').innerHTML = art(track, true)
  document.querySelector('#now-title').textContent = track.title
  document.querySelector('#now-artist').textContent = track.artist
  document.querySelector('#play').innerHTML = track.videoId ? '&#9654;' : (isPlaying ? '&#10074;&#10074;' : '&#9654;')
}
function selectTrack(id) {
  currentId = id
  var track = currentTrack()
  var player = document.querySelector('#youtube-player')
  if (track.videoId) {
    audio.pause()
    player.innerHTML = '<iframe id="youtube-iframe" title="YouTube music player" src="https://www.youtube.com/embed/' + encodeURIComponent(track.videoId) + '?enablejsapi=1&playsinline=1&rel=0" allow="autoplay; encrypted-media" allowfullscreen></iframe>'
    player.classList.add('visible')
    isPlaying = true
    loadYouTubeApi()
    createYouTubePlayer(track.videoId)
  } else {
    player.innerHTML = ''
    player.classList.remove('visible')
    audio.src = track.url
    audio.play()
    isPlaying = true
  }
  updatePlayer()
  var input = document.querySelector('#search-input')
  render(document.querySelector('.tab.active').getAttribute('data-view'), input ? input.value : undefined)
}
function createYouTubePlayer(videoId) { if (!ytApiReady || !window.YT || !window.YT.Player) { window.setTimeout(function () { createYouTubePlayer(videoId) }, 250); return } ytPlayer = new window.YT.Player('youtube-iframe', { events: { onReady: function (event) { event.target.loadVideoById(videoId) }, onStateChange: function (event) { if (event.data === window.YT.PlayerState.PLAYING) { isPlaying = true; updatePlayer() } if (event.data === window.YT.PlayerState.PAUSED || event.data === window.YT.PlayerState.ENDED) { isPlaying = false; updatePlayer() } } } }) }
function requestJson(url, done) {
  var request = new XMLHttpRequest()
  request.open('GET', url, true)
  request.onreadystatechange = function () {
    if (request.readyState === 4) {
      var result = null
      try { result = request.status === 200 ? JSON.parse(request.responseText) : null } catch (error) { result = null }
      done(result)
    }
  }
  request.send()
}
function searchYouTube(query, append) {
  activeSearch = query
  var status = document.querySelector('#search-status')
  if (status) status.textContent = 'searching...'
  requestJson('/api/youtube-search?q=' + encodeURIComponent(query) + (append && nextPageToken ? '&pageToken=' + encodeURIComponent(nextPageToken) : ''), function (result) {
    var offset = remoteTracks.length
    var freshTracks = result && result.items ? result.items.map(function (item, index) { return { id: 'youtube-' + (offset + index), videoId: item.videoId, title: item.title, artist: item.channelTitle, genre: 'YouTube', color: ['#d6e6e1', '#f2d8a7', '#e6c6b8', '#cbd5e7'][index % 4] } }) : []
    if (!append) remoteTracks = []
    remoteTracks = remoteTracks.concat(freshTracks)
    nextPageToken = result && result.nextPageToken ? result.nextPageToken : ''
    var results = document.querySelector('#search-results')
    if (results) results.innerHTML = remoteTracks.length ? remoteTracks.map(trackRow).join('') : '<p class="empty">YouTube search is unavailable right now.</p>'
    if (status) status.textContent = remoteTracks.length + ' results'
    var more = document.querySelector('#load-more')
    if (more) more.hidden = !nextPageToken
    bindContent('search', query)
  })
}
function bindContent(view, query) {
  Array.prototype.forEach.call(document.querySelectorAll('[data-track]'), function (button) { button.addEventListener('click', function () { selectTrack(button.getAttribute('data-track')) }) })
  var input = document.querySelector('#search-input')
  if (input) input.addEventListener('input', function () {
    var value = input.value
    clearTimeout(searchTimer)
    remoteTracks = []
    nextPageToken = ''
    var status = document.querySelector('#search-status')
    var results = document.querySelector('#search-results')
    if (status) status.textContent = value.length > 1 ? 'waiting...' : 'YouTube'
    if (results) results.innerHTML = value.length > 1 ? '<p class="empty">Keep typing, then iMu6 will search.</p>' : '<p class="empty">Search for an artist or song.</p>'
    searchTimer = setTimeout(function () { if (value.length > 1) searchYouTube(value) }, 2000)
  })
  Array.prototype.forEach.call(document.querySelectorAll('[data-add-track]'), function (button) { button.addEventListener('click', function () { addToPlaylist(button.getAttribute('data-add-track')) }) })
  var loadMore = document.querySelector('#load-more')
  if (loadMore) loadMore.addEventListener('click', function () { loadMore.disabled = true; searchYouTube(activeSearch, true) })
}
function addToPlaylist(id) { var track = allTracks().filter(function (item) { return String(item.id) === String(id) })[0]; if (!track || playlist.some(function (item) { return item.videoId === track.videoId || item.id === track.id })) return; playlist.push(track); localStorage.setItem('imu6-playlist', JSON.stringify(playlist)); var input = document.querySelector('#search-input'); render(document.querySelector('.tab.active').getAttribute('data-view'), input ? input.value : undefined) }

document.querySelector('#play').addEventListener('click', function () {
  var track = currentTrack()
  if (track.videoId && ytPlayer) {
    if (isPlaying) ytPlayer.pauseVideo(); else ytPlayer.playVideo()
    isPlaying = !isPlaying
    updatePlayer()
    return
  }
  if (isPlaying) { audio.pause(); isPlaying = false } else { audio.play(); isPlaying = true }
  updatePlayer()
})
audio.addEventListener('ended', function () { if (typeof currentId === 'number') selectTrack(currentId === tracks.length ? 1 : currentId + 1) })
Array.prototype.forEach.call(document.querySelectorAll('.tab'), function (tab) { tab.addEventListener('click', function () { Array.prototype.forEach.call(document.querySelectorAll('.tab'), function (item) { item.classList.remove('active') }); tab.classList.add('active'); render(tab.getAttribute('data-view')) }) })
updatePlayer()
render('home')
