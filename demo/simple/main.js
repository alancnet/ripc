const ripc = require('../..')
const worker = ripc('./worker.js')

async function main() {
  await worker.greet()
  worker.close()
}

main()