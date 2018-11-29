'use strict'

const {parentPort} = require('worker_threads')
const legacyServer = require('http')
const server = require('https')

legacyServer
  .createServer((request, response) => {
    response.statusCode = 302
    response.setHeader('Location', `https://${request.headers.host}${request.url}`)
    response.end()
  })
  .listen(80)
