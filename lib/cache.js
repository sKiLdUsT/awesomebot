'use strict'
const fs = require('fs')
const log = require('./log')

class Cache {
  constructor () {
    if (fs.existsSync('cache/cache.bin')) {
      let restore = JSON.parse(fs.readFileSync('cache/cache.bin'))
      for (let key in restore) {
        this[key] = restore[key]
      }
      log.debug('Instance restored')
    } else {
      fs.closeSync(fs.openSync('cache/cache.bin', 'w'))
      log.debug('Instance cache created')
    }
    setInterval(() => this.save(), 30000)
  }
  save () {
    let toSave = {}
    for (let key in this) {
      if (!this.hasOwnProperty(key)) continue
      if (typeof this[key] === 'function') continue
      toSave[key] = this[key]
    }
    fs.writeFile('cache/cache.bin', JSON.stringify(toSave), () => {
      log.debug('Instance saved')
    })
  }
  saveSync () {
    let toSave = {}
    for (let key in this) {
      if (!this.hasOwnProperty(key)) continue
      if (typeof this[key] === 'function') continue
      toSave[key] = this[key]
    }
    fs.writeFileSync('cache/cache.bin', JSON.stringify(toSave))
    log.debug('Instance saved')
  }
}

module.exports = new Cache()
