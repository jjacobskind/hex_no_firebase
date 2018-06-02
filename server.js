// const { isDevelopmentLike, port } = require('./config/server')
process.env.NODE_ENV = process.env.NODE_ENV || 'development'
const authRoutes = require('./controllers/auth')
const path = require('path')

const next = require('next')
const express = require('express')
const config = require('./server/config/environment')
const mongoose = require('mongoose')
mongoose.connect(config.mongo.uri, config.mongo.options)
const passport = require('./controllers/auth/passport.js')

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
  server.use(passport.initialize())
  server.use(compression())

  server.use(express.static(path.join(path.resolve(), 'build')))
  server.use(express.static(path.join(path.resolve(), 'assets')))

  server.use('/auth', authRoutes)

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
