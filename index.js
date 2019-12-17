const { defer } = require('gefer')
const ChildProcess = require('child_process')
const callsite = require('callsite')
const path = require('path')
const EventEmitter = require('events')

let i = 0
const bindConfig = {
  get(obj, key) {
    if (key in obj) return obj[key]
    return function (...args) {
      const stack = callsite().slice(1)
      const deferred = defer()
      const id = i++
      const req = {
        id,
        ...deferred,
        args,
        stack
      }
      if (obj.exitCode == null && obj.exitSignal == null) {
        obj.process.send({
          id,
          type: 'request',
          cmd: key,
          args
        })
        obj.pendingRequests.set(id, req)
      }
      return deferred.promise
    }
  }
}

/**
 * Binds to a process, or creates a forked process using child_process.fork, and binds to it.
 * 
 * @param {EventEmitter|string} process A process reference, or an absolute path to the module, or path relative to the calling function.
 * @param {object} scope Object containing functions that can be called by process.
 */

const ripc = (process, scope) => {
  if (typeof process === 'string') {
    if (process.startsWith('.')) {
      const stack = callsite()
      process = path.join(path.dirname(stack[1].getFileName()), process)
    }
    process = ChildProcess.fork(process)
  }
  if (!process instanceof EventEmitter) {
    throw new Error("`process` must be a string or an EventEmitter.")
  }

  const obj = {
    exitCode: null,
    exitSignal: null,
    pendingRequests: new Map(),
    process,
    scope,
    close() {
      process.kill('SIGQUIT')
    }
  }

  process.on('message', async message => {
    if (message.type === 'request') {
      if (scope && message.cmd in scope) {
        let result = undefined
        let error = undefined
        try {
          result = await scope[message.cmd](...message.args)
        } catch (err) {
          error = {
            message: err.message,
            stack: err.stack
          }
        } finally {
          try {
            process.send({
              id: message.id,
              type: 'response',
              success: !error,
              result,
              error
            })
          } catch (err) {
            console.warn('Could not send response:', err)
          }
        }
      } else {
        process.send({
          id: message.id,
          type: 'response',
          success: false,
          error: `${message.cmd} does not exist in scope.`
        })
      }
    } else if (message.type === 'response') {
      if (obj.pendingRequests.has(message.id)) {
        const req = obj.pendingRequests.get(message.id)
        obj.pendingRequests.delete(message.id)
        if (message.success) {
          req.resolve(message.result)
        } else {
          const err = new Error(message.error.message)
          err.stack = [
            message.error.message,
            ...message.error.stack.split('\n').filter(x => x.startsWith('    at ')),
            '    at --[ RIPC Inter-Process Communication ]--',
            ...req.stack.map(x => `    at ${x}`)
          ].join('\n')
          req.reject(err)
        }
      } else {
        console.warn('Response received for non-existent request:', message)
      }
    }
  })

  process.on('exit', (code, signal) => {
    obj.exitCode = code
    obj.exitSignal = signal
    for (const [id, req] of obj.pendingRequests) {
      req.reject(new Error(`Request ${id} could not be completed because process exited with ${code || signal}.`))
    }
  })
  return new Proxy(obj, bindConfig)
}

module.exports = ripc