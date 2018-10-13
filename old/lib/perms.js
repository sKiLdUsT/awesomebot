'use strict'

const DB = require('./db.js')
const BreakException = {}

class Permissions extends DB {
  constructor (guildId, instance) {
    super(guildId)
    let db = this.db
    this.instance = instance
    this.permissions = new Map()
    let self = this

    function newRow (row) {
      self.permissions.set(row.id, {
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
      this.db.prepare('SELECT id FROM permissions WHERE guildid = ?;').all(guildId).forEach(newRow)
      return new Proxy(this.permissions, {
        get: (obj, prop) => {
          if (obj.has(prop)) return obj.get(prop)
          else if (this.instance.guild.members.has(prop)) {
            this.db.prepare("INSERT INTO permissions VALUES(?, ?, '')").run([prop, this.guildId])
            newRow({id: prop, guildId: this.guildId, scopes: ''})
            return obj.get(prop)
          } else return ReferenceError('User not part of this guild.')
        },
        set: (obj, prop, val) => {
          console.log(obj, prop, val)
          return false
        }
      })
    }
  }
}

module.exports = Permissions
