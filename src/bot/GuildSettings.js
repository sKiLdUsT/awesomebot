/*
    AwesomeBot Alero v1.0
    (c)2017-2018 sKiLdUsT <skil@skildust.com>
 */
'use strict'

const AwesomeBotError = require('../lib/Error')
const DB = require('./DB')
const log = require('../lib/Log')

module.exports = class GuildSettings {
  constructor (db, guildId) {
    log.debug('instanciate class GuildMember')
    if (db !== undefined && db instanceof DB) {
      this.db = db
    } else {
      throw new AwesomeBotError('Argument "db" needs to be of type AwesomeBot DB')
    }
    if (guildId === undefined || typeof guildId !== 'string') {
      throw new AwesomeBotError('Argument "guildId" is not defined')
    } else {
      this.guildId = guildId
    }

    this.settings = this.db.get('guilds', '*', {id: this.guildId})
    if (this.settings === undefined) {
      this.db.put('guilds', [this.guildId, 'core', JSON.stringify({
        greetNewUsers: true,
        greetMessage: 'Welcome #member to #server! Enjoy your stay :)',
        informOnLeave: false,
        leaveMessage: 'Aww shucks, #member left us :(',
        ouputError: false
      })])
      this.settings = {
        modules: ['core'],
        config: {
          greetNewUsers: true,
          greetMessage: 'Welcome #member to #server! Enjoy your stay :)',
          informOnLeave: false,
          leaveMessage: 'Aww shucks, #member left us :(',
          ouputError: false
        }
      }
    } else {
      // noinspection JSCheckFunctionSignatures
      this.settings.config = JSON.parse(this.settings.config)
      this.settings.modules = this.settings.modules.split(',')
    }
  }
  async _syncToDB () {
    this.db.update('guilds', {
      modules: this.settings.modules.join(','),
      config: JSON.stringify(this.settings.config)
    }, {
      id: this.guildId
    })
  }
  get config () {
    let self = this
    return new Proxy(this.settings.config, {
      set: function (obj, name, value) {
        obj[name] = value
        self.settings.config[name] = value
        self._syncToDB().catch(e => {
          log.error(e)
          log.warn('Syncing config with db failed!')
        })
        return true
      }
    })
  }
  get modules () {
    let self = this
    return new Proxy(this.settings.modules, {
      set: function (obj, name, value) {
        obj[name] = value
        self.settings.modules[name] = value
        self._syncToDB().catch(e => {
          log.error(e)
          log.warn('Syncing config with db failed!')
        })
        return true
      }
    })
  }
  set config (value) {
    this.settings.config = value
    this._syncToDB().catch(e => {
      log.error(e)
      log.warn('Syncing config with db failed!')
    })
    return true
  }
  set modules (value) {
    this.settings.modules = value
    this._syncToDB().catch(e => {
      log.error(e)
      log.warn('Syncing config with db failed!')
    })
    return true
  }
}
