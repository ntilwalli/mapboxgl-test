import {Observable as O, Subject} from 'rxjs'
import {Socket} from 'phoenix'

const channels = {}
const channels_obj = {}
const channels_on = {}

function selectChannel(socket, channel_name) {
  if (!channels[channel_name]) {
    channels[channel_name] = getChannel(socket, channel_name)
    channels_obj[channel_name] = getChannelObj(channels[channel_name], channel_name)
  }

  return channels_obj[channel_name]
}

function getChannel(socket, channel_name) {
  const cached = channels[channel_name]
  if (cached) {
    return cached
  }

  const chan = socket.channel(channel_name)
  chan.onError(e => errorAllOn(channel_name, e))
  chan.onClose(e => completeAllOn(channel_name))

  return chan
}

function joinChannel(chan, channel_name) {
  chan.join()
    .receive("ok", () => {})
    .receive("ignore", () => {
      console.log(channel_name + ' not joined: User ignored')
    })
    .after(10000, () => {
      console.log(channel_name + ': Connection interruption')
    })
}


function getOnKey(channel_name, msg_type) {
  return channel_name + '#' + msg_type
}

function getChannelObj(channel, channel_name) {
  const out = {
    on: (msg_type) => {
      const subject = new Subject()
      channels_on[getOnKey(channel_name, msg_type)] = subject
      channel.on(msg_type, m => subject.next(m))
      return subject
    }
  }

  return out
}

function completeAllOn(channel_name) {
  Object.keys(channels_on)
  .filter(key => key.indexOf(channel_name) === 0)
  .forEach(key => {
    channels_on[key].complete()
    //channels_on[key] = undefined
  })
}

function errorAllOn(channel_name, e) {
  Object.keys(channels_on)
  .filter(key => key.indexOf(channel_name) === 0)
  .forEach(key => {
    channels_on[key].error(e)
    //channels_on[key] = undefined
  })
}

function createChannelsObject(socket, source$) {
  const join$ = source$.filter(msg => msg.type === 'join')
    .map(msg => msg.data)
  const leave$ = source$.filter(msg => msg.type === 'leave')
    .map(msg => msg.data)

  join$.subscribe(channel_name => {
    if (!channels[channel_name]) {
      channels[channel_name] = getChannel(socket, channel_name)
      channels_obj[channel_name] = getChannelObj(channels[channel_name], channel_name)
    }

    joinChannel(channels[channel_name], channel_name)
  })

  leave$.subscribe(channel_name => {
    channels[channel_name].leave()
    channels[channel_name] = undefined
    channels_obj[channel_name] = undefined
    completeAllOn(channel_name)
  })

  return {
    select: (channel_name) => selectChannel(socket, channel_name)
  }
}

export default function makePhoenixDriver() {
  return function phoenixDriver(source$) {
    const shared$ = source$.publish().refCount()
    const socket = new Socket("/socket", {
      logger: ((kind, msg, data) => { console.log(`${kind}: ${msg}`, data) })
    })

    socket.connect()

    socket.onOpen(ev => {
      console.log('Phoenix channels socket opened', ev)
      // obs.next(undefined)
    })
    socket.onError(ev => {
      console.log('Phoenix channels socket error', ev)
      // obs.error('Phoenix channels socket error')
    })
    socket.onClose(ev => {
      console.log('Phoenix channels socket error', ev)
      //obs.complete('Phoenix channels socket closed')
    })

    return {
      Channels: {}//createChannelsObject(socket, shared$)
    }
  }
}
