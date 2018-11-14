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
    this.db = new Sqlite3(this.dbPath, {memory: false, readonly: false, fileMustExist: false})
    let statement = this.db.prepare('select "name" from "sqlite_master" where type="table" and name=?;')
    if (statement.get(['guilds']) === undefined || statement.get(['modules']) === undefined || statement.get(['permissions']) === undefined || statement.get(['moduleConfig']) === undefined) {
      this._createDB()
    }
    if (fs.existsSync(path.resolve(__dirname, '../../cache/cache.bin'))) {
      this._migrateOldDB()
    }
  }

  /**
   * Create DB if nonexistent or incomplete
   * @private
   */
  _createDB () {
    log.warn('DB missing, recreating')
    log.debug('action CreateChangeDBSchema')
    this.db = new Sqlite3(this.dbPath)
    let schema = String(fs.readFileSync(path.resolve(__dirname, '../dbSchema.sql'))).split('\n')
    schema.forEach(row => {
      log.debug(`action ExecDB stmt "${row}"`)
      this.db.exec(row)
    })
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
      this.db.prepare(`insert into guilds values (?, ?, ?);`).run([
        id,
        'core',
        JSON.stringify({
          core: {
            lastRev: guild.lastRev !== undefined ? guild.lastRev : '595f600'
          }
        })
      ])
      let perm = this.db.prepare('insert into permissions values (?, ?, ?);')
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
      throw new AwesomeBotException('Argument "tableName" is not defined')
    }
    if (valArgs === undefined || typeof valArgs !== 'object') {
      throw new AwesomeBotException('Argument "valArgs" is not defined')
    }

    let args = []
    let argsStmt = 'where '
    let i = 1
    for (let key in valArgs) {
      args.push(key)
      args.push(`"${valArgs[key].replace(/"/g, '""')}"`)
      argsStmt += '? = ?'
      if (i < Object.keys(valArgs).length) {
        i++
        argsStmt += ' and '
      }
    }

    let stmt = (' ' + `select ${key} from ${tableName} ${argsStmt};`).slice(1)
    args.forEach(arg => {
      stmt = stmt.replace(/[?]/, arg)
    })

    let statement = this.db.prepare(stmt)
    let result = {}

    try {
      log.debug(`action ExecDB stmt "${stmt}"`)
      result = statement.get()
    } catch (e) {
      return result
    }

    return result
  }

  /**
   * Get all entries from DB
   * @param tableName
   * @param key
   */
  getAll (tableName, key) {
    let statement = this.db.prepare(`select ${key} from ${tableName};`)
    let result = {}

    try {
      log.debug(`action ExecDB stmt "select ${key} from ${tableName};"`)
      result = statement.all()
    } catch (e) {
      return result
    }

    return result
  }

  /**
   * Put values into DB
   * @param {String} tableName
   * @param {Array} values
   * @returns {boolean}
   */
  put (tableName, values) {
    let argsStmt = []
    values.forEach(() => {
      argsStmt.push('?')
    })

    let statement = this.db.prepare(`insert into ${tableName} values (${argsStmt.join(',')});`)

    let stmt = (' ' + `insert into ${tableName} values (${argsStmt.join(',')});`).slice(1)
    values.forEach(arg => {
      stmt = stmt.replace(/[?]/, `"${arg.replace(/"/g, '""')}"`)
    })

    try {
      log.debug(`action ExecDB stmt "${stmt}"`)
      statement.run(values)
    } catch (e) {
      return false
    }

    return true
  }

  /**
   *
   * @param {String} tableName
   * @param {Object} values
   * @param {Object} search
   * @returns {boolean}
   */
  update (tableName, values, search) {
    if (tableName === undefined || typeof tableName !== 'string') {
      throw new AwesomeBotException('Argument "tableName" is not defined')
    }
    if (values === undefined || typeof values !== 'object') {
      throw new AwesomeBotException('Argument "key" is not defined')
    }
    if (search === undefined || typeof search !== 'object') {
      throw new AwesomeBotException('Argument "key" is not defined')
    }

    let args = []
    let searchArgsStmt = ''
    let argsStmt = ''
    let i = 1
    for (let key in values) {
      args.push(key)
      args.push(`"${values[key].replace(/"/g, '""')}"`)
      argsStmt += '? = ?'
      if (i < Object.keys(values).length) {
        i++
        argsStmt += ','
      }
    }
    for (let key in search) {
      args.push(key)
      args.push(`"${search[key].replace(/"/g, '""')}"`)
      searchArgsStmt += '? = ?'
      if (i < Object.keys(search).length) {
        i++
        searchArgsStmt += ' and '
      }
    }

    let stmt = `update ${tableName} set ${argsStmt} where ${searchArgsStmt};`
    args.forEach(arg => {
      stmt = stmt.replace(/[?]/, arg)
    })

    let statement = this.db.prepare(stmt)

    try {
      log.debug(`action ExecDB stmt "${stmt}"`)
      statement.run()
    } catch (e) {
      log.error(e)
      return false
    }

    return true
  }
  /**
   *
   * @param {String} tableName
   * @param {Object} values
   * @returns {boolean}
   */
  insertReplace (tableName, values) {
    let argsStmt = []
    values.forEach(() => {
      argsStmt.push('?')
    })

    let statement = this.db.prepare(`insert into ${tableName} values (${argsStmt.join(',')});`)

    let stmt = (' ' + `insert or replace into ${tableName} values (${argsStmt.join(',')});`).slice(1)
    values.forEach(arg => {
      stmt = stmt.replace(/[?]/, `"${arg.replace(/"/g, '""')}"`)
    })

    try {
      log.debug(`action ExecDB stmt "${stmt}"`)
      statement.run(values)
    } catch (e) {
      return false
    }

    return true
  }
}
