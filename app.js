'use strict'
global.__basedir = __dirname
const Discord = require('discord.js')
const client = new Discord.Client()
const { execSync } = require('child_process')
const fs = require('fs')
const revision = String(execSync('git log -1 --oneline')).slice(0, 7)
const log = require('./lib/log')
const pjson = require('./package.json')
const Bot = require('./lib/core.js')
const config = require('./config.json')
const opn = require('opn')
let bot = new Map()

log.info(`${pjson.name} Version ${pjson.version} (${revision}), loading...`)

function selfCleanup (e) {
  if (e) {
    log.error(e)
    fs.writeFileSync('dirtyexit', JSON.stringify({
      error: e.toString(),
      timestamp: Date.now()
    }))
    client.fetchUser(config.Discord.adminId).then(user => {
      user.createDM().then(channel => {
        channel.send(`✖ Critical Error occured\n\`\`\`[${log.date()}] ${e.stack}\`\`\``).then(() => {
          client.destroy().then(() => {
            process.exit()
          })
        })
      })
    })
  } else {
    log.warn('Caught interrupt signal, cleaning...')
    client.destroy().then(() => {
      process.exit()
    })
  }
}

process
  .on('SIGINT', selfCleanup)
  .on('SIGTERM', selfCleanup)
  .on('SIGHUP', selfCleanup)
  .on('uncaughtException', selfCleanup)

client
  .on('ready', () => {
    client.user.setPresence({game: {name: `Build ${pjson.version}`}})
    if (client.guilds.size === 0) {
      log.warn(`No guilds found. You can add this bot with this link: https://discordapp.com/oauth2/authorize?&client_id=${client.user.id}&scope=bot&permissions=0`)
      opn(`https://discordapp.com/oauth2/authorize?&client_id=${client.user.id}&scope=bot&permissions=0`)
      // Silently handle error
        .error(() => {})
    } else {
      client.guilds.forEach(guild => {
        bot.set(guild.id, new Bot(client, guild))
      })
      log.info('Ready!')
    }
  })
  .on('guildCreate', guild => {
    log.info(`Joining new guild ${guild.id}`)
    bot.set(guild.id, new Bot(client, guild))
  })
  .on('guildDelete', guild => {
    log.warn(`Removed from guild ${guild.id}`)
    bot.get(guild.id)._delete()
    bot.delete(guild.id)
  })
  .on('guildMemberAdd', member => {
    bot.get(member.guild.id)._newUser(member)
  })
  .on('guildmemberRemove', member => {
    bot.get(member.guild.id)._deleteUser(member)
  })
  .on('message', message => {
    if (!message.author.bot && message.content.indexOf(config.App.commandPrefix) === 0) {
      if (message.channel.type === 'dm' && !(message.content === '.help' || message.content === '.invite')) {
        message.reply('You can\'t use this bot in private messages')
        return
      }
      let args = message.content.split(/ +/g)
      args[0] = args[0].slice(config.App.commandPrefix.length).replace('_', '').replace('constructor', '')
      try {
        bot.get(message.channel.guild.id)[args[0]](args, message)
      } catch (e) {
        if (e.toString() !== 'TypeError: bot.get(...)[args[0]] is not a function') message.channel.send(`✖ An internal error occured.\n\`\`\`${e.stack.split(global.__basedir).join('')}\`\`\``)
        else message.channel.send(`✖ Unknown command! (see \`${config.App.commandPrefix}help\`)`)
      }
    }
  })
  .on('error', e => {
    client.fetchUser(config.Discord.adminId).then(user => {
      user.createDM().then(channel => {
        channel.send(`✖ Error occured\n\`\`\`[${log.date()}] ${e.message}\`\`\``).then(() => {
          // Gracefully exit the bot (and let it restart by external logic if needed) for now
          client.destroy().then(() => {
            selfCleanup()
          })
        })
      })
    })
  })
  .login(config.Discord.token)
