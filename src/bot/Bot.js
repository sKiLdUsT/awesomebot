/*
    AwesomeBot Alero v1.0
    (c)2017-2018 sKiLdUsT <skil@skildust.com>
 */
'use strict'

const Client = require('discord.js/src/client/Client')
const Guild = require('discord.js/src/structures/Guild')
const AwesomeBotError = require('../lib/Error')
const NotFoundError = require('../lib/NotFoundError')
const config = new (require('../lib/Config'))()
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

    this.guild.members.forEach(member => {
      if (member.id !== this.client.id) {
        this.members.set(member.id, new GuildMember(this.db, this.guild, member.id))
      }
    })
    this.modules = {
      core: new (require(`./modules/Core`))(this)
    }
    this.commands = {}

    this.modules.forEach(module => {
      for (let command in module) {
        if (!module.hasOwnProperty(command)) {
          continue
        }
        if (command.substr(0, 1) === '_') {
          continue
        }
        this.commands[command] = module[command]
      }
    })
  }
  exec(command, args, message) {
    if (this.commands[command] === undefined) {
      throw new NotFoundError()
    }
    this.commands[command](args, message)
  }
}
