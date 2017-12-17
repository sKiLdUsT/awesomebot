'use strict'

module.exports = {
  secondsToTimeString (duration) {
    let hours = Math.floor(duration / 3600)
    let minutes = Math.floor((duration - (hours * 3600)) / 60)
    let seconds = duration - (hours * 3600) - (minutes * 60)

    hours = hours >= 10 ? hours : '0' + hours
    minutes = minutes >= 10 ? minutes : '0' + minutes
    seconds = seconds >= 10 ? seconds : '0' + seconds
    return `${hours > 0 ? hours + ':' : ''}${minutes}:${seconds}`
  },
  guid () {
    function s4 () {
      return Math.floor((1 + Math.random()) * 0x10000)
        .toString(16)
        .substring(1)
    }
    return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
      s4() + '-' + s4() + s4() + s4()
  }
}
