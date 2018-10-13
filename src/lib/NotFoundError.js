/*
    AwesomeBot Alero v1.0
    (c)2017-2018 sKiLdUsT <skil@skildust.com>
 */
'use strict'

const log = require('./Log')
const AwesomeBotError = require('./Error')

/** Custom Error class. Can be used to catch application-specific errors or for some fancy stuff down the line. Dummy for now. */
module.exports = class NotFoundError extends AwesomeBotError {
  constructor () {
    log.debug('instanciate class Error')
    super()
  }
}
