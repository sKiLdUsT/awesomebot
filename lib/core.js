'use strict'
const DB = require('./db.js')
const Permissions = require('./perms.js')
const { execSync } = require('child_process')
const revision = String(execSync('git log -1 --oneline')).slice(0, 7)
const pjson = require('../package.json')

class Bot {
  constructor (client, guild) {
    this.client = client
    this.guild = guild
    this.settings = new DB(this.guild.id)
    this.guild.members.forEach(member => {
      if (member.id !== this.client.id && this.settings.db.prepare('SELECT id FROM permissions WHERE id = ?;').get(member.id) === undefined) {
        this.settings.db.prepare("INSERT INTO permissions VALUES (?, ?, '');").run([member.id, this.guild.id])
      }
    })
    this.permissions = new Permissions(this.guild.id)
    this.modules = {}
    this.settings.modules.forEach(module => {
      this.modules[module] = new (require(`../modules/${module}.js`))(this)
    })
    Object.values(this.modules).forEach(this._attachModule, this)
    if (this.settings.lastRev !== revision) {
      let channel = this.settings.onlyListenIn !== '0' ? this.settings.onlyListenIn : this.guild.channels.get(this.guild.systemChannelID)
      let changes = String(execSync(`git rev-list ${this.settings.lastRev !== undefined ? this.settings.lastRev : '177e116'}...HEAD --pretty=format:"%h %s (%cr)"`)).replace(/.+\n(.+(\n|$))/g, '$1')
      channel.send(`ℹ ${pjson.name} just got updated to version ${pjson.version} (Rev ${revision})!\n The following has changed:\n\`\`\`${changes}\`\`\`\n<https://github.com/sKiLdUsT/awesomebot/compare/${this.settings.lastRev !== undefined ? this.settings.lastRev : '177e116'}...HEAD>`)
      this.settings.lastRev = revision
    }
  }
  _attachModule (module) {
    for (let name of Object.getOwnPropertyNames(Object.getPrototypeOf(module))) {
      let method = module[name]
      if (!(method instanceof Function) || name.indexOf('_') === 0 || name === 'constructor') continue
      this[name] = method
    }
  }
  _removeModule (module) {
    for (let name of Object.getOwnPropertyNames(Object.getPrototypeOf(this.modules[module]))) {
      if (!(module[name] instanceof Function) || name.indexOf('_') === 0 || name === 'constructor') continue
      delete this[name]
    }
    delete this.modules[module]
  }
  _delete () {
    this.settings.db.prepare('DELETE FROM guilds WHERE id = ?;').run(this.guild.id)
    this.settings.db.prepare('DELETE FROM permissions WHERE guildid = ?;').run(this.guild.id)
    delete this
  }
  _newUser (user) {
    this.settings.db.prepare("INSERT INTO permissions VALUES (?, ?, '');").run([user.id, this.guild.id])
    this.permissions = new Permissions(this.guild.id)
  }
  _deleteUser (user) {
    this.settings.db.prepare('DELETE FROM permissions WHERE id = ? AND guildId = ?;').run([user.id, this.guild.id])
    this.permissions = new Permissions(this.guild.id)
  }
}

module.exports = Bot
