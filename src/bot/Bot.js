/*
    AwesomeBot Alero v1.0
    (c)2017-2018 sKiLdUsT <skil@skildust.com>
 */
'use strict'

const Client = require('discord.js/src/client/Client')
const Guild = require('discord.js/src/structures/Guild')
const AwesomeBotError = require('../lib/Error')
const NotFoundError = require('../lib/NotFoundError')
const log = require('../lib/Log')
const DB = require('./DB')
const GuildSettings = require('./GuildSettings')
const GuildMember = require('./GuildMember')

module.exports = class Bot {
  constructor (client, guild) {
    log.debug('instanciate class Bot')
    if (client instanceof Client) {
      this.client = client
    } else {
      throw new AwesomeBotError('Argument "client" must be instance of discord.js Client')
    }

    if (guild instanceof Guild) {
      this.guild = guild
    } else {
      throw new AwesomeBotError('Argument "guild" must be instance of discord.js Guild')
    }

    this.db = new DB()
    this.settings = new GuildSettings(this.db, this.guild.id)
    this.members = new Map()
    this.modules = new Map()

    this.guild.members.forEach(member => {
      if (member.id !== this.client.id) {
        this.members.set(member.id, new GuildMember(this.db, this.guild.id, member.id))
      }
    })

    this.settings.modules.forEach(module => {
      let fileName = module.charAt(0).toUpperCase() + module.slice(1)
      this.modules.set(module, new (require(`./modules/${fileName}`))(this))
    })

    this.commands = new Map()

    // Internal functions for interacting with instance settings
    this._attachInternalCommands()

    for (let module of this.modules) {
      Object.getOwnPropertyNames(Object.getPrototypeOf(module[1])).forEach(command => {
        let func = module[1][command]
        if (!(func instanceof Function) || command.indexOf('_') === 0 || ['get', 'set', 'constructor'].includes(command)) {
          return
        }
        this.commands.set(command, {
          func,
          module: module[1]
        })
      }, this)
    }
  }
  exec (command, args, message) {
    if (!this.commands.has(command)) {
      throw new NotFoundError()
    }
    let reqCommand = this.commands.get(command)
    reqCommand.func.call(reqCommand.module, args.splice(1), message, this.members.get(message.author.id), this) ? log.debug('event BotCommand result success') : log.debug('event BotCommand result failed')
  }
  _attachInternalCommands () {
    this.commands.set('set', {
      func: function (args, message, member, bot) {
        if (!member.hasPermission(['core.admin'])) {
          message.channel.send('🔴 Unauthorized!')
          return false
        }

        let key = args[0]
        let value = args[1]

        if (bot.settings.config[key] === undefined) {
          message.channel.send('🔴 Unknown key!')
          return false
        }
        bot.settings.config[key] = value
        message.channel.send('⚪ Set successfully!')
        return true
      },
      module: this
    })
    this.commands.set('get', {
      func: function (args, message, member, bot) {
        if (!member.hasPermission(['core.admin'])) {
          message.channel.send('🔴 Unauthorized!')
          return false
        }

        let key = args[0]

        console.log(bot.settings.config, key)

        if (bot.settings.config[key] === undefined) {
          message.channel.send('🔴 Unknown key!')
          return false
        }

        message.channel.send(`⚪\n \`\`\`${key} = ${bot.settings.config[key]}\`\`\``)
        return true
      },
      module: this
    })
  }
}
