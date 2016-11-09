import {createProxy, spread} from './utils'

export default function messageBusify(main) {
  return sources => {
    const bridge$ = createProxy()
    const MessageBus = {
      address: function(selector) {
        const message$ = bridge$
          .filter(x => {
            //console.log(`to: `, x.to)
            //console.log(`selector: `, selector)
            return x.to === selector
          })
          .map(x => x.message)
          .publish().refCount()

        return message$
      }
    }

    const sinks = main(spread(sources, {MessageBus}))
    bridge$.attach(
      sinks.MessageBus
        .map(x => {
          //console.log(`MessageBus:`, x)
          if (x.hasOwnProperty(`to`)) {
            return x
          } else {
            throw new Error(`Invalid message sent on MessageBus`)
          }
        })
    )

    const out = {}
    for (let prop in sinks) {
      if (sinks.hasOwnProperty(prop) && prop !== 'MessageBus') {
        out[prop] = sinks[prop]
      }
    }

    return out
  }
}