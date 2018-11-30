/*
    AwesomeBot Alero v1.0
    (c)2017-2018 sKiLdUsT <skil@skildust.com>
 */
'use strict'

const express = require('express')
const router = express.Router()
const Oauth2 = require('simple-oauth2')
const config = new (require('../lib/Config'))()
const DB = require('../bot/DB')
const request = require('request')

const oauth = Oauth2.create({
  client: {
    id: config.Discord.Api.clientId,
    secret: config.Discord.Api.secret
  },
  auth: {
    tokenHost: 'https://discordapp.com',
    tokenPath: '/api/oauth2/token',
    authorizePath: '/api/oauth2/authorize'
  }
})
const db = new DB()
const botName = config.App.botName

async function asyncForEach (array, callback) {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array)
  }
}

router.get('/', async (req, res) => {
  let user = req.session.user === undefined ? false : req.session.user

  if (user) {
    console.log(user.servers)
    const authToken = oauth.accessToken.create(user.accessToken)
    if (authToken.expired()) {
      authToken.refresh()
    }
  }

  res.render('index', {
    botName,
    user
  })
})

router.get('/login', (req, res) => {
  const authUrl = oauth.authorizationCode.authorizeURL({
    redirect_uri: config.Discord.Api.redirect_uri,
    scope: 'identify guilds',
    state: req.session.id
  })
  res.redirect(authUrl)
})

router.get('/login/callback', async (req, res) => {
  if (req.query.code !== undefined) {
    const tokenConfig = {
      code: req.query.code,
      redirect_uri: config.Discord.Api.redirect_uri,
      scope: 'identify guilds'
    }
    try {
      const result = await oauth.authorizationCode.getToken(tokenConfig)
      const accessToken = oauth.accessToken.create(result)
      request({
        url: 'https://discordapp.com/api/v6/users/@me',
        json: true,
        headers: {
          'Authorization': `${accessToken.token.token_type} ${accessToken.token.access_token}`
        }
      }, async (err, resp, body) => {
        if (err) console.error(err)
        let servers = []
        let guilds = db.getAll('permissions', '*')
        await asyncForEach(guilds.filter(elm => elm.memberId === body.id), async elm => {
          const permissions = elm.scopes.split(',')
          if (permissions.includes('core.admin')) {
            try {
              await (new Promise((resolve, reject) => {
                request({
                  url: `https://discordapp.com/api/v6/guilds/${elm.guildId}`,
                  json: true,
                  headers: {
                    'Authorization': `Bot ${config.Discord.token}`
                  }
                }, (err, resp, body) => {
                  if (err || (body.code !== undefined && body.code === 0)) {
                    reject(err || body)
                    return
                  }
                  console.log(body)
                  servers.push({
                    name: body.name,
                    id: body.id,
                    icon: `https://cdn.discordapp.com/icons/${body.id}/${body.icon}.png?size=64`
                  })
                  resolve()
                })
              }))
            } catch (e) {
              console.error(e, accessToken)
            }
          }
        })
        req.session.user = {
          id: body.id,
          name: `${body.username}#${body.discriminator}`,
          avatar: `https://cdn.discordapp.com/avatars/${body.id}/${body.avatar}.png?size=64`,
          accessToken,
          servers
        }
        res.redirect('/')
      })
    } catch (error) {
      console.log('Access Token Error', error.message)
    }
  } else {
    res.error()
  }
})

router.get('/manage/:serverId', (req, res) => {
  let user = req.session.user === undefined ? false : req.session.user
  let serverSettings

  if (!user) {
    req.session.destroy(() => {
      res.redirect('/')
    })
  }

  if (req.params.serverId === undefined || user.servers.filter(elm => elm.id === req.params.serverId).length === 0) {
    res.error()
  }

  res.render('manage', {
    botName,
    user,
    serverSettings
  })
})

module.exports = router
