'use strict'
const config = require('../config.json')
const rimraf = require('rimraf').sync
const fs = require('fs')
const ytdl = require('ytdl-core')
const request = require('request')
const tools = require('../lib/tools.js')
const log = require('../lib/log.js')
let init = false

module.exports = class {
  constructor (instance) {
    function cleanup () {
      let files = fs.readdirSync('./cache')
      let tempfiles = files.filter(file => (/\.(tmp)$/i).test(file))
      let indexes = files.filter(file => (/\.(media\.json)$/i).test(file))
      indexes.forEach(index => {
        let filename = index
        index = JSON.parse(String(fs.readFileSync('./cache/' + index)))
        index.forEach(file => {
          file = file.filename.split('/').pop()
          if (tempfiles.indexOf(file) !== -1) tempfiles.splice(tempfiles.indexOf(file), 1)
          else index.splice(index.indexOf(file), 1)
        })
        fs.writeFileSync('./cache/' + filename, JSON.stringify(index))
      })
      tempfiles.forEach(file => {
        log.debug('Deleting ' + file)
        rimraf('./cache/' + file)
      })
    }
    this.permissions = ['dj']
    this.playing = false
    this.playqueue = []
    this.dispatcher = false
    this.instance = instance
    if (!init) {
      init = true
      cleanup()
      setInterval(cleanup, 120000)
    }
    if (fs.existsSync(`./cache/${this.instance.guild.id}.media.json`)) this.playqueue = JSON.parse(String(fs.readFileSync(`./cache/${this.instance.guild.id}.media.json`)))
    if (this.playqueue.length > 0) this._player()
    setTimeout(this._saveQueue.bind(this), 30000)
  }
  _saveQueue () {
    fs.writeFile(`./cache/${this.instance.guild.id}.media.json`, JSON.stringify(this.playqueue), () => {
      log.debug(`Saved media queue for ${this.instance.guild.id}`)
    })
  }
  async _parseURL (url, message, authorId) {
    /* eslint-disable no-cond-assign */
    let vid
    if (vid = url.match(/(?:http:\/\/|https:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=([^#&?]*).*|youtu\.be\/([^#&?]*).*)/)) {
      vid = 'https://youtube.com/watch?v=' + vid[1]
      try {
        let info = await this._enqueueSong(vid, {channel: message.channel.id, author: authorId})
        message.edit(`✔ Enqueued ${info.title}!`, {embed: {
          title: info.title,
          fields: [{
            name: 'Description',
            value: info.description.length === 0 ? 'No description provided' : info.description
          }],
          author: {
            name: 'Youtube'
          },
          thumbnail: {
            url: info.iurlmaxres
          },
          footer: {
            text: info.author.name
          },
          timestamp: new Date(info.published),
          url: 'https://youtube.com/watch?v=' + info.video_id,
          color: 0xff0000
        }})
      } catch (e) {
        message.edit('✖ ' + e.message)
      }
    } else if (vid = url.match(/(?:http:\/\/|https:\/\/)?(?:www\.)?(?:youtube\.com\/playlist\?list=([^#&?]*).*)/)) {
      vid = 'https://youtube.com/playlist?list=' + vid[1]
      let videos = await new Promise((resolve, reject) => {
        request.get(vid, async (err, res, body) => {
          /* eslint-disable no-regex-spaces */
          if (err) reject(err)
          else if (res.statusCode !== 200) reject(new Error('Request failed with non-200 code'))
          else {
            resolve(tools.getMatches(body, /<a class="pl-video-title-link yt-uix-tile-link yt-uix-sessionlink  spf-link " dir="ltr" href="\/watch\?v=([^#&?]{11})/g))
          }
        })
      })
      if (videos.length > this.instance.settings.listLimit) {
        message = await message.edit(`⏳ Playlist video count exceeds limit, enqueueing **${this.instance.settings.listLimit}/${videos.length}** videos...`)
        videos = videos.slice(0, this.instance.settings.listLimit)
      } else message = await message.edit(`⏳ Enqueueing **${videos.length}** videos...`)
      for (let i = 0; i < videos.length; i++) {
        try {
          let info = await this._enqueueSong('https://youtube.com/watch?v=' + videos[i], {channel: message.channel.id, author: authorId})
          message.channel.send(`✔ Enqueued ${info.title}!`, {embed: {
            title: info.title,
            fields: [{
              name: 'Description',
              value: info.description.length === 0 ? 'No description provided' : info.description
            }],
            author: {
              name: 'Youtube'
            },
            thumbnail: {
              url: info.iurlmaxres
            },
            footer: {
              text: info.author.name
            },
            timestamp: new Date(info.published),
            url: 'https://youtube.com/watch?v=' + info.video_id,
            color: 0xff0000
          }})
        } catch (e) {
          message.edit('✖ ' + e.message)
        }
      }
      message.delete()
    } else if (vid = url.match(/(?:http:\/\/|https:\/\/)(?:www\.)?soundcloud\.com\/(\w+)\/((?!sets).+)/)) {
      vid = `https://soundcloud.com/${vid[1]}/${vid[2]}`
      try {
        let info = await this._enqueueSong(vid, {channel: message.channel.id, author: authorId})
        message.edit(`✔ Enqueued ${info.title}!`, {embed: {
          title: info.title,
          fields: [{
            name: 'Description',
            value: info.description.length === 0 ? 'No description provided' : info.description
          }],
          author: {
            name: 'Youtube'
          },
          thumbnail: {
            url: info.iurlmaxres
          },
          footer: {
            text: info.author.name
          },
          timestamp: new Date(info.published),
          url: 'https://youtube.com/watch?v=' + info.video_id,
          color: 0xff0000
        }})
      } catch (e) {
        message.edit('✖ ' + e.message)
      }
    } else if (url.match(/(?:\w+:\/\/).+/)) {
      message.edit('✖ Invalid URL!')
    } else {
      try {
        let searchData = await this._searchYoutube(url, message, authorId)
        vid = searchData.url
        message = searchData.message
        try {
          let info = await this._enqueueSong(vid, {channel: message.channel.id, author: authorId})
          message.edit(`✔ Enqueued ${info.title}!`, {embed: {
            title: info.title,
            fields: [{
              name: 'Description',
              value: info.description.length === 0 ? 'No description provided' : info.description
            }],
            author: {
              name: 'Youtube'
            },
            thumbnail: {
              url: info.iurlmaxres
            },
            footer: {
              text: info.author.name
            },
            timestamp: new Date(info.published),
            url: 'https://youtube.com/watch?v=' + info.video_id,
            color: 0xff0000
          }})
        } catch (e) {
          message.edit('✖ ' + e.message)
        }
      } catch (err) {
        message.edit(`✖ Something went wrong!\n\`\`\`${err.stack.replace(__dirname, '')}\`\`\``)
      }
    }
  }
  _searchYoutube (search, message, authorId) {
    return new Promise((resolve, reject) => {
      message.edit('⏳ Searching, give me a second...')
      .then(message => {
        request.get(`https://www.youtube.com/results?search_query=${encodeURIComponent(search)}&sp=EgIQAQ%253D%253D&pbj=1`, async (err, res, body) => {
          if (err) reject(err)
          else if (res.statusCode !== 200) reject(new Error('Request failed with non-200 code'))
          else {
            let ids = tools.getMatches(body, /href="\/watch\?v=([^#&?]{11})" class=" yt-uix-sessionlink/g).slice(0, 3)
            let info = []
            for (let i = 0; i < ids.length; i++) {
              try {
                info.push(await ytdl.getInfo(ids[i]))
              } catch (e) {
                console.error(e)
              }
            }
            let fields = []
            let urls = []
            info.forEach((video, index) => {
              video.description = video.description.replace(/((?:http|https):\/\/\S{16})(\S+)/g, '[$1...]($1$2)')
              if (video.description.length > 128) {
                video.description = video.description.replace(/^([^]{128}[^\s]*)?([^]+)/, '$1 ...')
              }
              fields.push({
                name: `${index + 1}. ${video.title} [${video.author.name}]`,
                value: video.description.length === 0 ? 'No description provided' : video.description
              })
              urls.push('https://youtube.com/watch?v=' + video.video_id)
            })
            message.edit('ℹ I found the following videos, choose one.', {embed: {
              fields,
              footer: {
                text: 'Youtube Search'
              },
              timestamp: new Date(),
              color: 0xff0000
            }}).then(async message => {
              for (let i = 1; i <= info.length; i++) {
                let emoji
                switch (i) {
                  case 1:
                    emoji = '1⃣'
                    break
                  case 2:
                    emoji = '2⃣'
                    break
                  case 3:
                    emoji = '3⃣'
                    break
                }
                await message.react(emoji)
              }
              await message.react('✖')
              const collector = message.createReactionCollector(reaction => reaction.me && ['1⃣', '2⃣', '3⃣', '✖'].includes(reaction.emoji.name) && reaction.count > 1, {time: 15000})
              collector
                .on('collect', () => collector.stop())
                .on('end', async collected => {
                  if (collected === undefined) {
                    message.delete()
                    return
                  }
                  if (collected.first()._emoji.name === '✖') {
                    await message.delete()
                    return
                  }
                  let newMessage = await message.channel.send('⏳ Loading...')
                  await message.delete()
                  switch (collected.first()._emoji.name) {
                    case '1⃣':
                      resolve({url: urls[0], message: newMessage})
                      break
                    case '2⃣':
                      resolve({url: urls[1], message: newMessage})
                      break
                    case '3⃣':
                      resolve({url: urls[2], message: newMessage})
                      break
                  }
                })
            })
          }
        })
      })
    })
  }
  _enqueueSong (url, qOptions) {
    return new Promise((resolve, reject) => {
      const filename = './cache/' + tools.guid() + '.tmp'
      let video = ytdl(url, {quality: 'highest', filter: 'audioonly'})
      let videoInfo
      video
        .on('info', info => {
          let maxLength = this.instance.settings.maxLength
          if (info.length_seconds > maxLength) {
            video.destroy()
            video = undefined
            return reject(new RangeError(`Media longer than ${maxLength / 60} minutes! (${tools.secondsToTimeString(info.length_seconds)})`))
          }
          info.description = info.description.replace(/((?:http|https):\/\/\S{16})(\S+)/g, '[$1...]($1$2)')
          if (info.description.length > 900) {
            info.description = info.description.replace(/^([^]{900}[^\s]*)?([^]+)/, '$1 ...')
          }
          videoInfo = info
          return resolve(info)
        })
        .on('end', () => {
          this.playqueue.push({channel: qOptions.channel, author: qOptions.author, filename, videoInfo, url})
          if (!this.playing) this._player()
          this._saveQueue()
        })
        .on('error', e => {
          video.destroy()
          video = undefined
          reject(e)
        })
        .pipe(fs.createWriteStream(filename))
    })
  }
  _player () {
    function play (connection) {
      this.playing = true
      try {
        let song = this.playqueue.slice(0, 1)[0]
        if (this.dispatcher !== false) this.dispatcher.end()
        this.dispatcher = connection.playFile(song.filename)
        this.dispatcher.setVolume(this.instance.settings.volume)
        this.dispatcher.setBitrate(128)
        this.dispatcher.duration = song.videoInfo.length_seconds
        this.dispatcher.song = song.videoInfo.title
        this.dispatcher.url = song.url
        this.dispatcher
          .on('end', () => {
            this.playqueue.shift()
            setTimeout(() => fs.unlink(song.filename, () => {}), 5000)
            this._player()
          })
        this.instance.guild.channels.get(song.channel).send(`ℹ <@${song.author}> your song "${song.videoInfo.title}" is now playing in ${connection.channel.name}!`)
        this._saveQueue()
      } catch (e) {
        this.playing = false
        throw e
      }
    }
    if (this.playqueue.length > 0) {
      if (this.instance.guild.voiceConnection) {
        play.call(this, this.instance.guild.voiceConnection)
      } else {
        let self = this
        this.instance.guild.channels.get(this.instance.settings.voiceChannel).join()
        .then(newConn => { play.call(self, newConn) })
      }
    } else {
      this.dispatcher = false
      this.playing = false
      this.instance.guild.voiceConnection.disconnect()
    }
  }
  play (args, message) {
    if (!this.permissions.get(message.author.id).includes(['core.moderator', 'core.admin', 'media.dj'])) {
      message.channel.send('✖ Unauthorized!')
      return false
    }
    if (args[1] === undefined) {
      message.channel.send('✖ No URL/search term given!')
      return false
    }
    if (this.settings.voiceChannel === '0') {
      message.channel.send(`✖ You must define a voice channel first! (see \`${config.App.commandPrefix}help set\`)`)
      return false
    }
    let url = message.content.replace(config.App.commandPrefix + 'play ', '')
    message.channel.send('⏳ Loading...')
      .then(newMessage => this.modules.media._parseURL(url, newMessage, message.author.id))
    return true
  }
  pause (args, message) {
    if (!this.permissions.get(message.author.id).includes(['core.moderator', 'core.admin', 'media.dj'])) {
      message.channel.send('✖ Unauthorized!')
      return false
    }
    if (!this.modules.media.dispatcher) {
      message.channel.send('✖ No media playing at the moment!')
      return false
    }
    this.modules.media.dispatcher.pause()
    return true
  }
  resume (args, message) {
    if (!this.permissions.get(message.author.id).includes(['core.moderator', 'core.admin', 'media.dj'])) {
      message.channel.send('✖ Unauthorized!')
      return false
    }
    if (!this.modules.media.dispatcher) {
      message.channel.send('✖ No media playing at the moment!')
      return false
    }
    this.modules.media.dispatcher.resume()
    return true
  }
  skip (args, message) {
    if (!this.modules.media.dispatcher) {
      message.channel.send('✖ No media playing at the moment!')
      return false
    }
    if (this.permissions.get(message.author.id).includes(['core.moderator', 'core.admin'])) {
      message.channel.send('✔ Vote passed, skipping...')
      this.modules.media.dispatcher.end()
      return true
    }
    let oMessage = message
    message.channel.send('❓ Skip the current song?')
     .then(async message => {
       await message.react('✔')
       await message.react('✖')
       const collector = message.createReactionCollector(reaction => reaction.me && ['✔', '✖'].includes(reaction.emoji.name) && reaction.count > 1, {time: 15000})
       collector
         .on('collect', reaction => {
           let eligibleMembers = this.client.voiceConnections.find(val => val.channel.guild.id === oMessage.guild.id).channel.members
           let voteThreshold = eligibleMembers.size > 0 ? Math.ceil(eligibleMembers.size / 2) : 0
           if (reaction.count >= voteThreshold) collector.stop()
         })
         .on('end', async collected => {
           message.delete()
           let eligibleMembers = this.client.voiceConnections.find(val => val.channel.guild.id === oMessage.guild.id).channel.members
           let voteThreshold = eligibleMembers.size > 0 ? Math.ceil(eligibleMembers.size / 2) : 0
           if (voteThreshold > 0) {
             collected.forEach(val => {
               val.users.delete(this.client.user.id)
               val.users.filter(user => eligibleMembers.has(user.id))
             })
             let winning = collected.sort((a, b) => a.users.size > b.users.size).first()
             if (winning.count >= voteThreshold && winning._emoji.name === '✔') {
               oMessage.channel.send('✔ Vote passed, skipping...')
               this.modules.media.dispatcher.end()
             } else oMessage.channel.send('✖ Vote failed!')
           } else oMessage.channel.send('✖ Vote failed!')
         })
     })
    return true
  }
  clear (args, message) {
    if (!this.modules.media.playqueue.length === 0) {
      message.channel.send('✖ Queue is empty!')
      return false
    }
    if (this.permissions.get(message.author.id).includes(['core.moderator', 'core.admin'])) {
      message.channel.send('✔ Vote passed, clearing...')
      this.modules.media.playqueue = []
      this.modules.media._saveQueue()
      return true
    }
    let oMessage = message
    message.channel.send('❓ Clear the current queue?')
     .then(async message => {
       await message.react('✔')
       await message.react('✖')
       const collector = message.createReactionCollector(reaction => reaction.me && ['✔', '✖'].includes(reaction.emoji.name) && reaction.count > 1, {time: 15000})
       collector
         .on('collect', reaction => {
           let eligibleMembers = this.client.voiceConnections.find(val => val.channel.guild.id === oMessage.guild.id).channel.members
           let voteThreshold = eligibleMembers.size > 0 ? Math.ceil(eligibleMembers.size / 2) : 0
           if (reaction.count >= voteThreshold) collector.stop()
         })
         .on('end', async collected => {
           message.delete()
           let eligibleMembers = this.client.voiceConnections.find(val => val.channel.guild.id === oMessage.guild.id).channel.members
           let voteThreshold = eligibleMembers.size > 0 ? Math.ceil(eligibleMembers.size / 2) : 0
           if (voteThreshold > 0) {
             collected.forEach(val => {
               val.users.delete(this.client.user.id)
               val.users.filter(user => eligibleMembers.has(user.id))
             })
             let winning = collected.sort((a, b) => a.users.size > b.users.size).first()
             if (winning.count >= voteThreshold && winning._emoji.name === '✔') {
               oMessage.channel.send('✔ Vote passed, clearing...')
               this.modules.media.playqueue = []
               this.modules.media._saveQueue()
             } else oMessage.channel.send('✖ Vote failed!')
           } else oMessage.channel.send('✖ Vote failed!')
         })
     })
    return true
  }
  vol (args, message) {
    let maxVolume = this.settings.maxVolume
    if (isNaN(args[1])) {
      message.channel.send('✖ Invalid input!')
      return false
    }
    args[1] = parseInt(args[1])
    this.settings.volume = (args[1] > maxVolume ? maxVolume : args[1]) / 100
    if (this.modules.media.playing) this.modules.media.dispatcher.setVolume(this.settings.volume)
    return true
  }
  queue (args, message) {
    if (this.modules.media.playqueue.length === 0) {
      message.channel.send('✖ Queue is empty!')
      return false
    }
    let fields = []
    let duration = 0
    this.modules.media.playqueue.forEach((song, index) => {
      song = song.videoInfo
      song.description = song.description.replace(/((?:http|https):\/\/\S{16})(\S+)/g, '[$1...]($1$2)')
      if (song.description.length > 120) {
        song.description = song.description.replace(/^([^]{120}[^\s]*)?([^]+)/, '$1 ...')
      }
      fields.push({
        name: `${index + 1} - "${song.title}"`,
        value: `Duration: ${tools.secondsToTimeString(song.length_seconds)}`
      })
      duration = duration + parseInt(song.length_seconds)
    })
    let untilNext = this.modules.media.dispatcher.duration - Math.floor((new Date() - this.modules.media.dispatcher.player.streamingData.startTime) / 1000)
    fields.push({
      name: 'Time until next song',
      value: `${tools.secondsToTimeString(untilNext)}`
    })
    message.channel.send({embed: {
      fields,
      author: {
        name: 'Queue'
      },
      footer: {
        text: `Runtime: ${tools.secondsToTimeString(duration + untilNext)}`
      },
      color: 0xc3c3c3
    }})
    return true
  }
  np (args, message) {
    if (!this.modules.media.playing) {
      message.channel.send('✖ Nothing is playing at the moment!')
      return false
    }
    message.channel.send(`🔊 ${this.modules.media.dispatcher.song} (<${this.modules.media.dispatcher.url}>)`)
    return true
  }
}
