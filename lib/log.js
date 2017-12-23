'use strict'
const config = require('../config.json')
const colors = require('colors')
colors.setTheme({
  info: 'green',
  warn: 'yellow',
  debug: 'blue',
  error: 'red'
})
module.exports = {
  date (date) {
    date || (date = new Date())
    let monthNames = [
      'Jan', 'Feb', 'Mar',
      'Apr', 'May', 'Jun', 'Jul',
      'Aug', 'Sep', 'Oct',
      'Nov', 'Dec'
    ]
    let day = date.getDate()
    let monthIndex = date.getMonth()
    let hours = date.getHours() >= 10 ? date.getHours() : '0' + date.getHours()
    let minutes = date.getMinutes() >= 10 ? date.getMinutes() : '0' + date.getMinutes()
    let seconds = date.getSeconds() >= 10 ? date.getSeconds() : '0' + date.getSeconds()
    let time = `${hours}:${minutes}:${seconds}`
    return `${monthNames[monthIndex]} ${day} ${time}`
  },
  debug (string) {
    if (config.App.logLevel <= 1) console.log(`${this.date()} ${colors.debug('[DEBUG]')} ${string}`)
  },
  info (string) {
    if (config.App.logLevel <= 2) console.log(`${this.date()} ${colors.info('[INFO]')}  ${string}`)
  },
  warn (string) {
    if (config.App.logLevel <= 3) console.log(`${this.date()} ${colors.warn('[WARN]')}  ${string}`)
  },
  error (string) {
    if (string instanceof Error) string = string.message
    if (config.App.logLevel <= 4) console.log(`${this.date()} ${colors.error('[ERROR]')} ${string}`)
  }
}
