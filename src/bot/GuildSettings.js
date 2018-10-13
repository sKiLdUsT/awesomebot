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
  }
}
