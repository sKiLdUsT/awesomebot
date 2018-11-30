/*
    AwesomeBot Alero v1.0
    (c)2017-2018 sKiLdUsT <skil@skildust.com>
 */
'use strict'

const express = require('express')
const session = require('express-session')
const path = require('path')
const crypto = require('crypto')
const config = new (require('../lib/Config'))()

const webRoutes = require('./web')
const apiRoutes = require('./api')

let app = express()
app.set('views', path.resolve(__dirname, 'views'))
app.set('view engine', 'ejs')

app.use(session({
  resave: false,
  saveUninitialized: false,
  secret: String(crypto.randomBytes(32))
}))
app.use(express.static(path.resolve(__dirname, 'public')))
app.use('/', webRoutes)
app.use('/api', apiRoutes)

app.listen(config.Webpanel.port)
