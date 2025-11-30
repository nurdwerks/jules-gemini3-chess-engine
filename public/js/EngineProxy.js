/* eslint-env browser */

window.EngineProxy = class EngineProxy {
  constructor (defaultEngine) {
    this.activeEngine = defaultEngine
  }

  setEngine (engine) {
    this.activeEngine = engine
  }

  getEngine () {
    return this.activeEngine
  }

  send (command) {
    if (this.activeEngine) this.activeEngine.send(command)
  }
}
