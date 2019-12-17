# RIPC

Simplifies inter-process communication by abstracting it as async functions.

RIPC stands for RIPC Inter Process Communication

## Example

main.js:

```javascript
const ripc = require('ripc')
const worker = ripc('./worker')

async function main() {
  await worker.greet()
  worker.close()
}

main()
```

worker.js:

```javascript
const ripc = require('ripc')

ripc(process, {
  greet() {
    console.log('Hello World')
  }
})
```

More example code [here](https://github.com/alancnet/ripc/tree/master/demo).
