/*
    AwesomeBot Alero v1.0
    (c)2017-2018 sKiLdUsT <skil@skildust.com>
 */
'use strict'

const config = new (require('./Config'))()
const Client = require('discord.js/src/client/Client')
const AwesomeBotError = require('./Error')
const log = require('./Log')
const fs = require('fs')

/** Class for tool functions */
module.exports = class Tools {
  /**
   * Construct class with discord client instance
   * @param {Client} client
   */
  constructor (client) {
    log.debug('instanciate class Tools')
    if (client instanceof Client) {
      this.client = client
    } else {
      throw new AwesomeBotError('Argument "client" must be instance of discord.js Client')
    }
  }

  /**
   * Clean up after exit signal or fatal error
   * @param {Error} [e]
   * @returns {Promise}
   */
  async selfCleanup (e) {
    if (e !== undefined && e instanceof Error) {
      let errorData = JSON.stringify({
        error: e.toString(),
        timestamp: Date.now()
      })
      fs.writeFileSync('.dirtyexit', errorData)
      await this.reportToAdmin(e)
      await this.handleInterrupt()
    } else {
      await this.handleInterrupt()
    }
  }

  /**
   * Handle signal interrupt, can also be used to just exit the application
   * @returns {Promise<boolean>}
   */
  async handleInterrupt () {
    log.warn('Caught interrupt signal, cleaning...')
    try {
      await this.client.destroy()
    } catch (e) {
      log.error(e)
    }
    global.process.exit()
    return true
  }

  /**
   *
   * @param {Error} e
   * @return {Promise}
   */
  async reportToAdmin (e) {
    if (config.Discord.reportErrorsToAdmin) {
      const adminUser = await this.client.fetchUser(config.Discord.adminId)
      const channel = await adminUser.createDM()
      await channel.sendMessage(`✖ Critical Error occured\n\`\`\`[${log.date()}] ${e.stack}\`\`\``)
      await this.client.destroy()
    }
    return true
  }
}
