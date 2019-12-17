const ripc = require('../..')

ripc(process, {
  greet() {
    console.log('Hello World')
  }
})