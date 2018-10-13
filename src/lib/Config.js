/*
    AwesomeBot Alero v1.0
    (c)2017-2018 sKiLdUsT <skil@skildust.com>
 */
'use strict'

const fs = require('fs')
const path = require('path')
const currentVersion = 2

/** A simple config management class */
module.exports = class Config {
  /**
   * Parse config. Migrate or copy default if needed.
   * @return {Object}
   */
  constructor () {
    try {
      this.config = require('../../config')
    } catch (e) {
      fs.copyFileSync(path.resolve(__dirname, '../defaultConfig.json'), path.resolve(__dirname, '../../config.json'))
      this.config = require('../../config')
    }
    this._checkConfig()
    return this.config
  }

  /**
   * Check config version, migrate if needed.
   * @private
   */
  _checkConfig () {
    if (this.config.version === undefined) {
      console.log('Config: Migrating from v1\n')
      let newConfig = require('../defaultConfigV2')
      this.config = this._migrateConfig(newConfig, this.config)
      fs.writeFileSync(path.resolve(__dirname, '../../config.json'), JSON.stringify(this.config))
    }
    if (this.config.version !== currentVersion) {
      console.log(`Config: Migration version ${this.config.version} to version ${currentVersion}`)
      Config.range(currentVersion - this.config.version, this.config.version).forEach(i => {
        let newConfig = require('../defaultConfigV' + i)
        this.config = this._migrateConfig(newConfig, this.config)
        fs.writeFileSync(path.resolve(__dirname, '../../config.json'), JSON.stringify(this.config))
      })
    }
  }

  /**
   * Migrate config
   * @param {Object} newConfig
   * @param {Object} configPoint
   * @return {Object}
   * @private
   */
  _migrateConfig (newConfig, configPoint) {
    for (let key in newConfig) {
      if (!newConfig.hasOwnProperty(key)) {
        continue
      }
      if (configPoint[key] === undefined) {
        configPoint[key] = newConfig[key]
      } else {
        console.log(configPoint[key])
        if (typeof configPoint[key] === 'object') {
          configPoint[key] = this._migrateConfig(newConfig[key], configPoint[key])
        }
      }
    }
    return configPoint
  }

  /**
   * Generate int range array
   * @param {int} size
   * @param {int} startAt
   * @return {int[]}
   */
  static range (size, startAt = 0) {
    return [...Array(size).keys()].map(i => i + startAt)
  }
}
