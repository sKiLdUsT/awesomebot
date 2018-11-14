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

    let settings = this.db.get('guilds', '*', {id: this.guildId})
    this.settings = {}
    if (settings === undefined) {
      this.settings = {
        modules: ['core'],
        config: {
          greetNewUsers: true,
          greetMessage: 'Welcome #member to #server! Enjoy your stay :)',
          informOnLeave: true,
          leaveMessage: 'Aww shucks, #member left us :(',
          ouputErrors: false,
          lastRev: '4e5cd57',
          onlyListenIn: '0',
          voiceChannel: '0'
        }
      }
      this._syncToDB(true).catch(e => {
        log.error(e)
        log.warn('Syncing config with db failed!')
      })
    } else {
      // noinspection JSCheckFunctionSignatures
      this.settings.config = JSON.parse(settings.config)
      this.settings.modules = settings.modules.split(',')
    }
  }
  async _syncToDB (doNewEntry) {
    if (doNewEntry !== undefined && doNewEntry) {
      this.db.insertReplace('guilds', [
        this.guildId,
        this.settings.modules.join(','),
        JSON.stringify(this.settings.config)
      ])
    } else {
      this.db.update('guilds', {
        modules: this.settings.modules.join(','),
        config: JSON.stringify(this.settings.config)
      }, {
        id: this.guildId
      })
    }
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
