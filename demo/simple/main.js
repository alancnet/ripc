const ripc = require('../..')
const worker = ripc('./worker')

async function main() {
  await worker.greet()
  worker.close()
}

main()