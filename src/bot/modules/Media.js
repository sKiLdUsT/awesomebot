/*
    AwesomeBot Alero v1.0
    (c)2017-2018 sKiLdUsT <skil@skildust.com>
 */
'use strict'

const BaseModule = require('./BaseModule')

module.exports = class Media extends BaseModule {
  constructor (bot) {
    super(bot, 'media', ['dj'], {
      maxVolume: 100,
      maxLength: 900,
      listLimit: 10
    })
    this.plugins = {
      youtube: new (super.getFileAsModule('YouTube'))(this)
    }
    this.playqueue = []
    this.playing = false
    this.dispatcher = false
  }

  async play (args, message, user) {
    let url = args[0]
    let platform = this._detectPlatform(url)
    let functionToCall

    switch (platform) {
      case 1:
        message = await message.channel.send('💭 Detected "youtube" media, working...')
        functionToCall = this.plugins.youtube
        break
      default:
        message = await message.channel.send('💭 I know of no service associated with this url, trying to find media...')
        functionToCall = this.plugins.youtube
        break
    }

    functionToCall.play(url, message, user.id, super.fileStreamToCache())
  }

  _detectPlatform (url) {
    switch (true) {
      case url.match(/^https?:\/\/(www\.)?(youtube\.com|youtu\.be)\/(.*)$/m):
        return 1
      case url.match(/^https?:\/\/(m\.)?(soundcloud\.com|snd\.sc)\/(.*)$/m):
        return 2
      default:
        return 3
    }
  }
  _player () {
    if (this.playqueue.length === 0 || this.playing) {
      return
    }
    let song = this.playqueue.splice(0, 1)[0]
    let connection
    if (this.bot.guild.voiceConnection) {
      connection = this.bot.guild.voiceConnection
    } else {
      this.bot.guild.channels.get(this.bot.settings.config.voiceChannel)
    }

    if (this.dispatcher !== false) this.dispatcher.end()
    this.dispatcher = new
  }
}
