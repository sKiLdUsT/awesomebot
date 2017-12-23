'use strict'
const fs = require('fs')
const config = require('../config.json')

module.exports = class {
  constructor () {
    this.permissions = ['mod', 'admin']
  }
  help (args, message) {
    let fields = []
    fs.readFileSync('COMMANDS.md').toString().match(/###[\s\S]+?---/g).forEach(command => {
      fields.push({
        name: command.match(/### (.+)/)[1],
        value: command.match(/\n([\s\S]+)?---/)[1].replace(/\/(\w+)\s/g, config.App.commandPrefix + '$1 ')
      })
    })
    if (args[1] !== undefined) fields = fields.filter(field => field.name.split(' ')[0] === args[1])
    if (fields.length === 0) message.channel.send('✖ No information found!')
    else message.channel.send({embed: {title: 'Commands', fields}})
  }
  invite (args, message) {
    message.channel.send(`https://discordapp.com/oauth2/authorize?&client_id=${this.client.user.id}&scope=bot&permissions=0`)
    return true
  }
  grant (args, message) {
    if (!this.permissions.get(message.author.id).includes(['core.admin'])) {
      message.channel.send('✖ Unauthorized!')
      return false
    }
    if (args[1] === undefined || args[2] === undefined) {
      message.channel.send('✖ Missing value(s)!')
      return false
    }
    args[1] = args[1].replace(/<@(?:!)?([0-9]*)>/, '$1')
    args[2] = String(args[2])
    if (!message.channel.guild.members.has(args[1])) {
      message.channel.send('✖ User is not member of this server!')
      return false
    }
    if (this.modules[args[2].split('.')[0]] === undefined) {
      message.channel.send('✖ Module not found!')
      return false
    }
    if (!this.modules[args[2].split('.')[0]].permissions.includes(args[2].split('.')[1])) {
      message.channel.send('✖ Permission not found!')
      return false
    }
    this.permissions.get(args[1]).scopes = args[2]
    message.channel.send(`✔ Gave <@${args[1]}> permission **${args[2]}**`)
    return true
  }
  revoke (args, message) {
    if (!this.permissions.get(message.author.id).includes(['core.admin'])) {
      message.channel.send('✖ Unauthorized!')
      return false
    }
    if (args[1] === undefined || args[2] === undefined) {
      message.channel.send('✖ Missing value(s)!')
      return false
    }
    args[1] = args[1].replace(/<@([0-9]*)>/, '$1')
    args[2] = String(args[2])
    if (!message.channel.guild.members.has(args[1])) {
      message.channel.send('✖ User is not member of this server!')
      return false
    }
    if (args[1] === message.author.id && args[2].split('.')[0] === 'core') {
      message.channel.send('✖ Are you nuts? Why do you want to revoke your own permissions?')
      return false
    }
    if (this.modules[args[2].split('.')[0]] === undefined) {
      message.channel.send('✖ Module not found!')
      return false
    }
    if (!this.modules[args[2].split('.')[0]].permissions.includes(args[2].split('.')[1])) {
      message.channel.send('✖ Permission not found!')
      return false
    }
    let scopes = this.permissions.get(args[1]).scopes.slice(0)
    this.permissions.get(args[1]).scopes = scopes.filter(e => e !== args[2])
    message.channel.send(`✔ Revoked <@${args[1]}> permission **${args[2]}**`)
    return true
  }
  addModule (args, message) {
    if (!this.permissions.get(message.author.id).includes(['core.admin'])) {
      message.channel.send('✖ Unauthorized!')
      return false
    }
    if (args[1] === undefined) {
      message.channel.send('✖ Missing value(s)!')
      return false
    }
    args[1] = String(args[1])
    if (!fs.existsSync(`./modules/${args[1]}.js`)) {
      message.channel.send('✖ Module not found!')
      return false
    }
    this.settings.modules = args[1]
    this.modules[args[1]] = new (require(`../modules/${args[1]}.js`))(this)
    this._attachModule(this.modules[args[1]])
    message.channel.send(`✔ Added module **${args[1]}**`)
    return true
  }
  removeModule (args, message) {
    if (!this.permissions.get(message.author.id).includes(['core.admin'])) {
      message.channel.send('✖ Unauthorized!')
      return false
    }
    if (args[1] === undefined) {
      message.channel.send('✖ Missing value(s)!')
      return false
    }
    args[1] = String(args[1])
    if (args[1] === 'core') {
      message.channel.send('✖ Can\'t remove the core module, silly!')
      return false
    }
    if (!fs.existsSync(`./modules/${args[1]}.js`)) {
      message.channel.send('✖ Module not found!')
      return false
    }
    let modules = this.settings.modules.slice(0)
    this.settings.modules = modules.filter(e => e !== args[1])
    this._removeModule(args[1])
    message.channel.send(`✔ Removed module **${args[1]}**`)
    return true
  }
  set (args, message) {
    if (!this.permissions.get(message.author.id).includes(['core.admin'])) {
      message.channel.send('✖ Unauthorized!')
      return false
    }
    if (args[1] === undefined || args[2] === undefined) {
      message.channel.send('✖ Missing value(s)!')
      return false
    }
    switch (args[1]) {
      case 'voiceChannel':
        if (!message.guild.channels.has(args[2]) && isNaN(args[2])) {
          message.channel.send('✖ Invalid value!')
          return false
        }
        break
      case 'onlyListenIn':
        if (!message.guild.channels.has(args[2]) && isNaN(args[2])) {
          message.channel.send('✖ Invalid value!')
          return false
        }
        break
      case 'listLimit':
        if (isNaN(args[2]) && parseInt(args[2]) > 50) {
          message.channel.send('✖ Invalid value!')
          return false
        }
        args[2] = parseInt(args[2])
        break
      case 'maxVolume':
        if (isNaN(args[2])) {
          message.channel.send('✖ Invalid value!')
          return false
        }
        args[2] = parseInt(args[2])
        break
      case 'maxLength':
        if (isNaN(args[2]) && parseInt(args[2]) > 3600) {
          message.channel.send('✖ Invalid value!')
          return false
        }
        args[2] = parseInt(args[2])
        break
      default:
        message.channel.send('✖ Unknown key!')
        return false
    }
    this.settings[args[1]] = args[2]
    message.channel.send('✔ Set sucessfully!')
    return true
  }
  get (args, message) {
    if (args[1] === undefined) {
      message.channel.send('✖ Missing value(s)!')
      return false
    }
    switch (args[1]) {
      case 'voiceChannel':
      case 'onlyListenIn':
      case 'maxVolume':
      case 'maxLength':
        message.channel.send(`\`${this.settings[args[1]]}\``)
        break
      default:
        message.channel.send('✖ Unknown key!')
        return false
    }
    return true
  }
}
