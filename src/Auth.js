const {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse
} = require('@simplewebauthn/server')
const db = require('./Database')

const rpName = 'Jules & Gemini Chess'

// Random name generator for new users
const generateRandomName = () => {
  const adjs = ['Mighty', 'Neon', 'Grand', 'Hyper', 'Sonic', 'Quantum', 'Cosmic', 'Silent', 'Rapid', 'Turbo']
  const nouns = ['Pawn', 'Knight', 'Bishop', 'Rook', 'Queen', 'King', 'Engine', 'Gambit', 'Mate', 'Check']
  const adj = adjs[Math.floor(Math.random() * adjs.length)]
  const noun = nouns[Math.floor(Math.random() * nouns.length)]
  return `${adj}${noun}${Math.floor(Math.random() * 100)}`
}

class Auth {
  _fixBuffer (obj) {
    if (obj instanceof Uint8Array || Buffer.isBuffer(obj)) return obj
    if (obj.type === 'Buffer' && Array.isArray(obj.data)) {
        return new Uint8Array(obj.data)
    }
    if (typeof obj === 'object' && obj !== null) {
        const keys = Object.keys(obj).filter(k => !isNaN(parseInt(k))).sort((a,b) => Number(a) - Number(b))
        if (keys.length > 0 && Number(keys[0]) === 0 && Number(keys[keys.length-1]) === keys.length - 1) {
             const arr = new Uint8Array(keys.length)
             keys.forEach(k => arr[k] = obj[k])
             return arr
        }
    }
    return obj
  }

  async getRegisterOptions (username, rpID = 'localhost') {
    const user = await db.getUser(username)

    const newUserData = user || {
      id: username,
      username,
      displayName: generateRandomName(),
      authenticators: [],
      userData: {}
    }

    if (!user) {
        await db.saveUser(username, newUserData)
    }

    const options = await generateRegistrationOptions({
      rpName,
      rpID,
      userID: Buffer.from(username),
      userName: username,
      attestationType: 'none',
      excludeCredentials: newUserData.authenticators.map(auth => ({
        id: Buffer.from(this._fixBuffer(auth.credentialID)).toString('base64url'),
        type: 'public-key',
        transports: auth.transports
      })),
      authenticatorSelection: {
        residentKey: 'preferred',
        userVerification: 'preferred',
        // authenticatorAttachment: 'platform' // Removed to allow cross-platform (roaming) authenticators
      }
    })

    await db.setUserCurrentChallenge(username, options.challenge)
    return options
  }

  async verifyRegister (username, body, rpID = 'localhost', origin) {
    const expectedChallenge = await db.getUserCurrentChallenge(username)

    // If origin is not provided, construct it from rpID (assuming https unless localhost)
    if (!origin) {
        const protocol = rpID === 'localhost' ? 'http' : 'https'
        // Note: Port is tricky. If not localhost, assume 443 (implied).
        // If localhost, default to 3000? Or just leave it to caller to provide correct origin.
        origin = `${protocol}://${rpID}${rpID === 'localhost' ? ':3000' : ''}`
    }

    let verification
    try {
      verification = await verifyRegistrationResponse({
        response: body,
        expectedChallenge,
        expectedOrigin: origin,
        expectedRPID: rpID
      })
    } catch (error) {
      console.error(error)
      throw new Error('Verification failed')
    }

    const { verified, registrationInfo } = verification

    if (verified && registrationInfo) {
      const { credentialPublicKey, credentialID, counter } = registrationInfo

      const user = await db.getUser(username)
      const newAuthenticator = {
        credentialID,
        credentialPublicKey,
        counter,
        transports: body.response.transports
      }

      user.authenticators.push(newAuthenticator)
      await db.saveUser(username, user)
      return { verified: true, user }
    }
    return { verified: false }
  }

  async getLoginOptions (username, rpID = 'localhost') {
    const user = await db.getUser(username)
    if (!user) throw new Error('User not found')

    const options = await generateAuthenticationOptions({
      rpID,
      allowCredentials: user.authenticators.map(auth => ({
        id: Buffer.from(this._fixBuffer(auth.credentialID)).toString('base64url'),
        type: 'public-key',
        transports: auth.transports
      })),
      userVerification: 'preferred'
    })

    await db.setUserCurrentChallenge(username, options.challenge)
    return options
  }

  async verifyLogin (username, body, rpID = 'localhost', origin) {
    const user = await db.getUser(username)
    if (!user) throw new Error('User not found')

    const expectedChallenge = await db.getUserCurrentChallenge(username)

    // Find the authenticator used
    const authenticator = user.authenticators.find(auth => {
        // We need to compare against the ID sent by the client (which is base64url string)
        const fixedId = Buffer.from(this._fixBuffer(auth.credentialID)).toString('base64url')
        return fixedId === body.id
    })

    if (!authenticator) throw new Error('Authenticator not found')

    // Fix the authenticator object buffers for simplewebauthn
    authenticator.credentialID = this._fixBuffer(authenticator.credentialID)
    authenticator.credentialPublicKey = this._fixBuffer(authenticator.credentialPublicKey)

    if (!origin) {
        const protocol = rpID === 'localhost' ? 'http' : 'https'
        origin = `${protocol}://${rpID}${rpID === 'localhost' ? ':3000' : ''}`
    }

    let verification
    try {
      verification = await verifyAuthenticationResponse({
        response: body,
        expectedChallenge,
        expectedOrigin: origin,
        expectedRPID: rpID,
        authenticator,
        requireUserVerification: false
      })
    } catch (error) {
      console.error(error)
      throw new Error('Verification failed')
    }

    const { verified, authenticationInfo } = verification

    if (verified) {
      authenticator.counter = authenticationInfo.newCounter
      await db.saveUser(username, user)
      return { verified: true, user }
    }
    return { verified: false }
  }
}

module.exports = new Auth()
