'use strict'

const path = require('path')
const {Worker} = require('worker_threads')
const log = require('../lib/Log')

class Webpanel {
  /**
   * Class constructor
   * @param {Map} appInstances
   */
  constructor (appInstances) {
    this.webWorker = null
    this.appInstances = appInstances
    this.spawnWorker()
  }

  spawnWorker () {
    this.webWorker = new Worker(path.resolve(__dirname, '/../webpanel/worker.js'))
    this.webWorker
      .on('message', this._handleWorkerMessage)
      .on('error', this._handleWorkerError)
      .on('exit', () => {
        log.warn('Webpanel worker died, restarting...')
        this.spawnWorker()
      })
  }

  _handleWorkerMessage () {

  }

  _handleWorkerError () {

  }
}
