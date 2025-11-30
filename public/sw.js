/* eslint-env worker */
const CACHE_NAME = 'jg-chess-v1'
const URLS_TO_CACHE = [
  './',
  './index.html',
  './style.css',
  './client.js',
  './libs/chess.js',
  './libs/d3.min.js',
  './libs/jszip.min.js',
  './libs/gif.js',
  './libs/gif.worker.js',
  './libs/qrcode.min.js'
]

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(URLS_TO_CACHE))
  )
})

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      if (response) return response
      return fetch(event.request).then(networkResponse => {
        if (event.request.url.match(/\.(png|jpg|svg)$/)) {
          const clonedResponse = networkResponse.clone()
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clonedResponse))
        }
        return networkResponse
      })
    })
  )
})
