/*
    AwesomeBot Alero v1.0
    (c)2017-2018 sKiLdUsT <skil@skildust.com>
 */
'use strict'

const log = require('../lib/Log')
const AwesomeBotException = require('../lib/Error')
const fs = require('fs')
const path = require('path')
const Sqlite3 = require('better-sqlite3')

/** Class for Database management */
module.exports = class DB {
  /**
   * Class constructor
   */
  constructor () {
    log.debug('instanciate class DB')
    this.dbPath = path.resolve(__dirname, '../../db.sqlite')

    this._prepareDB()
  }

  /**
   * Prepare DB
   * @private
   */
  _prepareDB () {
    if (!fs.existsSync(this.dbPath)) {
      log.warn('Database missing, recreating')
      this._createDB()
    } else {
      this.db = new Sqlite3(this.dbPath)
    }
    if (fs.existsSync(path.resolve(__dirname, '../../cache/cache.bin'))) {
      this._migrateOldDB()
    }
  }

  /**
   * Create DB if nonexistent
   * @private
   */
  _createDB () {
    this.db = new Sqlite3(this.dbPath)
    let schema = String(fs.readFileSync(path.resolve(__dirname, '../dbSchema.sql')))
    this.db.prepare(schema).run()
  }

  /**
   * Migrate old >v0.4 "DB" schema
   * @private
   */
  _migrateOldDB () {
    log.info('Found old database (probably from an earlier version of this bot), migrating')
    const migrate = JSON.parse(String(fs.readFileSync(path.resolve(__dirname, '../../cache/cache.bin')))).guilds
    for (let id in migrate) {
      if (!migrate.hasOwnProperty(id)) {
        continue
      }
      let guild = migrate[id]
      this.db.prepare(`INSERT INTO guilds VALUES (?, ?, ?);`).run([
        id,
        'core',
        JSON.stringify({
          core: {
            lastRev: guild.lastRev !== undefined ? guild.lastRev : '595f600'
          }
        })
      ])
      let perm = this.db.prepare('INSERT INTO permissions VALUES (?, ?, ?);')
      for (let uid in guild.permissions) {
        if (!guild.permissions.hasOwnProperty(uid)) {
          continue
        }
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

  /**
   * Get a single entry from DB
   * @param {String} tableName
   * @param {String} key
   * @param {Object} valArgs
   */
  get (tableName, key, valArgs) {
    if (tableName === undefined || typeof tableName !== 'string') {
      throw new AwesomeBotException('Arguemnt "tableName" is not defined')
    }
    if (valArgs === undefined || typeof valArgs !== 'object') {
      throw new AwesomeBotException('Arguemnt "valArgs" is not defined')
    }

    let args = []
    let argsStmt = 'WHERE '
    let i = 1
    for (let key in valArgs) {
      args.push(valArgs[key])
      argsStmt += '? = ?'
      if (i < Object.keys(valArgs).length) {
        i++
        argsStmt += ' AND'
      }
    }

    let statement = this.db.prepare('SELECT ? from ? ' + argsStmt + ';')
    let result = {}

    try {
      result = statement.get([key, tableName].concat(args))
    } catch (e) {
      return result
    }

    if (result === undefined) {
      result = {}
    }

    return result
  }

  /**
   * Get all entries from DB
   * @param tableName
   * @param key
   */
  getAll (tableName, key) {
    let statement = this.db.prepare('SELECT ? from ?;')
    let result = {}

    try {
      result = statement.all([key, tableName])
    } catch (e) {
      return result
    }

    if (result === undefined) {
      result = {}
    }

    return result
  }
}
