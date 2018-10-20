/*
    AwesomeBot Alero v1.0
    (c)2017-2018 sKiLdUsT <skil@skildust.com>
 */
'use strict'

const Bot = require('../Bot')
const AwesomeBotError = require('../../lib/Error')
const fs = require('fs')
const path = require('path')

module.exports = class BaseModule {
  /**
   * Module constructor
   * @param {Bot} botInstance
   * @param {String} moduleId
   * @param {Array} permissions
   */
  constructor (botInstance, moduleId, permissions) {
    if (botInstance instanceof Bot) {
      this.bot = botInstance
    } else {
      throw new AwesomeBotError('Argument "botInstance" must be of type AwesomeBot Bot')
    }
    if (moduleId !== undefined && typeof moduleId === 'string') {
      this.moduleId = moduleId
    } else {
      throw new AwesomeBotError('Argument "moduleId" is not defined')
    }
    if (permissions !== undefined && typeof permissions === 'object') {
      this.permissions = permissions
    } else {
      throw new AwesomeBotError('Argument "moduleId" is not defined')
    }
    this._getConfig()
    this._checkStorage()
    this._checkCache()
  }

  /**
   * Get module config
   * @private
   */
  _getConfig () {
    this.config = this.bot.db.get('moduleConfig', 'config', {moduleId: this.moduleId})
  }

  /**
   * Checks if the module storage folder is present and if not creates it
   * @private
   */
  _checkStorage () {
    let self = this
    fs.readdir(path.resolve(__dirname, '../../../storage/modules/', self.moduleId), err => {
      if (err) {
        fs.mkdir(path.resolve(__dirname, '../../../storage/modules/', self.moduleId), () => {})
      }
    })
  }

  /**
   * Checks if the module cache folder is present and if not creates it
   * @private
   */
  _checkCache () {
    let self = this
    fs.readdir(path.resolve(__dirname, '../../../cache/', self.moduleId), err => {
      if (err) {
        fs.mkdir(path.resolve(__dirname, '../../../cache/', self.moduleId), () => {})
      }
    })
  }

  /**
   * Get a file from the module file storage
   * @param {String} name
   * @returns {Promise<Buffer>}
   */
  getFile (name) {
    let self = this
    return new Promise((resolve, reject) => {
      fs.readFile(path.resolve(__dirname, '../../../storage/modules', self.moduleId, name), (err, data) => {
        if (err) reject(err)
        resolve(data)
      })
    })
  }
  /**
   * Get a file from the module file cache
   * @param {String} name
   * @returns {Promise<Buffer>}
   */
  getFileFromCache (name) {
    let self = this
    return new Promise((resolve, reject) => {
      fs.readFile(path.resolve(__dirname, '../../../cache/', self.moduleId, name), (err, data) => {
        if (err) reject(err)
        resolve(data)
      })
    })
  }
}
