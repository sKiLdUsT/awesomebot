'use strict'
const fs = require('fs')
const Sqlite3 = require('better-sqlite3')
const log = require('./log.js')
const { execSync } = require('child_process')
const revision = String(execSync('git log -1 --oneline')).slice(0, 7)
const config = require('../config.json')

class DB {
  constructor (guildId) {
    this.guildId = guildId
    if (!fs.existsSync('./db.sqlite')) {
      log.debug('Database missing, recreating')
      this.db = new Sqlite3('./db.sqlite')
      this.db.prepare('CREATE TABLE IF NOT EXISTS guilds (id, voiceChannel, onlyListenIn, lastRev, modules TEXT, volume FLOAT, listLimit, maxVolume, maxLength INT);').run()
      this.db.prepare('CREATE TABLE IF NOT EXISTS permissions (id, guildId, scopes TEXT);').run()
      if (fs.existsSync('./cache/cache.bin')) {
        log.debug('Migrating obsolete database')
        const migrate = JSON.parse(String(fs.readFileSync('./cache/cache.bin'))).guilds
        for (let id in migrate) {
          let guild = migrate[id]
          this.db.prepare(
            `INSERT INTO guilds VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`).run([
              id,
              guild.voiceChannel !== undefined ? guild.voiceChannel : 0,
              guild.onlyListenIn !== undefined ? guild.onlyListenIn : 0,
              guild.lastRev !== undefined ? guild.lastRev : '595f600',
              'core',
              guild.volume,
              10,
              guild.maxVolume,
              guild.maxLength
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
      this.db.prepare(`INSERT INTO guilds VALUES (?, '0', '0', ?, 'core,media', 0.2, 10, 100, 900);`).run([guildId, revision])
      this.db.prepare(`INSERT INTO permissions VALUES (?, ?, 'core.admin');`).run([config.Discord.adminId, guildId])
    }
  }
  get voiceChannel () {
    return this.db.prepare('SELECT voiceChannel FROM guilds WHERE id = ?;').get(this.guildId)['voiceChannel']
  }
  get onlyListenIn () {
    return this.db.prepare('SELECT onlyListenIn FROM guilds WHERE id = ?;').get(this.guildId)['onlyListenIn']
  }
  get lastRev () {
    return this.db.prepare('SELECT lastRev FROM guilds WHERE id = ?;').get(this.guildId)['lastRev']
  }
  get modules () {
    return this.db.prepare('SELECT modules FROM guilds WHERE id = ?;').get(this.guildId)['modules'].split(',')
  }
  get listLimit () {
    return this.db.prepare('SELECT listLimit FROM guilds WHERE id = ?;').get(this.guildId)['listLimit']
  }
  get volume () {
    return this.db.prepare('SELECT volume FROM guilds WHERE id = ?;').get(this.guildId)['volume']
  }
  get maxVolume () {
    return this.db.prepare('SELECT maxVolume FROM guilds WHERE id = ?;').get(this.guildId)['maxVolume']
  }
  get maxLength () {
    return this.db.prepare('SELECT maxLength FROM guilds WHERE id = ?;').get(this.guildId)['maxLength']
  }
  set voiceChannel (voiceChannel) {
    this.db.prepare('UPDATE guilds SET voiceChannel = ? WHERE id = ?;').run([voiceChannel, this.guildId])
  }
  set onlyListenIn (onlyListenIn) {
    this.db.prepare('UPDATE guilds SET onlyListenIn = ? WHERE id = ?;').run([onlyListenIn, this.guildId])
  }
  set lastRev (lastRev) {
    this.db.prepare('UPDATE guilds SET lastRev = ? WHERE id = ?;').run([lastRev, this.guildId])
  }
  set listLimit (listLimit) {
    this.db.prepare('UPDATE guilds SET listLimit = ? WHERE id = ?;').run([listLimit, this.guildId])
  }
  set modules (modules) {
    if (modules.constructor !== Array && !this.modules.includes(modules)) modules = this.modules.slice(0).concat([modules])
    else if (modules.constructor !== Array) return
    this.db.prepare('UPDATE guilds SET modules = ? WHERE id = ?;').run([modules.join(), this.guildId])
  }
  set volume (volume) {
    this.db.prepare('UPDATE guilds SET volume = ? WHERE id = ?;').run([volume, this.guildId])
  }
  set maxVolume (maxVolume) {
    this.db.prepare('UPDATE guilds SET maxVolume = ? WHERE id = ?;').run([maxVolume, this.guildId])
  }
  set maxLength (maxLength) {
    this.db.prepare('UPDATE guilds SET maxLength = ? WHERE id = ?;').run([maxLength, this.guildId])
  }
}

module.exports = DB
