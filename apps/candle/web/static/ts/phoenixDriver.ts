import {Observable as O, ReplaySubject, Subject} from 'rxjs'
import {Socket} from 'phoenix'
import * as Cookie from 'js-cookie'

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
  chan.onError(e => {
    console.log('Channel error (' + channel_name + ')', e)
    errorAllOn(channel_name, e)
  })
  chan.onClose(e => {
    console.log('Channel closed (' + channel_name + ')', e)
    completeAllOn(channel_name)
  })

  return chan
}

function joinChannel(chan, channel_name) {
  chan.join()
    .receive("ok", (value) => {
      console.log('Got ok + initial value', value)
      Object.keys(value).forEach(key => {
        const on_key = getOnKey(channel_name, key)
        if (channels_on[on_key]) {
          console.log('Found on_key match: ' + on_key)
          channels_on[on_key].next(value)
        }
      }) 
    })
    .receive("ignore", () => {
      console.log(channel_name + ' not joined: User ignored')
    })
    .receive('timeout', () => {
      console.log(channel_name + ': Connection interruption')
    })
}


function getOnKey(channel_name, msg_type) {
  return channel_name + '#' + msg_type
}

function getChannelObj(channel, channel_name) {
  const out = {
    on: (msg_type) => {
      const on_key = getOnKey(channel_name, msg_type)
      if (channels_on[on_key]) {
        return channels_on[on_key]
      }

      const subject = new ReplaySubject(1)
      channels_on[on_key] = subject
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
    //channels_on[key].error(e)
    //channels_on[key] = undefined
  })
}

function createChannelsObject(socket, source$) {
  const join$ = source$.filter(msg => msg.type === 'join')
    .map(msg => msg.channel)
  const leave$ = source$.filter(msg => msg.type === 'leave')
    .map(msg => msg.channel)

  join$.subscribe(channel_name => {
    if (!channels[channel_name]) {
      channels[channel_name] = getChannel(socket, channel_name)
      channels_obj[channel_name] = getChannelObj(channels[channel_name], channel_name)
    }

    const chan = channels[channel_name]

    if (chan.isClosed()) {
      joinChannel(chan, channel_name)
    }
  })

  leave$.subscribe(channel_name => {
    channels[channel_name].leave()
    completeAllOn(channel_name)
  })

  return {
    select: (channel_name) => selectChannel(socket, channel_name)
  }
}

export default function makePhoenixDriver() {
  return function phoenixDriver(source$) {


    const shared$ = source$.publish().refCount()

    const cookie: any = Cookie.get()
    const token = cookie && cookie.authorization ? cookie.authorization : null

    const socket = new Socket("/socket", {
      params: {guardian_token: token},
      logger: ((kind, msg, data) => { console.log(`${kind}: ${msg}`, data) })
    })

    socket.connect()

    socket.onOpen(ev => {
      console.log('Phoenix channels socket opened')
      // obs.next(undefined)
    })
    socket.onError(ev => {
      console.log('Phoenix channels socket error', ev)
      // obs.error('Phoenix channels socket error')
    })
    socket.onClose(ev => {
      console.log('Phoenix channels socket closed', ev)
      //obs.complete('Phoenix channels socket closed')
    })

    return {
      Channels: createChannelsObject(socket, shared$)
    }
  }
}
