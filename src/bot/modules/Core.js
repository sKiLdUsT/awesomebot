/*
    AwesomeBot Alero v1.0
    (c)2017-2018 sKiLdUsT <skil@skildust.com>
 */
'use strict'

const BaseModule = require('./BaseModule')
const AwesomeBotError = require('../../lib/Error')
const config = require('../../lib/Config')

module.exports = class Core extends BaseModule {
  constructor (bot) {
    super(bot, 'core', ['mod', 'admin'])
  }
  help (args, message) {
    let fields = []
    let commands = this._getFile('COMMANDS.md')
    if (commands === '') {
      throw new AwesomeBotError('COMMANDS file not found')
    }
    commands.match(/###[\s\S]+?---/g).forEach(command => {
      fields.push({
        name: command.match(/### (.+)/)[1],
        value: command.match(/\n([\s\S]+)?---/)[1].replace(/\/(\w+)\s/g, config.App.commandPrefix + '$1 ')
      })
    })
    if (args[1] !== undefined) fields = fields.filter(field => field.name.split(' ')[0] === args[1])
    if (fields.length === 0) message.channel.send('🔴 Something went wrong :c')
    else message.channel.send({embed: {title: 'Commands', fields}})
  }
  invite (args, message) {
    message.channel.send(`https://discordapp.com/oauth2/authorize?&client_id=${this.client.user.id}&scope=bot&permissions=0`)
    return true
  }
}
