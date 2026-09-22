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
var savedPlaylists = JSON.parse(localStorage.getItem('imu6-playlists') || 'null')
if (!savedPlaylists) {
  var oldPlaylist = JSON.parse(localStorage.getItem('imu6-playlist') || '[]')
  savedPlaylists = oldPlaylist.length ? [{ id: 'playlist-1', name: 'My playlist', tracks: oldPlaylist }] : []
  localStorage.setItem('imu6-playlists', JSON.stringify(savedPlaylists))
}
var nextPageToken = ''
var activeSearch = ''
var ytPlayer = null
var ytApiReady = false
var progressTimer
var pendingPlaylistTrack = null
var activeQueue = []
var queueIndex = -1
var shuffleOn = false
var repeatOn = false

function allTracks() { var playlistTracks = []; savedPlaylists.forEach(function (list) { playlistTracks = playlistTracks.concat(list.tracks) }); return tracks.concat(remoteTracks, playlistTracks).filter(function (track, index, collection) { return collection.findIndex(function (item) { return String(item.id) === String(track.id) }) === index }) }
function currentTrack() { return allTracks().filter(function (track) { return String(track.id) === String(currentId) })[0] }
function escapeHtml(value) { return String(value || '').replace(/[&<>"']/g, function (character) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character] }) }
function art(track, small) { var image = track.thumbnail ? ';background-image:url("' + escapeHtml(track.thumbnail) + '")' : ''; return '<div class="art ' + (small ? 'art-small' : '') + (track.thumbnail ? ' has-image' : '') + '" style="background-color:' + track.color + image + '"><span>' + escapeHtml(track.title.split(' ').map(function (word) { return word[0] }).join('')) + '</span></div>' }
function trackRow(track) { return '<div class="track-wrap"><button class="track' + (String(track.id) === String(currentId) ? ' active' : '') + '" data-track="' + escapeHtml(track.id) + '">' + art(track, true) + '<span class="track-copy"><strong>' + escapeHtml(track.title) + '</strong><small>' + escapeHtml(track.artist) + ' &middot; ' + escapeHtml(track.genre) + '</small></span><span class="track-more">&#9656;</span></button><button class="track-menu-toggle" data-menu-track="' + escapeHtml(track.id) + '" aria-label="More options for ' + escapeHtml(track.title) + '">&#8942;</button><div class="track-menu" data-menu-for="' + escapeHtml(track.id) + '"><button data-new-playlist="' + escapeHtml(track.id) + '">New playlist</button>' + savedPlaylists.map(function (list) { return '<button data-add-playlist="' + escapeHtml(list.id) + '" data-add-track="' + escapeHtml(track.id) + '">' + escapeHtml(list.name) + '</button>' }).join('') + '</div></div>' }

window.onYouTubeIframeAPIReady = function () { ytApiReady = true }
function loadYouTubeApi() { if (document.querySelector('#youtube-api')) return; var script = document.createElement('script'); script.id = 'youtube-api'; script.src = 'https://www.youtube.com/iframe_api'; document.head.appendChild(script) }

app.innerHTML = '<main class="phone-shell"><header class="topbar"><div><span class="eyebrow">YOUR POCKET RADIO</span><h1>iMu<span>6</span></h1></div><button class="icon-button" aria-label="Open profile">&#9673;</button></header><section class="hero"><p class="eyebrow">SATURDAY, SEPTEMBER 22</p><h2>Good music,<br><em>wherever you are.</em></h2><p class="hero-note">Real songs through the official YouTube player.</p></section><nav class="tabs" aria-label="Main navigation"><button class="tab active" data-view="home">Home</button><button class="tab" data-view="search">Search</button><button class="tab" data-view="playlists">Playlists</button><button class="tab" data-view="library">Library</button></nav><section id="youtube-player" class="youtube-player" aria-label="YouTube player"></section><section id="content"></section><section class="now-playing"><div id="now-art"></div><div class="now-copy"><strong id="now-title"></strong><small id="now-artist"></small></div><button class="player-control" id="previous" aria-label="Previous song">&#9664;&#9664;</button><button class="play-button" id="play" aria-label="Play or pause">&#9654;</button><button class="player-control" id="next" aria-label="Next song">&#9654;&#9654;</button><button class="player-control" id="shuffle" aria-label="Shuffle">&#8646;</button><button class="player-control" id="repeat" aria-label="Repeat">&#8635;</button><input id="progress" class="progress" type="range" min="0" max="100" value="0" aria-label="Track progress"></section><section id="playlist-modal" class="playlist-modal" hidden><div class="playlist-dialog"><span class="eyebrow">NEW PLAYLIST</span><h3>Name your playlist</h3><input id="playlist-name" type="text" maxlength="40" placeholder="e.g. Sunday drive"><div class="dialog-actions"><button id="cancel-playlist" type="button">Cancel</button><button id="save-playlist" type="button">Create</button></div></div></section><footer class="footer-note">YouTube playback stays inside the official player</footer></main>'

function render(view, query) {
  var content = document.querySelector('#content')
  var visible = tracks.slice(0, 3)
  if (view === 'search') {
    visible = query ? remoteTracks : tracks.slice(0, 3)
    content.innerHTML = '<div class="search-wrap"><input id="search-input" type="search" placeholder="Search YouTube music" value="' + escapeHtml(query || '') + '"><span>&#8981;</span></div><div class="section-heading"><h3>Find a real song</h3><span id="search-status">' + (query ? 'searching...' : 'YouTube') + '</span></div><div id="search-results">' + (visible.length ? visible.map(trackRow).join('') : '<p class="empty">Search for an artist or song.</p>') + '</div><button id="load-more" class="load-more" type="button"' + (nextPageToken ? '' : ' hidden') + '>Load more songs</button><p class="catalog-note">Results are provided by YouTube. Playback uses the official embedded player.</p>'
  } else if (view === 'playlists') {
    content.innerHTML = '<div class="section-heading"><h3>Your playlists</h3><button class="new-playlist" id="new-playlist">+ New playlist</button></div><div class="playlist-grid">' + (savedPlaylists.length ? savedPlaylists.map(function (list) { return '<button class="playlist-card" data-playlist-view="' + escapeHtml(list.id) + '"><span class="playlist-count">' + list.tracks.length + ' SONGS</span><strong>' + escapeHtml(list.name) + '</strong></button>' }).join('') : '<p class="empty">Create a playlist to keep your favorite songs close.</p>') + '</div><div id="playlist-detail"></div>'
  } else if (view === 'library') {
    content.innerHTML = '<div class="section-heading"><h3>Demo library</h3><span>starter samples</span></div>' + tracks.map(trackRow).join('')
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
  document.querySelector('#play').innerHTML = '<span class="control-icon ' + (isPlaying ? 'pause-icon' : 'play-icon') + '"></span>'
  document.querySelector('#shuffle').className = shuffleOn ? 'player-control selected' : 'player-control'
  document.querySelector('#repeat').className = repeatOn ? 'player-control selected' : 'player-control'
}
function selectTrack(id) {
  currentId = id
  var track = currentTrack()
  if (activeQueue.length) startQueueAt(track)
  var player = document.querySelector('#youtube-player')
  if (track.videoId) {
    audio.pause()
    if (ytPlayer && ytPlayer.destroy) ytPlayer.destroy()
    player.innerHTML = '<div id="youtube-iframe" title="YouTube music player"></div>'
    player.classList.add('visible')
    isPlaying = true
    loadYouTubeApi()
  } else {
    if (ytPlayer && ytPlayer.destroy) ytPlayer.destroy()
    ytPlayer = null
    player.innerHTML = ''
    player.classList.remove('visible')
    audio.src = track.url
    audio.play()
    isPlaying = true
  }
  updatePlayer()
  var input = document.querySelector('#search-input')
  render(document.querySelector('.tab.active').getAttribute('data-view'), input ? input.value : undefined)
  if (track.videoId) createYouTubePlayer(track.videoId)
}
function createYouTubePlayer(videoId) { if (!ytApiReady || !window.YT || !window.YT.Player || !document.querySelector('#youtube-iframe')) { if (document.querySelector('#youtube-iframe')) window.setTimeout(function () { createYouTubePlayer(videoId) }, 250); return } ytPlayer = new window.YT.Player('youtube-iframe', { videoId: videoId, playerVars: { playsinline: 1, rel: 0, autoplay: 1 }, events: { onReady: function (event) { event.target.playVideo(); startProgressUpdates() }, onStateChange: function (event) { if (event.data === window.YT.PlayerState.PLAYING) { isPlaying = true; startProgressUpdates(); updatePlayer() } if (event.data === window.YT.PlayerState.PAUSED) { isPlaying = false; updatePlayer() } if (event.data === window.YT.PlayerState.ENDED) advanceTrack() } } }) }
function setProgress(value) { var progress = document.querySelector('#progress'); if (progress) { progress.value = value; progress.style.setProperty('--progress', value + '%') } }
function startProgressUpdates() { clearInterval(progressTimer); progressTimer = window.setInterval(function () { if (!ytPlayer || !ytPlayer.getDuration) return; var duration = ytPlayer.getDuration(); var time = ytPlayer.getCurrentTime(); if (duration) setProgress(time / duration * 100) }, 500) }
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
    var freshTracks = result && result.items ? result.items.map(function (item, index) { return { id: 'youtube-' + (offset + index), videoId: item.videoId, title: item.title, artist: item.channelTitle, genre: 'YouTube', thumbnail: item.thumbnail, color: ['#d6e6e1', '#f2d8a7', '#e6c6b8', '#cbd5e7'][index % 4] } }) : []
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
  Array.prototype.forEach.call(document.querySelectorAll('[data-menu-track]'), function (button) { button.addEventListener('click', function (event) { event.stopPropagation(); var menu = document.querySelector('[data-menu-for="' + button.getAttribute('data-menu-track') + '"]'); menu.classList.toggle('open') }) })
  Array.prototype.forEach.call(document.querySelectorAll('[data-add-playlist]'), function (button) { button.addEventListener('click', function () { addToPlaylist(button.getAttribute('data-add-track'), button.getAttribute('data-add-playlist')) }) })
  Array.prototype.forEach.call(document.querySelectorAll('[data-new-playlist]'), function (button) { button.addEventListener('click', function () { createPlaylist(button.getAttribute('data-new-playlist')) }) })
  Array.prototype.forEach.call(document.querySelectorAll('[data-playlist-view]'), function (button) { button.addEventListener('click', function () { showPlaylist(button.getAttribute('data-playlist-view')) }) })
  var newPlaylist = document.querySelector('#new-playlist')
  if (newPlaylist) newPlaylist.addEventListener('click', function () { createPlaylist() })
  var loadMore = document.querySelector('#load-more')
  if (loadMore) loadMore.addEventListener('click', function () { loadMore.disabled = true; searchYouTube(activeSearch, true) })
}
function savePlaylists() { localStorage.setItem('imu6-playlists', JSON.stringify(savedPlaylists)) }
function listen(selector, event, handler) { var element = document.querySelector(selector); if (element) element.addEventListener(event, handler) }
function addToPlaylist(trackId, playlistId) { var track = allTracks().filter(function (item) { return String(item.id) === String(trackId) })[0]; var list = savedPlaylists.filter(function (item) { return String(item.id) === String(playlistId) })[0]; if (!track || !list || list.tracks.some(function (item) { return item.videoId === track.videoId || item.id === track.id })) return; list.tracks.push(track); savePlaylists(); closeMenus() }
function createPlaylist(trackId) { pendingPlaylistTrack = trackId || null; var modal = document.querySelector('#playlist-modal'); var input = document.querySelector('#playlist-name'); modal.hidden = false; input.value = ''; input.focus() }
function finishCreatePlaylist() { var name = document.querySelector('#playlist-name').value.replace(/^\s+|\s+$/g, ''); if (!name) return; var list = { id: 'playlist-' + new Date().getTime(), name: name, tracks: [] }; if (pendingPlaylistTrack) { var track = allTracks().filter(function (item) { return String(item.id) === String(pendingPlaylistTrack) })[0]; if (track) list.tracks.push(track) } savedPlaylists.push(list); savePlaylists(); pendingPlaylistTrack = null; document.querySelector('#playlist-modal').hidden = true; closeMenus(); render('playlists') }
function closeMenus() { Array.prototype.forEach.call(document.querySelectorAll('.track-menu'), function (menu) { menu.classList.remove('open') }) }
function showPlaylist(id) { var list = savedPlaylists.filter(function (item) { return String(item.id) === String(id) })[0]; var detail = document.querySelector('#playlist-detail'); if (detail && list) { activeQueue = list.tracks.slice(); queueIndex = -1; detail.innerHTML = '<div class="section-heading playlist-detail-heading"><h3>' + escapeHtml(list.name) + '</h3><span>' + list.tracks.length + ' songs</span></div>' + (list.tracks.length ? list.tracks.map(trackRow).join('') : '<p class="empty">This playlist is empty.</p>'); bindContent('playlists') } }
function startQueueAt(track) { if (!activeQueue.length) return; queueIndex = activeQueue.findIndex(function (item) { return String(item.id) === String(track.id) }); }
function advanceTrack() { if (!activeQueue.length || queueIndex < 0) { isPlaying = false; updatePlayer(); return } if (repeatOn) { selectTrack(activeQueue[queueIndex].id); return } if (shuffleOn && activeQueue.length > 1) { var nextIndex = queueIndex; while (nextIndex === queueIndex) nextIndex = Math.floor(Math.random() * activeQueue.length); queueIndex = nextIndex } else { queueIndex += 1 } if (queueIndex >= activeQueue.length) { isPlaying = false; updatePlayer(); return } selectTrack(activeQueue[queueIndex].id) }
function moveQueue(step) { if (!activeQueue.length) return; if (queueIndex < 0) queueIndex = 0; queueIndex = (queueIndex + step + activeQueue.length) % activeQueue.length; selectTrack(activeQueue[queueIndex].id) }

listen('#play', 'click', function () {
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
listen('#previous', 'click', function () { moveQueue(-1) })
listen('#next', 'click', function () { moveQueue(1) })
listen('#shuffle', 'click', function () { shuffleOn = !shuffleOn; updatePlayer() })
listen('#repeat', 'click', function () { repeatOn = !repeatOn; updatePlayer() })
listen('#progress', 'input', function (event) { var track = currentTrack(); var percent = Number(event.target.value) / 100; event.target.style.setProperty('--progress', event.target.value + '%'); if (track.videoId && ytPlayer && ytPlayer.getDuration) ytPlayer.seekTo(ytPlayer.getDuration() * percent, true); else if (!track.videoId && audio.duration) audio.currentTime = audio.duration * percent })
function scrubFromTouch(event) { var progress = document.querySelector('#progress'); var touch = event.touches[0]; var bounds = progress.getBoundingClientRect(); var percent = Math.max(0, Math.min(1, (touch.pageX - bounds.left) / bounds.width)); var value = percent * 100; setProgress(value); var track = currentTrack(); if (track.videoId && ytPlayer && ytPlayer.getDuration) ytPlayer.seekTo(ytPlayer.getDuration() * percent, true); else if (!track.videoId && audio.duration) audio.currentTime = audio.duration * percent; if (event.preventDefault) event.preventDefault() }
listen('#progress', 'touchstart', scrubFromTouch)
listen('#progress', 'touchmove', scrubFromTouch)
listen('#cancel-playlist', 'click', function () { document.querySelector('#playlist-modal').hidden = true; pendingPlaylistTrack = null })
listen('#save-playlist', 'click', finishCreatePlaylist)
audio.addEventListener('ended', function () { if (activeQueue.length) advanceTrack(); else if (typeof currentId === 'number') selectTrack(currentId === tracks.length ? 1 : currentId + 1) })
audio.addEventListener('timeupdate', function () { if (!audio.duration || currentTrack().videoId) return; setProgress(audio.currentTime / audio.duration * 100) })
Array.prototype.forEach.call(document.querySelectorAll('.tab'), function (tab) { tab.addEventListener('click', function () { var view = tab.getAttribute('data-view'); if (view !== 'playlists') { activeQueue = []; queueIndex = -1 } Array.prototype.forEach.call(document.querySelectorAll('.tab'), function (item) { item.classList.remove('active') }); tab.classList.add('active'); render(view) }) })
updatePlayer()
render('home')
