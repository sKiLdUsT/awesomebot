/*
    AwesomeBot Alero v1.0
    (c)2017-2018 sKiLdUsT <skil@skildust.com>
 */
'use strict'

const config = new (require('./Config'))()
const colors = require('colors')
colors.setTheme({
  info: 'green',
  warn: 'yellow',
  debug: 'blue',
  error: 'red'
})

/** Simple Class for handling console Logging */
module.exports = class Log {
  /**
   * Get Log date
   * @param {string|Date} [date]
   * @returns {string}
   * @private
   */
  static _date (date) {
    if (date === undefined || date instanceof Date) {
      date = new Date()
    }
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
  }

  /**
   * Log a message on debug level
   * @param {string} string
   */
  static debug (string) {
    if (config.App.logLevel <= 1) {
      console.log(`${this._date()} ${colors.debug('[DEBUG]')} ${string}`)
    }
  }
  /**
   * Log a message on info level
   * @param {string} string
   */
  static info (string) {
    if (config.App.logLevel <= 2) {
      console.log(`${this._date()} ${colors.info('[INFO]')}  ${string}`)
    }
  }
  /**
   * Log a message on warn level
   * @param {string} string
   */
  static warn (string) {
    if (config.App.logLevel <= 3) {
      console.log(`${this._date()} ${colors.warn('[WARN]')}  ${string}`)
    }
  }
  /**
   * Log a message on error level. Can also be used to gracefully handle error reporting
   * @param {string|Error} string
   */
  static error (string) {
    if (string instanceof Error) {
      if (config.App.logLevel <= 1) {
        string = string.stack
      } else {
        string = string.message
      }
    }
    if (config.App.logLevel <= 4) {
      console.log(`${this._date()} ${colors.error('[ERROR]')} ${string}`)
    }
  }
}
