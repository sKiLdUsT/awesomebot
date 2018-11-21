/*
    AwesomeBot Alero v1.0
    (c)2017-2018 sKiLdUsT <skil@skildust.com>
 */
'use strict'

const Ytdl = require('ytdl-core')

/**
 * Youtube Module
 * @type {Media.YouTube}
 */

module.exports = class YouTube {
  constructor (parent) {
    this.parent = parent
  }
  async play (url, message, author, fileStream) {
    this.fileStream = fileStream
    let vid = this._lastArrayElement(url.match(/^https?:\/\/(www\.)?(youtube\.com|youtu\.be)\/(watch\?v=)?(.*)$/))
    try {
      let info = await this._enqueueVideo(vid, {channel: message.channel.id, author}, message)
      console.log(info);
      message.edit(`⚪ Enqueued ${info.title}!`, {embed: {
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
      message.edit('🔴 ' + e.message)
    }
  }
  _enqueueVideo (url, options, message) {
    let self = this
    let videoInfo
    return new Promise((resolve, reject) => {
      const stream = self.fileStream.stream
      let video = new Ytdl(url, {quality: 'highestaudio', filter: 'audioonly', ratebypass: 'yes'})
      let pTimeout
      video
        .on('info', async info => {
          let maxLength = self.parent.config.maxLength
          if (info.length_seconds > maxLength) {
            video.destroy()
            video = undefined
            return reject(new RangeError(`Media longer than ${Math.floor(maxLength / 60)} minutes! (${Math.floor(info.length_seconds / 60)} minutes)`))
          }
          info.description = info.description.replace(/((?:http|https):\/\/\S{16})(\S+)/g, '[$1...]($1$2)')
          if (info.description.length > 900) {
            info.description = info.description.replace(/^([^]{900}[^\s]*)?([^]+)/, '$1 ...')
          }
          videoInfo = {channel: options.channel, author: options.author, filename: self.fileStream.name, info, url}
        })
        .on('progress', (chunk, dl, dtotal) => {
          if (pTimeout) clearTimeout(pTimeout)
          pTimeout = setTimeout(() => {
            let progress = Math.floor((dl / dtotal) * 100)
            let before = '='.repeat(progress < 50 ? Math.floor((progress / 100 * 2) * 11) : 11)
            let after = '='.repeat(progress > 50 ? Math.floor((progress / 100 / 2) * 11) : 0)
            before = before + '   '.repeat(11 - before.length)
            after = after + '   '.repeat(11 - after.length)
            message.edit(`💭 Downloading...\n[${before}${progress}%${after}]`)
          }, 1000)
        })
        .on('end', () => {
          if (pTimeout) clearTimeout(pTimeout)
          self.parent.playqueue.push(videoInfo)
          self.parent._saveQueue()
          if (!self.parent.playing) self.parent._player()
          return resolve(video.info)
        })
        .on('error', e => {
          video.destroy()
          video = undefined
          return reject(e)
        })
        .pipe(stream)
    })
  }
  _lastArrayElement (array) {
    return array[array.length - 1]
  }
}
