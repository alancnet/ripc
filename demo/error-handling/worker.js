const ripc = require('../..')

ripc(process, {
  greet() {
    throw new Error('Hello World')
  }
})