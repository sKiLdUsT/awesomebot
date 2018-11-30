/*
    AwesomeBot Alero v1.0
    (c)2017-2018 sKiLdUsT <skil@skildust.com>
 */
'use strict'

const express = require('express')
const router = express.Router()

router.get('/', (req, res) => {
  res.json({
    result: {
      version: 1
    },
    error: {}
  })
})

module.exports = router
