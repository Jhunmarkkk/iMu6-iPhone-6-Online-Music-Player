import './style.css'

var tracks = [
  { id: 1, title: 'Night Drive', artist: 'Chris Haugen', genre: 'Chill', color: '#d6e6e1', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' },
  { id: 2, title: 'Golden Hour', artist: 'Vibe Tracks', genre: 'Acoustic', color: '#f2d8a7', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3' },
  { id: 3, title: 'Sunday Stroll', artist: 'TrackTribe', genre: 'Pop', color: '#e6c6b8', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3' },
  { id: 4, title: 'Falling Stars', artist: 'The 126ers', genre: 'Electronic', color: '#cbd5e7', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3' },
  { id: 5, title: 'Open Road', artist: 'Jeremy Korpas', genre: 'Indie', color: '#d8d4bd', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3' },
  { id: 6, title: 'Quiet Places', artist: 'Asher Fulero', genre: 'Ambient', color: '#d9cde0', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3' }
]

var app = document.querySelector('#app')
var audio = new Audio()
var currentId = 1
var isPlaying = false

function currentTrack() { return tracks.filter(function (track) { return track.id === currentId })[0] }
function art(track, small) { return '<div class="art ' + (small ? 'art-small' : '') + '" style="background:' + track.color + '"><span>' + track.title.split(' ').map(function (word) { return word[0] }).join('') + '</span></div>' }
function trackRow(track) { return '<button class="track' + (track.id === currentId ? ' active' : '') + '" data-track="' + track.id + '">' + art(track, true) + '<span class="track-copy"><strong>' + track.title + '</strong><small>' + track.artist + ' &middot; ' + track.genre + '</small></span><span class="track-more">&#8942;</span></button>' }

app.innerHTML = '<main class="phone-shell"><header class="topbar"><div><span class="eyebrow">YOUR POCKET RADIO</span><h1>iMu<span>6</span></h1></div><button class="icon-button" aria-label="Open profile">&#9673;</button></header><section class="hero"><p class="eyebrow">SATURDAY, SEPTEMBER 22</p><h2>Good music,<br><em>wherever you are.</em></h2><p class="hero-note">A tiny streaming room for your everyday listening.</p></section><nav class="tabs" aria-label="Main navigation"><button class="tab active" data-view="home">Home</button><button class="tab" data-view="search">Search</button><button class="tab" data-view="library">Library</button></nav><section id="content"></section><section class="now-playing"><div id="now-art"></div><div class="now-copy"><strong id="now-title"></strong><small id="now-artist"></small></div><button class="play-button" id="play" aria-label="Play or pause">&#9654;</button></section><footer class="footer-note">Made for small screens &middot; plays free samples</footer></main>'

function render(view, query) {
  var content = document.querySelector('#content')
  var visible = tracks
  if (view === 'search') visible = tracks.filter(function (track) { return !query || (track.title + track.artist + track.genre).toLowerCase().indexOf(query.toLowerCase()) !== -1 })
  if (view === 'search') content.innerHTML = '<div class="search-wrap"><input id="search-input" type="search" placeholder="Songs, artists, moods" value="' + (query || '') + '"><span>&#8981;</span></div><div class="section-heading"><h3>Find your next song</h3><span>' + visible.length + ' results</span></div>' + (visible.length ? visible.map(trackRow).join('') : '<p class="empty">Your search came up quiet.</p>')
  else if (view === 'library') content.innerHTML = '<div class="section-heading"><h3>Your library</h3><span>6 free samples</span></div>' + tracks.map(trackRow).join('')
  else content.innerHTML = '<div class="section-heading"><h3>Quick picks</h3><span>free to play</span></div>' + tracks.slice(0, 4).map(trackRow).join('') + '<div class="section-heading lower"><h3>Browse moods</h3></div><div class="moods"><button>Chill</button><button>Acoustic</button><button>Indie</button><button>Ambient</button></div>'
  bindContent()
}
function updatePlayer() { var track = currentTrack(); document.querySelector('#now-art').innerHTML = art(track, true); document.querySelector('#now-title').textContent = track.title; document.querySelector('#now-artist').textContent = track.artist; document.querySelector('#play').innerHTML = isPlaying ? '&#10074;&#10074;' : '&#9654;' }
function selectTrack(id) { currentId = Number(id); audio.src = currentTrack().url; audio.play(); isPlaying = true; updatePlayer(); render(document.querySelector('.tab.active').getAttribute('data-view')) }
function bindContent() { Array.prototype.forEach.call(document.querySelectorAll('[data-track]'), function (button) { button.addEventListener('click', function () { selectTrack(button.getAttribute('data-track')) }) }); var input = document.querySelector('#search-input'); if (input) input.addEventListener('input', function () { render('search', input.value); document.querySelector('#search-input').focus() }) }

document.querySelector('#play').addEventListener('click', function () { if (isPlaying) { audio.pause(); isPlaying = false } else { audio.play(); isPlaying = true } updatePlayer() })
audio.addEventListener('ended', function () { selectTrack(currentId === tracks.length ? 1 : currentId + 1) })
Array.prototype.forEach.call(document.querySelectorAll('.tab'), function (tab) { tab.addEventListener('click', function () { Array.prototype.forEach.call(document.querySelectorAll('.tab'), function (item) { item.classList.remove('active') }); tab.classList.add('active'); render(tab.getAttribute('data-view')) }) })
updatePlayer()
render('home')

/* starter markup removed */
/*
<section id="center">
  <div class="hero">
    <img src="${heroImg}" class="base" width="170" height="179">
    <img src="${javascriptLogo}" class="framework" alt="JavaScript logo"/>
    <img src="${viteLogo}" class="vite" alt="Vite logo" />
  </div>
  <div>
    <h1>Get started</h1>
    <p>Edit <code>src/main.js</code> and save to test <code>HMR</code></p>
  </div>
  <button id="counter" type="button" class="counter"></button>
</section>

<div class="ticks"></div>

<section id="next-steps">
  <div id="docs">
    <svg class="icon" role="presentation" aria-hidden="true"><use href="/icons.svg#documentation-icon"></use></svg>
    <h2>Documentation</h2>
    <p>Your questions, answered</p>
    <ul>
      <li>
        <a href="https://vite.dev/" target="_blank">
          <img class="logo" src="${viteLogo}" alt="" />
          Explore Vite
        </a>
      </li>
      <li>
        <a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript" target="_blank">
          <img class="button-icon" src="${javascriptLogo}" alt="">
          Learn more
        </a>
      </li>
    </ul>
  </div>
  <div id="social">
    <svg class="icon" role="presentation" aria-hidden="true"><use href="/icons.svg#social-icon"></use></svg>
    <h2>Connect with us</h2>
    <p>Join the Vite community</p>
    <ul>
      <li><a href="https://github.com/vitejs/vite" target="_blank"><svg class="button-icon" role="presentation" aria-hidden="true"><use href="/icons.svg#github-icon"></use></svg>GitHub</a></li>
      <li><a href="https://chat.vite.dev/" target="_blank"><svg class="button-icon" role="presentation" aria-hidden="true"><use href="/icons.svg#discord-icon"></use></svg>Discord</a></li>
      <li><a href="https://x.com/vite_js" target="_blank"><svg class="button-icon" role="presentation" aria-hidden="true"><use href="/icons.svg#x-icon"></use></svg>X.com</a></li>
      <li><a href="https://bsky.app/profile/vite.dev" target="_blank"><svg class="button-icon" role="presentation" aria-hidden="true"><use href="/icons.svg#bluesky-icon"></use></svg>Bluesky</a></li>
    </ul>
  </div>
</section>

<div class="ticks"></div>
<section id="spacer"></section>
*/

