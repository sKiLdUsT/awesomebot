/*
    AwesomeBot Alero v1.0
    (c)2017-2018 sKiLdUsT <skil@skildust.com>
 */
'use strict'

const GuildMember = require('../GuildMember')
const BaseModule = require('./BaseModule')
const config = new (require('../../lib/Config'))()
const log = require('../../lib/Log')
const AwesomeBotError = require('../../lib/Error')

module.exports = class Core extends BaseModule {
  constructor (bot) {
    super(bot, 'core', ['mod', 'admin'])
  }

  /**
   * Get help message
   * @param {Object} args
   * @param {Message} message
   * @param {GuildMember} user
   */
  help (args, message, user) {
    let fields = []
    this.getFile('COMMANDS.md')
      .then(commands => {
        commands = String(commands)
        commands.match(/###[\s\S]+?---/g).forEach(command => {
          fields.push({
            name: command.match(/### (.+)/)[1],
            value: command.match(/\n([\s\S]+)?---/)[1].replace(/\/(\w+)\s/g, config.App.commandPrefix + '$1 ')
          })
        })
        if (args[0] !== undefined) fields = fields.filter(field => field.name.split(' ')[0] === args[0])
        if (fields.length === 0) message.channel.send('🔴 Something went wrong :c')
        else message.channel.send({embed: {title: 'Commands', fields}})
      })
      .catch(err => {
        log.debug('event BotError type internal')
        console.error(err)
        message.channel.send(`🔴 Whoops, while completing your request an internal error has occurred.`)
      })
    return true
  }
  /**
   * Get invite link
   * @param {Object} args
   * @param {Message} message
   * @param {GuildMember} user
   * @param {Bot} bot
   */
  invite (args, message, user, bot) {
    message.channel.send(`https://discordapp.com/oauth2/authorize?&client_id=${bot.client.user.id}&scope=bot&permissions=0`)
    return true
  }

  /**
   * Grant a user a specific permission
   * @param {Object} args
   * @param {Message} message
   * @param {GuildMember} user
   * @param {Bot} bot
   */
  grant (args, message, user, bot) {
    if (!(user instanceof GuildMember)) {
      throw new AwesomeBotError('Argument user must be of type discord.js Message')
    }

    if (!user.hasPermission(['core.admin'])) {
      message.channel.send('🔴 Unauthorized!')
      return false
    }

    if (args[0] === undefined || args[1] === undefined) {
      message.channel.send('🔴 Missing value(s)!')
      return false
    }

    let targetUser = args[0].replace(/<@(?:!)?([0-9]*)>/, '$1')
    let module = String(args[1]).split('.')[0]
    let permission = String(args[1]).split('.')[1]

    if (!message.channel.guild.members.has(targetUser)) {
      message.channel.send('🔴 User is not member of this server!')
      return false
    }

    if (bot.modules[module] === undefined) {
      message.channel.send('🔴 Module not found!')
      return false
    }

    if (!bot.modules[module].permissions.includes(permission)) {
      message.channel.send('🔴 Permission not found!')
      return false
    }

    bot.members.get(targetUser).setPermission(`${module}.${permission}`)
    message.channel.send(`⚪ Gave <@${targetUser}> permission **${module}.${permission}**`)
    return true
  }

  /**
   * Revoke a user a specific permission
   * @param {Object} args
   * @param {Message} message
   * @param {GuildMember} user
   * @param {Bot} bot
   */
  revoke (args, message, user, bot) {
    if (!(user instanceof GuildMember)) {
      throw new AwesomeBotError('Argument user must be of type discord.js Message')
    }

    if (!user.hasPermission(['core.admin'])) {
      message.channel.send('🔴 Unauthorized!')
      return false
    }

    if (args[0] === undefined || args[1] === undefined) {
      message.channel.send('🔴 Missing value(s)!')
      return false
    }

    let targetUser = args[0].replace(/<@(?:!)?([0-9]*)>/, '$1')
    let module = String(args[1]).split('.')[0]
    let permission = String(args[1]).split('.')[1]

    if (!message.channel.guild.members.has(targetUser)) {
      message.channel.send('🔴 User is not member of this server!')
      return false
    }

    if (bot.modules[module] === undefined) {
      message.channel.send('🔴 Module not found!')
      return false
    }

    if (!bot.modules[module].permissions.includes(permission)) {
      message.channel.send('🔴 Permission not found!')
      return false
    }

    bot.members.get(targetUser).removePermission(`${module}.${permission}`)
    message.channel.send(`⚪ Revoked <@${targetUser}> permission **${module}.${permission}**`)
    return true
  }

  /**
   * Adjust volume of media played through bot
   * @param {Object} args
   * @param {Message} message
   * @param {GuildMember} user
   * @param {Bot} bot
   * @returns {boolean}
   */
  vol (args, message, user, bot) {
    if (!(user instanceof GuildMember)) {
      throw new AwesomeBotError('Argument user must be of type discord.js Message')
    }

    if (args[0] === undefined) {
      message.channel.send('🔴 Missing value!')
      return false
    }

    let targetVolume = args[0]

    if (isNaN(targetVolume)) {
      message.channel.send('🔴 Value is not a number!')
      return false
    }

    targetVolume = (~~targetVolume / 100)

    if (targetVolume > 0.05) {
      message.channel.send('🔴 Value is too small!')
    }

    bot.settings.config.volume = targetVolume
    return true
  }
}
