'use strict'
const fs = require('fs')
const Sqlite3 = require('better-sqlite3')
const log = require('./log.js')
const { execSync } = require('child_process')
const revision = String(execSync('git log -1 --oneline')).slice(0, 7)
const config = require('../../config.json')

class DB {
  constructor (guildId) {
    if (!fs.existsSync('./db.sqlite')) {
      log.debug('Database missing, recreating')
      this.db = new Sqlite3('./db.sqlite')
      this.db.prepare('CREATE TABLE IF NOT EXISTS guilds (id, config TEXT);').run()
      this.db.prepare('CREATE TABLE IF NOT EXISTS permissions (id, guildId, scopes TEXT);').run()
      if (fs.existsSync('./cache/cache.bin')) {
        log.debug('Migrating obsolete database')
        const migrate = JSON.parse(String(fs.readFileSync('./cache/cache.bin'))).guilds
        for (let id in migrate) {
          let guild = migrate[id]
          this.db.prepare(`INSERT INTO guilds VALUES (?, ?);`).run([
            id,
            JSON.stringify({
              core: {
                lastRev: guild.lastRev !== undefined ? guild.lastRev : '595f600',
                modules: ''
              }
            })
          ])
          let perm = this.db.prepare('INSERT INTO permissions VALUES (?, ?, ?)')
          for (let uid in guild.permissions) {
            let permission = ''
            switch (guild.permissions[uid]) {
              case 1:
                permission = 'core.mod'
                break
              case 2:
                permission = 'core.admin'
                break
            }
            perm.run([uid, id, permission])
          }
        }
      }
    } else {
      this.db = new Sqlite3('./db.sqlite')
    }
    if (this.db.prepare('SELECT * FROM guilds WHERE id = ?;').get(guildId) === undefined) {
      log.warn(`Guild ${guildId} not found in database, creating new entry`)
      this.db.prepare(`INSERT INTO guilds VALUES (?, ?);`).run([
        guildId, JSON.stringify({
          core: {
            lastRev: revision,
            modules: ''
          }
        })
      ])
      this.db.prepare(`INSERT INTO permissions VALUES (?, ?, 'core.admin');`).run([config.Discord.adminId, guildId])
    }
  }
}

module.exports = DB
