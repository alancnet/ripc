const ripc = require('../..')
const worker = ripc('./worker.js')

async function main() {
  try {
    await worker.greet()
  } catch (err) {
    console.error(err)
  } finally {
    worker.close()
  }
}

main()