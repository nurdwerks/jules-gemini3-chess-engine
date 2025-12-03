const { ClassicLevel } = require('classic-level')
const path = require('path')

const dbPath = path.join(__dirname, '../db')
const db = new ClassicLevel(dbPath, { valueEncoding: 'json' })

class Database {
  constructor () {
    this.db = db
  }

  async getUser (username) {
    try {
      return await this.db.get(`user:${username.toLowerCase()}`)
    } catch (err) {
      if (err.code === 'LEVEL_NOT_FOUND') return null
      throw err
    }
  }

  async saveUser (username, data) {
    await this.db.put(`user:${username.toLowerCase()}`, data)
  }

  async getUserAuthenticator (username, credentialID) {
    try {
      const user = await this.getUser(username)
      if (!user) return null
      return user.authenticators.find(auth => auth.credentialID === credentialID)
    } catch (err) {
      return null
    }
  }

  async setUserCurrentChallenge (username, challenge) {
    await this.db.put(`challenge:${username.toLowerCase()}`, challenge)
  }

  async getUserCurrentChallenge (username) {
    try {
      return await this.db.get(`challenge:${username.toLowerCase()}`)
    } catch (err) {
      if (err.code === 'LEVEL_NOT_FOUND') return null
      throw err
    }
  }

  async saveUserData (username, key, value) {
    try {
        const user = await this.getUser(username)
        if (!user) throw new Error('User not found')

        // If userData doesn't exist, init it
        if (!user.userData) user.userData = {}

        user.userData[key] = value
        await this.saveUser(username, user)
    } catch(err) {
        throw err
    }
  }

  async updateUserData (username, data) {
    try {
        const user = await this.getUser(username)
        if (!user) throw new Error('User not found')

        // Merge data
        user.userData = { ...user.userData, ...data }
        await this.saveUser(username, user)
    } catch(err) {
        throw err
    }
  }

  async getAllUsers () {
    const users = []
    for await (const [key, value] of this.db.iterator({ gte: 'user:', lte: 'user:\xFF' })) {
        if (key.startsWith('user:')) {
            users.push(value)
        }
    }
    return users
  }
}

module.exports = new Database()
