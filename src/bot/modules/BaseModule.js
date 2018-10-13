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
  }

  /**
   * Get module config
   * @private
   */
  _getConfig () {
    this.config = this.bot.db.get('moduleConfig', 'config', {moduleId: this.moduleId})
  }

  /**
   * Get a file from the module file storage
   * @param {String} name
   * @returns {String}
   * @private
   */
  async _getFile (name) {
    try {
      await fs.readdir(path.resolve(__dirname, '../../../cache/modules'))
      await fs.readdir(path.resolve(__dirname, '../../../cache/modules/', this.moduleId))
    } catch (e) {
      await fs.mkdir(path.resolve(__dirname, '../../../cache/modules'))
      await fs.mkdir(path.resolve(__dirname, '../../../cache/modules/', this.moduleId))
      return ''
    }
    try {
      return await fs.readFile(path.resolve(__dirname, '../../../cache/modules', this.moduleId, name))
    } catch (e) {
      return ''
    }
  }
}
