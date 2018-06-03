// const { isDevelopmentLike, port } = require('./config/server')
process.env.NODE_ENV = process.env.NODE_ENV || 'development'
const authRoutes = require('./controllers/auth')
const path = require('path')

const next = require('next')
const express = require('express')
const bodyParser = require('body-parser')
const methodOverride = require('method-override')
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


  server.use(bodyParser.json()); // parse application/json
  server.use(bodyParser.json({ type: 'application/vnd.api+json' })); // parse application/vnd.api+json as json
  server.use(bodyParser.urlencoded({ extended: true })); // parse application/x-www-form-urlencoded

  server.use(methodOverride((req, res) => {
    const method = req && req.body && req.body._method
    if (!method) { return; }
    delete req.body._method;
    return method;
  }))

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
