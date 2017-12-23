'use strict'

const config = require('../config.json')

module.exports = class {
  constructor () {
    this.permissions = []
  }
  ping (args, message) {
    message.channel.send('Pong!')
    return true
  }
  crash (args, message) {
    if (message.author.id !== config.Discord.adminId) {
      message.channel.send('✖ Unauthorized!')
      return false
    }
    message.channel.send('✔ Crashing... :c')
    throw new Error('Test crash')
  }
  hardcrash (args, message) {
    if (message.author.id !== config.Discord.adminId) {
      message.channel.send('✖ Unauthorized!')
      return false
    }
    message.channel.send('✔ Crashing... :c')
    process.emit('uncaughtException', new Error('Test crash'))
    return true
  }
}
