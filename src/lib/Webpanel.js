/*
    AwesomeBot Alero v1.0
    (c)2017-2018 sKiLdUsT <skil@skildust.com>
 */
'use strict'

const path = require('path')
const childProcess = require('child_process')
const log = require('../lib/Log')

module.exports = class Webpanel {
  /**
   * Class constructor
   * @param {Map} appInstances
   */
  constructor (appInstances) {
    log.debug('instanciate class Webpanel')
    this.webWorker = null
    this.appInstances = appInstances
    this.spawnWorker()
  }

  spawnWorker () {
    log.debug('action WebPanel spawnWorker')
    this.webWorker = childProcess.fork(path.resolve(__dirname, '../webpanel/worker.js'))
    this.webWorker
      .on('message', this._handleWorkerMessage)
      .on('error', this._handleWorkerError)
      .on('exit', () => {
        log.warn('Webpanel worker died, restarting...')
        this.spawnWorker()
      })
  }

  _handleWorkerMessage (message) {

  }

  _handleWorkerError () {

  }
}
