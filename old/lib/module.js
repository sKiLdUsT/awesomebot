'use strict'

const fs = require('fs')
const Bot = require('./core')

/** Class for module cache */
class ModuleCache {
  /**
   * Prepare cache
   * @param {string} name - The module name.
   */
  constructor (name) {
    this.path = `cache/${name}`
    try {
      fs.lstatSync(this.path).isDirectory()
    } catch (e) {
      if (e.code === 'ENOENT') fs.mkdirSync(this.path)
      else throw e
    }
  }

  /**
   * Creates a read stream for the specified cache file.
   * @param {*} key - The name of the requested file in cache.
   * @throws {ReferenceError} File not found.
   * @throws {Error} Unspecified error.
   */
  async getStream (key) {
    let retVal = false
    try {
      retVal = await fs.createReadStream(`${this.path}/${key}`)
    } catch (e) {
      if (e.code === 'ENOENT') throw new ReferenceError('File not found.')
    }
    if (retVal) return retVal
    else throw new Error('Unspecified error.')
  }

  /**
   * Creates a write stream for the specified cache file.
   * @param {*} key - The name of the requested file in cache.
   * @throws {ReferenceError} File not found.
   * @throws {Error} Unspecified error.
   */
  async writeStream (key) {
    let retVal = false
    try {
      retVal = await fs.createWriteStream(`${this.path}/${key}`)
    } catch (e) {
      if (e.code === 'ENOENT') throw new ReferenceError('File not found.')
    }
    if (retVal) return retVal
    else throw new Error('Unspecified error.')
  }
}

/** Class for instancing modules. */
module.exports = class Module {
  /**
   * Construct module base
   * @param {string} name - The module name.
   * @param {array} permissions - The permissions this module offers.
   * @param {Bot} instance - A valid Bot instance. Gets passed to the child module constructor on module invocation.
   */
  constructor (name, permissions, instance) {
    this.name = name.toLowerCase()
    if (!(permissions instanceof Array)) throw new TypeError('Module permissions not a valid array')
    this.permissions = permissions
    if (!(instance instanceof Bot)) throw new TypeError('Invalid bot instance')
    this.instance = instance
    this.cache = new ModuleCache(this.name)
  }
}
