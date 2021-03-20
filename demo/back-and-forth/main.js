const ripc = require('../..')

async function main() {
  const name = 'World'

  const worker = ripc('./worker.js', {
    getName() {
      return name
    }
  })

  console.log(await worker.getGreeting('Welcome!'))
  worker.close()
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
