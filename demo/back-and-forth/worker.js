const ripc = require('../..')

const parent = ripc(process, {
  async getGreeting(message) {
    return `Hello ${await parent.getName()}, ${message}`
  }
})
