/*
    AwesomeBot Alero v1.0
    (c)2017-2018 sKiLdUsT <skil@skildust.com>
 */
'use strict'

const AwesomeBotError = require('../lib/Error')
const DB = require('./DB')
const log = require('../lib/Log')

module.exports = class GuildMember {
  constructor (db, guildId, memberId) {
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
    if (guildId === undefined || typeof guildId !== 'string') {
      throw new AwesomeBotError('Argument "memberId" is not defined')
    } else {
      this.memberId = memberId
    }

    this.permissions = this.db.get('permissions', 'scopes', {memberId: this.memberId, guildId: this.guildId})
  }
}