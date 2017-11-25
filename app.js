'use strict'
const Discord = require('discord.js')
const ytdl = require('youtube-dl')
const opn = require('opn')
const fs = require('fs')
const cache = require('./lib/cache')
const log = require('./lib/log')
const config = require('./config.json')
const pjson = require('./package.json')
const client = new Discord.Client()

log.info(`${pjson.name} Version ${pjson.version}, loading...`)

function guid () {
  function s4 () {
    return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1)
  }
  return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
    s4() + '-' + s4() + s4() + s4()
}

function enqueueSong (url, message) {
  /* eslint-disable no-cond-assign */
  let vid
  let options = []
  let author = 'Youtube'
  let color = 0xff0000
  if (vid = url.match(/(?:http:\/\/|https:\/\/)?(?:www\.)?(?:youtube\.com|youtu\.be)\/(?:watch\?v=)?([^#&?]*).*/)) {
    vid = 'https://youtube.com/watch?v=' + vid[1]
    options.push('-f 140')
  } else if (vid = url.match(/(?:http:\/\/|https:\/\/)(?:www\.)?soundcloud\.com\/(\w+)\/((?!sets).+)/)) {
    vid = `https://soundcloud.com/${vid[1]}/${vid[2]}`
    author = 'Soundcloud'
    color = 0xff7700
  } else if (url.match(/(?:\w+:\/\/).+/)) {
    message.channel.send('❌ Invalid URL!')
    return
  } else {
    vid = 'ytsearch:' + url
    options.push('-f 140')
  }
  message.channel.startTyping()
  const filename = 'cache/' + guid()
  let videoInfo
  let video = ytdl(vid, options)
  video
  .on('info', info => {
    let maxLength = cache.guilds[message.channel.guild.id].maxLength
    if (maxLength === undefined) maxLength = 900
    if (info._duration_raw > maxLength) {
      video.unresolve()
      video = undefined
      message.channel.send(`❌ Media longer than ${maxLength / 60} minutes! (${secondsToTimeString(info._duration_raw)})`)
      message.channel.stopTyping()
      return
    }
    info.description = info.description.replace(/((?:http|https):\/\/\S{16})(\S+)/g, '[$1...]($1$2)')
    if (info.description.length > 900) {
      info.description = info.description.replace(/^([^]{900}[^\s]*)?([^]+)/, '$1 ...')
    }
    message.channel.send(`✅ Enqueued ${info.fulltitle}!`, {embed: {
      title: info.fulltitle,
      fields: [{
        name: 'Description',
        value: info.description.length === 0 ? 'No description provided' : info.description
      }],
      author: {
        name: author
      },
      thumbnail: {
        url: info.thumbnail
      },
      footer: {
        text: info.uploader
      },
      timestamp: new Date(info.upload_date.replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3')),
      url: info.webpage_url,
      color
    }})
    videoInfo = info
  })
  .on('end', () => {
    cache.guilds[message.channel.guild.id].songQueue.push({channel: message.channel.id, author: message.author.id, filename, videoInfo})
    if (message.channel.guild.dispatcher === undefined || message.channel.guild.dispatcher.destroyed) player(message.channel.guild.id)
    message.channel.stopTyping()
  })
  .on('error', e => {
    message.channel.send('❌ Something went wrong!\n```' + e.stack.replace(__dirname, '') + '```')
    video.unresolve()
    video = undefined
    message.channel.stopTyping()
  })
  video.pipe(fs.createWriteStream(filename))
}

function player (guildID) {
  /* eslint-disable no-inner-declarations */
  if (cache.guilds[guildID].songQueue.length > 0) {
    let connection
    let guild = client.guilds.get(guildID)
    if (guild.voiceConnection) {
      connection = guild.voiceConnection
      play()
    } else {
      guild.channels.get(cache.guilds[guildID].voiceChannel).join()
      .then(newConn => {
        connection = newConn
        play()
      })
    }
    function play () {
      let song = cache.guilds[guild.id].songQueue.shift()
      if (guild.dispatcher !== undefined) guild.dispatcher.end()
      guild.dispatcher = connection.playFile(song.filename)
      guild.dispatcher.setVolume(cache.guilds[guildID].volume)
      guild.dispatcher.setBitrate(128)
      guild.dispatcher.duration = song.videoInfo._duration_raw
      guild.dispatcher.song = song.videoInfo.fulltitle
      guild.dispatcher
        .on('end', () => {
          setTimeout(() => fs.unlinkSync(song.filename), 5000)
          player(guildID)
        })
      guild.channels.get(song.channel).send(`ℹ <@${song.author}> your song "${song.videoInfo.fulltitle}" is now playing in ${connection.channel.name}!`)
    }
  } else {
    client.guilds.get(guildID).voiceConnection.disconnect()
  }
}

function secondsToTimeString (duration) {
  let hours = Math.floor(duration / 3600)
  let minutes = Math.floor((duration - (hours * 3600)) / 60)
  let seconds = duration - (hours * 3600) - (minutes * 60)

  hours = hours >= 10 ? hours : '0' + hours
  minutes = minutes >= 10 ? minutes : '0' + minutes
  seconds = seconds >= 10 ? seconds : '0' + seconds
  return `${hours > 0 ? hours + ':' : ''}${minutes}:${seconds}`
}

function selfCleanup (e) {
  if (e) console.error(e)
  else log.warn('Caught interrupt signal, cleaning...')
  client.destroy().then(() => {
    cache.saveSync()
    process.exit()
  })
}

process
  .on('SIGINT', selfCleanup)
  .on('SIGTERM', selfCleanup)
  .on('SIGHUP', selfCleanup)
  .on('uncaughtException', selfCleanup)

client.on('ready', () => {
  client.user.setPresence({game: {name: `Build ${pjson.version}`}})
  if (client.guilds.size === 0) {
    log.warn(`No guilds found. You can add this bot with this link: https://discordapp.com/oauth2/authorize?&client_id=${client.user.id}&scope=bot&permissions=0`)
    opn(`https://discordapp.com/oauth2/authorize?&client_id=${client.user.id}&scope=bot&permissions=0`)
    // Silently handle error
      .error(() => {})
    if (cache.guilds !== undefined) delete cache.guilds
  } else {
    Array.from(client.guilds.values()).forEach((guild) => {
      if (cache.guilds === undefined) cache.guilds = {}
      if (cache.guilds[guild.id] === undefined) {
        cache.guilds[guild.id] = {
          permissions: {
            [config.Discord.adminId]: 2
          },
          songQueue: [],
          volume: 0.2,
          maxVolume: 100,
          maxLength: 900
        }
      }
      Array.from(guild.members.values()).forEach(user => {
        if (user.id === client.user.id) return
        if (cache.guilds[guild.id].permissions[user.id] === undefined) cache.guilds[guild.id].permissions[user.id] = 0
      })
      if (cache.guilds[guild.id].songQueue.length > 0) player(guild.id)
    })
  }
  log.info('Ready!')
})
.on('guildCreate', guild => {
  log.info(`Joining new guild "${guild.name}"`)
  if (cache.guilds === undefined) cache.guilds = {}
  if (cache.guilds[guild.id] === undefined) {
    cache.guilds[guild.id] = {
      permissions: {
        [config.Discord.adminId]: 2
      },
      songQueue: [],
      volume: 0.2,
      maxVolume: 100,
      maxLength: 900
    }
    Array.from(guild.members.values()).forEach(user => {
      if (user.id === client.user.id) return
      if (cache.guilds[guild.id].permissions[user.id] === undefined) cache.guilds[guild.id].permissions[user.id] = 0
    })
  }
})
.on('guildDelete', guild => {
  log.warn(`Removed from guild "${guild.name}"`)
  delete cache.guilds[guild.id]
})
.on('guildMemberAdd', member => {
  cache.guilds[member.guild.id].permissions[member.id] = 0
})
.on('guildmemberRemove', member => {
  delete cache.guilds[member.guild.id].permissions[member.id]
})
.on('message', message => {
  if (!message.author.bot && message.content.indexOf(config.App.commandPrefix) === 0) {
    if (message.channel.type === 'dm' && !(message.content === '.help' || message.content === '.invite')) {
      message.reply('You can\'t use this bot in private messages')
      return
    }
    if (cache.guilds[message.guild.id].onlyListenIn !== undefined && cache.guilds[message.guild.id].onlyListenIn !== message.channel.id) return
    let args = message.content.split(/ +/g)
    args[0] = args[0].slice(config.App.commandPrefix.length)
    switch (args[0]) {
      case 'ping':
        message.channel.send('pong!')
        break
      case 'invite':
        if (message.author.id !== config.Discord.adminId) {
          message.channel.send('❌ Unauthorized!')
          return
        }
        message.channel.send(`https://discordapp.com/oauth2/authorize?&client_id=${client.user.id}&scope=bot&permissions=0`)
        break
      case 'help':
        let fields = []
        fs.readFileSync('COMMANDS.md').toString().match(/###[\s\S]+?---/g).forEach(command => {
          fields.push({
            name: command.match(/### (.+)/)[1],
            value: command.match(/\n([\s\S]+)?---/)[1].replace(/\/(\w+)\s/g, config.App.commandPrefix + '$1 ')
          })
        })
        message.channel.send({embed: {title: 'Commands', fields}})
        break
      case 'grant':
      case 'revoke':
        if (cache.guilds[message.channel.guild.id].permissions[message.author.id] !== 2) {
          message.channel.send('❌ Unauthorized!')
          return
        }
        if (args[1] === undefined) {
          message.channel.send('❌ No user given!')
          return
        }
        if (args[0] === 'grant' && args[2] === undefined) {
          message.channel.send('❌ No permission group given!')
          return
        }
        let searchUser = args[1].split('#')
        let targetUser
        let permission
        message.channel.guild.members.array().forEach(user => {
          user = user.user
          if (user.username === searchUser[0] && user.discriminator === searchUser[1]) targetUser = user
        })
        if (targetUser !== undefined) {
          if (args[0] === 'grant') {
            switch (args[2]) {
              case 'moderator':
                permission = 1
                break
              case 'admin':
                permission = 2
                break
              default:
                message.channel.send('❌ Unknown permission!')
                return
            }
          } else {
            permission = 0
          }
          cache.guilds[message.channel.guild.id].permissions[targetUser.id] = permission
          if (args[0] === 'grant') message.channel.send(`✅ Granted ${args[1]} permission ${args[2]}`)
          else message.channel.send(`✅ Revoked permissions for ${args[1]}`)
        } else {
          message.channel.send('❌ User not found!')
        }
        break
      case 'play':
        if (args[1] === undefined) message.channel.send('❌ No URL/search term given!')
        else if (cache.guilds[message.guild.id].voiceChannel === undefined) {
          message.channel.send(`❌ You must define a voice channel first! (see \`${config.App.commandPrefix}help set\`)`)
        } else {
          enqueueSong(message.content.replace(config.App.commandPrefix + 'play', ''), message)
        }
        break
      case 'pause':
        if (message.channel.guild.dispatcher !== undefined && !message.channel.guild.dispatcher.destroyed) message.channel.guild.dispatcher.pause()
        else message.channel.send('❌ Nothing is playing at the moment!')
        break
      case 'resume':
        if (message.channel.guild.dispatcher !== undefined && !message.channel.guild.dispatcher.destroyed) message.channel.guild.dispatcher.resume()
        else message.channel.send('❌ Nothing is playing at the moment!')
        break
      case 'skip':
        if (message.channel.guild.dispatcher !== undefined && !message.channel.guild.dispatcher.destroyed) message.channel.guild.dispatcher.end()
        else message.channel.send('❌ Nothing is playing at the moment!')
        break
      case 'clear':
        if (cache.guilds[message.channel.guild.id].permissions[message.author.id] === 0) {
          message.channel.send('❌ Unauthorized!')
          return
        }
        if (cache.guilds[message.channel.guild.id].songQueue.length === 0) message.channel.send('❌ Playlist is empty!')
        else {
          cache.guilds[message.channel.guild.id].songQueue = []
          message.channel.send('✅ Playlist cleared!')
        }
        break
      case 'vol':
        let maxVolume = cache.guilds[message.channel.guild.id].maxVolume
        if (maxVolume === undefined) maxVolume = 100
        if (!isNaN(args[1])) parseInt(args[1])
        else return message.channel.send('❌ Invalid input!')
        cache.guilds[message.channel.guild.id].volume = (args[1] > maxVolume ? maxVolume : args[1]) / 100
        if (message.channel.guild.dispatcher !== undefined && !message.channel.guild.dispatcher.destroyed) {
          message.channel.guild.dispatcher.setVolume(cache.guilds[message.channel.guild.id].volume)
        }
        break
      case 'queue':
        if (cache.guilds[message.channel.guild.id].songQueue.length > 0) {
          let fields = []
          let duration = 0
          cache.guilds[message.channel.guild.id].songQueue.forEach((song, index) => {
            song = song.videoInfo
            song.description = song.description.replace(/((?:http|https):\/\/\S{16})(\S+)/g, '[$1...]($1$2)')
            if (song.description.length > 120) {
              song.description = song.description.replace(/^([^]{120}[^\s]*)?([^]+)/, '$1 ...')
            }
            fields.push({
              name: `${index + 1} - "${song.fulltitle}"`,
              value: `Duration: ${secondsToTimeString(song._duration_raw)}`
            })
            duration = duration + song._duration_raw
          })
          let untilNext = message.channel.guild.dispatcher.duration - Math.floor((new Date() - message.channel.guild.dispatcher.player.streamingData.startTime) / 1000)
          fields.push({
            name: 'Time until next song',
            value: `${secondsToTimeString(untilNext)}`
          })

          message.channel.send('', {embed: {
            fields,
            author: {
              name: 'Queue'
            },
            footer: {
              text: `Runtime: ${secondsToTimeString(duration + untilNext)}`
            },
            color: 0xc3c3c3
          }})
        } else message.channel.send('❌ Queue is empty!')
        break
      case 'np':
        if (message.channel.guild.dispatcher !== undefined && !message.channel.guild.dispatcher.destroyed) message.channel.send(`ℹ Now Playing: \`${message.channel.guild.dispatcher.song}\``)
        else message.channel.send('❌ Nothing is playing at the moment!')
        break
      case 'set':
        if (cache.guilds[message.channel.guild.id].permissions[message.author.id] !== 2) {
          message.channel.send('❌ Unauthorized!')
          return
        }
        if (args[2] === undefined) {
          message.channel.send('❌ Missing value!')
          return
        }
        switch (args[1]) {
          case 'voiceChannel':
            if (!message.guild.channels.has(args[2]) && isNaN(args[2])) {
              message.channel.send('❌ Invalid value!')
              return
            }
            break
          case 'onlyListenIn':
            if (!message.guild.channels.has(args[2]) && isNaN(args[2])) {
              message.channel.send('❌ Invalid value!')
              return
            }
            break
          case 'maxVolume':
            if (!message.guild.channels.has(args[2]) && isNaN(args[2])) {
              message.channel.send('❌ Invalid value!')
              return
            }
            args[2] = parseInt(args[2])
            break
          case 'maxLength':
            if (!message.guild.channels.has(args[2]) && isNaN(args[2]) && parseInt(args[2]) > 3600) {
              message.channel.send('❌ Invalid value!')
              return
            }
            args[2] = parseInt(args[2])
            break
          default:
            message.channel.send('❌ Unknown key!')
            return
        }
        cache.guilds[message.guild.id][args[1]] = args[2]
        message.channel.send('✅ Set sucessfully!')
        break
      default:
        break
    }
  }
})
.login(config.Discord.token)
