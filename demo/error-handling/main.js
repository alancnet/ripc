const ripc = require('../..')
const worker = ripc('./worker')

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