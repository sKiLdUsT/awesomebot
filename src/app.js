/*
    AwesomeBot Alero v1.0
    (c)2017-2018 sKiLdUsT <skil@skildust.com>
 */
'use strict'

const log = require('./lib/Log')
log.debug('state initClasses')

const Discord = require('discord.js')
const Client = new Discord.Client()
const tools = new (require('./lib/Tools'))(Client)
const config = new (require('./lib/Config'))()
const AwesomeBotError = require('./lib/Error')
const NotFoundError = require('./lib/NotFoundError')
const Bot = require('./bot/Bot')
const pjson = require('../package')
const opn = require('opn')

const instances = new Map()

log.debug('state bindErrorHandling')

process
  .on('SIGINT', tools.selfCleanup.bind(tools))
  .on('SIGTERM', tools.selfCleanup.bind(tools))
  .on('SIGHUP', tools.selfCleanup.bind(tools))
  .on('uncaughtException', tools.selfCleanup.bind(tools))

log.debug('state initClient')
log.info(`"${config.App.botName}" - Built on Awesomebot Alero v${pjson.version}`)
log.info(`Loading...`)

Client
  .on('ready', async () => {
    log.debug('event clientReadyEvent')
    await Client.user.setPresence({game: {name: `Awesomebot Alero - Build ${pjson.version}`}})
    log.debug('action clientPresenceSet')
    // TODO: Test this logic
    if (Client.user.username !== config.App.botName) {
      log.debug('event clientNameMismatch')
      log.warn(`Bot has username ${Client.user.username}, but is configured to use ${config.App.botName}. Changing this now, you might want to check that again.`)
      // await Client.user.setUsername(config.App.botName)
    }
    if (Client.guilds.size === 0) {
      log.debug('event clientGuildSizeNull')
      log.warn(`No guilds found. You can add this bot with this link: https://discordapp.com/oauth2/authorize?&client_id=${Client.user.id}&scope=bot&permissions=0`)
      try {
        await opn(`https://discordapp.com/oauth2/authorize?&client_id=${Client.user.id}&scope=bot&permissions=0`)
      } catch (e) {
        log.error(e)
      }
    } else {
      log.debug('action ClientAttachBotInstances')
      Client.guilds.forEach(guild => {
        log.debug(`action ClientAttachBotInstance guildId ${guild.id}`)
        instances.set(guild.id, new Bot(Client, guild))
      })
      log.debug('event ClientAttachBotInstancesDone')
      log.info('Ready!')
    }
  })
  .on('guildCreate', guild => {
    log.debug(`event GuildCreate guildId ${guild.id}`)
    log.info(`Joining new guild ${guild.id}`)
    instances.set(guild.id, new Bot(Client, guild))
  })
  .on('guildDelete', async guild => {
    log.debug(`event GuildDelete guildId ${guild.id}`)
    log.warn(`Removed from guild ${guild.id}`)
    await instances.get(guild.id)._delete()
    instances.delete(guild.id)
  })
  .on('guildMemberAdd', member => {
    log.debug(`event GuildMemberAdd guildId ${member.guild.id}`)
    instances.get(member.guild.id)._newUser(member)
  })
  .on('guildmemberRemove', member => {
    log.debug(`event GuildMemberRemove guildId ${member.guild.id}`)
    instances.get(member.guild.id)._deleteUser(member)
  })
  .on('message', message => {
    log.debug('event ClientMessageReceived')
    if (message.author.bot || message.content.indexOf(config.App.commandPrefix) !== 0) {
      log.debug('event ClientMessageDismissed reason unrelated')
      return
    }
    if (message.channel.type === 'dm' && (message.content !== '.help'.replace('.', config.App.commandPrefix) && message.content !== '.invite'.replace('.', config.App.commandPrefix))) {
      log.debug('event ClientMessageDismissed reason privateMessage')
      message.reply('🔴 You can\'t use this bot in private messages.')
      return
    }
    let args = message.content.split(/ +/g)
    let command = args[0].slice(config.App.commandPrefix.length).replace('_', '').replace('constructor', '')
    try {
      if (message.channel.type === 'dm') {
        instances.values().next().value.exec(command, args, message)
      } else {
        instances.get(message.channel.guild.id).exec(command, args, message)
      }
    } catch (e) {
      log.debug('event BotErrorThrown')
      log.error(e)
      if (e instanceof NotFoundError) {
        log.debug('event BotError type commandNotFound')
        message.channel.send(`🔴 Unknown command! (type \`${config.App.commandPrefix}help\` for all commands available)`)
      } else {
        if (e instanceof AwesomeBotError) {
          log.debug('event BotError type internal')
        } else {
          log.debug('event BotError type unknown')
        }
        message.channel.send(`🔴 Whoops, while completing your request an internal error has occurred.`)
      }
    }
  })
  .on('error', e => {
    log.debug('event ClientError')
    tools.selfCleanup(e)
  })
  .login(config.Discord.token)

log.debug('state appReady')
