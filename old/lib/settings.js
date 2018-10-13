'use strict'

const DB = require('./db')

class Settings extends DB {
  constructor (guildId) {
    super(guildId)
    this.cache = this.db.prepare('SELECT config FROM guilds WHERE id = ?').get(this.guildId)
    return new Proxy(this.cache, {
      set: (obj, prop, val) => {
        console.log(obj, prop, val)
        return false
      }
    })
  }
}

module.exports = Settings
