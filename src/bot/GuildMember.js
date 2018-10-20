/*
    AwesomeBot Alero v1.0
    (c)2017-2018 sKiLdUsT <skil@skildust.com>
 */
'use strict'

const AwesomeBotError = require('../lib/Error')
const DB = require('./DB')
const log = require('../lib/Log')
const config = new (require('../lib/Config'))()

module.exports = class GuildMember {
  constructor (db, guildId, memberId) {
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
    if (guildId === undefined || typeof guildId !== 'string') {
      throw new AwesomeBotError('Argument "memberId" is not defined')
    } else {
      this.memberId = memberId
    }

    this.permissions = this.db.get('permissions', 'scopes', {memberId: this.memberId, guildId: this.guildId})

    if (this.permissions === undefined) {
      this.permissions = []
      if (this.memberId === config.Discord.adminId) {
        this.setPermission('core.admin')
      }
    } else {
      this.permissions = this.permissions.scopes.split(',')
    }
  }

  /**
   * Check if user has necessary permission
   * @param {Array} possiblePermissions
   * @returns {Boolean}
   */
  hasPermission (possiblePermissions) {
    let result = false
    possiblePermissions.forEach(perm => {
      if (~this.permissions.indexOf(perm)) {
        result = true
      }
    })
    return result
  }

  setPermission (permission) {
    if (this.permissions.length === 0) {
      this.db.put('permissions', [this.memberId, this.guildId, permission])
      this.permissions.push(permission)
    } else {
      if (!this.permissions.includes(permission)) {
        this.permissions.push(permission)
        this.db.update('permissions', {scopes: this.permissions.join(',')}, {memberId: this.memberId, guildId: this.guildId})
      }
    }
  }

  removePermission (permission) {
    if (this.permissions.length !== 0 && this.permissions.includes(permission)) {
      this.permissions.splice(this.permissions.indexOf(permission), 1)
      this.db.update('permissions', {scopes: this.permissions.join(',')}, {memberId: this.memberId, guildId: this.guildId})
    }
  }
}
