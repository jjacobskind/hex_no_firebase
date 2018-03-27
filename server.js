// const { isDevelopmentLike, port } = require('./config/server')
const path = require('path')

const next = require('next')
const express = require('express')

// Middlewares
// const cacheHeaders = require('./middlewares/cache_headers')
const compression = require('compression')

let isDevelopmentLike = true, port = 3000
const app = next({ dev: isDevelopmentLike })
const handle = app.getRequestHandler()

app.prepare()
.then(() => {
  const server = express()

  // Middlewares
  server.use(compression())

  server.use(express.static(path.join(path.resolve(), 'build')))
  server.use(express.static(path.join(path.resolve(), 'assets')))

  server.get('/', (req, res) => {
    return app.render(req, res, '/')
  })



  // Handle with next.js
  server.get('*', (req, res) => {
    return handle(req, res)
  })

  server.listen(port, (err) => {
    if (err) throw err
    console.log(`> Ready on port ${port}`)
  })
})
