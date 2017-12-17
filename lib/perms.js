'use strict'

const DB = require('./db.js')
const BreakException = {}

class Permissions extends DB {
  constructor (guildId) {
    super(guildId)
    let db = this.db
    let permissions = new Map()
    db.prepare('SELECT id FROM permissions WHERE guildid = ?;').all(guildId).forEach(row => {
      permissions.set(row.id, {
        id: row.id,
        guildId,
        includes (search) {
          let value = false
          if (search.constructor !== Array) throw new TypeError('Input is not array')
          try {
            this.scopes.forEach(scope => {
              search.forEach(sVal => {
                if (sVal === scope) throw BreakException
              })
            })
          } catch (e) {
            if (e !== BreakException) throw e
            else value = true
          }
          return value
        },
        get scopes () {
          return db.prepare('SELECT scopes FROM permissions WHERE id = ? AND guildid = ?').get([this.id, this.guildId])['scopes'].split(',')
        },
        set scopes (scope) {
          if (scope.constructor !== Array && !this.scopes.includes(scope)) scope = this.scopes.slice(0).concat([scope])
          else if (scope.constructor !== Array) return
          db.prepare('UPDATE permissions SET scopes = ? WHERE id = ? AND guildid = ?').run([scope.join(), this.id, this.guildId])
        }
      })
    })
    return permissions
  }
}

module.exports = Permissions
