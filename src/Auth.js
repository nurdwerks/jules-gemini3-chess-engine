const {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse
} = require('@simplewebauthn/server')
const db = require('./Database')

const rpName = 'Jules & Gemini Chess'
const rpID = 'localhost' // Will need to be dynamic for production in real world, but fixed for this task
const origin = `http://${rpID}:3000`

const generateRandomName = () => {
  const adjs = ['Mighty', 'Neon', 'Grand', 'Hyper', 'Sonic', 'Quantum', 'Cosmic', 'Silent', 'Rapid', 'Turbo']
  const nouns = ['Pawn', 'Knight', 'Bishop', 'Rook', 'Queen', 'King', 'Engine', 'Gambit', 'Mate', 'Check']
  const adj = adjs[Math.floor(Math.random() * adjs.length)]
  const noun = nouns[Math.floor(Math.random() * nouns.length)]
  return `${adj}${noun}${Math.floor(Math.random() * 100)}`
}

class Auth {
  async getRegisterOptions (username) {
    const user = await db.getUser(username)

    // We treat "username" as a unique handle for the user in the DB.
    // If it doesn't exist, we are creating a new one.
    // However, FIDO2 doesn't use passwords. So "Registration" is "Create Account".

    // Note: FIDO2 best practice is to store user handle as a byte array, not string.
    // SimpleWebAuthn handles this.

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
      userID: username,
      userName: username,
      attestationType: 'none',
      // Prevent re-registering existing authenticators
      excludeCredentials: newUserData.authenticators.map(auth => ({
        id: auth.credentialID,
        type: 'public-key',
        transports: auth.transports
      })),
      authenticatorSelection: {
        residentKey: 'preferred',
        userVerification: 'preferred',
        authenticatorAttachment: 'platform'
      }
    })

    await db.setUserCurrentChallenge(username, options.challenge)
    return options
  }

  async verifyRegister (username, body) {
    const expectedChallenge = await db.getUserCurrentChallenge(username)

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

  async getLoginOptions (username) {
    const user = await db.getUser(username)
    if (!user) throw new Error('User not found')

    const options = await generateAuthenticationOptions({
      rpID,
      allowCredentials: user.authenticators.map(auth => ({
        id: auth.credentialID,
        type: 'public-key',
        transports: auth.transports
      })),
      userVerification: 'preferred'
    })

    await db.setUserCurrentChallenge(username, options.challenge)
    return options
  }

  async verifyLogin (username, body) {
    const user = await db.getUser(username)
    if (!user) throw new Error('User not found')

    const expectedChallenge = await db.getUserCurrentChallenge(username)

    // Find the authenticator used
    const authenticator = user.authenticators.find(auth => auth.credentialID === body.id)
    if (!authenticator) throw new Error('Authenticator not found')

    let verification
    try {
      verification = await verifyAuthenticationResponse({
        response: body,
        expectedChallenge,
        expectedOrigin: origin,
        expectedRPID: rpID,
        authenticator,
        requireUserVerification: false // Depending on device capabilities
      })
    } catch (error) {
      console.error(error)
      throw new Error('Verification failed')
    }

    const { verified, authenticationInfo } = verification

    if (verified) {
      // Update counter
      authenticator.counter = authenticationInfo.newCounter
      await db.saveUser(username, user)
      return { verified: true, user }
    }
    return { verified: false }
  }
}

module.exports = new Auth()
