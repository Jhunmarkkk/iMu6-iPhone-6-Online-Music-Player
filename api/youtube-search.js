export default async function handler(request, response) {
  var query = request.query && request.query.q
  var pageToken = request.query && request.query.pageToken
  var apiKey = process.env.YOUTUBE_API_KEY
  if (!apiKey) return response.status(500).json({ error: 'YOUTUBE_API_KEY is not configured in Vercel.' })
  if (!query || query.length < 2) return response.status(400).json({ error: 'Search query is too short.' })

  var params = new URLSearchParams({
    part: 'snippet',
    type: 'video',
    videoEmbeddable: 'true',
    maxResults: '8',
    q: query,
    key: apiKey
  })
  if (pageToken) params.set('pageToken', pageToken)
  var result = await fetch('https://www.googleapis.com/youtube/v3/search?' + params.toString())
  var data = await result.json()
  if (!result.ok) return response.status(result.status).json({ error: data.error && data.error.message ? data.error.message : 'YouTube search failed.' })

  return response.status(200).json({ nextPageToken: data.nextPageToken || '', items: (data.items || []).map(function (item) {
    return { videoId: item.id.videoId, title: item.snippet.title, channelTitle: item.snippet.channelTitle, thumbnail: item.snippet.thumbnails && item.snippet.thumbnails.medium ? item.snippet.thumbnails.medium.url : '' }
  }) })
}
