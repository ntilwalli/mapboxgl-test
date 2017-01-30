import {Observable as O, ReplaySubject} from 'rxjs'
import * as Cookie from 'js-cookie'
import rxjsAdapter from '@cycle/rxjs-adapter'

export default function makeGlobalsDriver() {
  function makeResizeStream() {
    return O.create(observer => {
      let lastWidth = window.innerWidth
      const threshold = 768 // pixels
      const callback = ev => {

        if (lastWidth < threshold && ev.target.innerWidth >= threshold) {
          observer.next(ev)
        }
        lastWidth = ev.target.innerWidth

      }

      window.addEventListener(`resize`, callback)
      //document.body.addEventListener(`onresize`, ev => console.log(ev))
      return () => window.removeEventListener(`resize`, callback)
    })
    // .map(x => ({
    //   type: `thresholdUp`,
    //   data: x
    // }))
  }

  function globalDriver(source$, runSA) {

    const sharedSource$ = rxjsAdapter.adapt(source$, runSA.streamSubscribe).publish().refCount()
    
    let watchId
    const defaultConfig = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    }

    const geolocationRead$ = sharedSource$
      .filter(x => x.type === `geolocation`)
      .map(x => x.data)
      .map(x => {
        if (x.hasOwnProperty(`timeout`)) {
          return x
        } else {
          console.warn(`Invalid geolocation config sent, using default`)
          return defaultConfig
        }
      })
      .startWith(defaultConfig)
      .map((config) : any => {
        if ("geolocation" in navigator) {
          const stream = new ReplaySubject(1)
          const geo_success = position => {
            stream.next({
              type: `position`,
              data: position
            })
          }
          const geo_error = error => {
            stream.next({
              type: `error`,
              data: `ERROR(${error.code}): ${error.message}`
            })
          }

          if (watchId) {
            navigator.geolocation.clearWatch(watchId)
          }

          watchId = navigator.geolocation.watchPosition(geo_success, geo_error, config)

          return stream

        } else {
          return O.of({
            type: `error`,
            data: `Geolocation API not available.`
          })
        }
      })
      .switch()
    
    sharedSource$
      .filter(x => x.type === `preventDefault`)
      .map(x => x.data)
      .map(ev => {
        ev.preventDefault()
        //console.log(`preventing default`)
        if(ev.type === `blur`) {
          //console.log(`preventing blur default, keeping input focus`, ev)
          ev.target.focus()
          //setTimeout(() => ev.target.focus(), 4)
        } 
      }).subscribe(() => {})
    
    sharedSource$
      .filter(x => x.type === `stopPropagation`)
      .map(x => x.data)
      .map(ev => {
        ev.stopPropagation()
      }).subscribe(() => {})

    sharedSource$
      .filter(x => x.type === `addEventGuid`)
      .map(x => x.data)
      .do(data => {
        data.event.guid = data.guid
      }).subscribe(() => {})

    sharedSource$
      .filter(x => x.type === `preventWindowBlur`)
      .do(x => console.log(`preventWindowBlur`))
      .map(x => x.data)
      .filter(ev => document.activeElement !== ev.ownerTarget)
      .map(ev => {
        ev.preventDefault()
      }).subscribe(() => {})

    sharedSource$
      .filter(x => x.type === `blur`)
      .do(x => console.log(`blur`))
      .map(x => x.data)
      .map(el => {
        el.blur()
      }).subscribe(() => {})
    

    sharedSource$
      .filter(x => x.type === `redirect`)
      .map(x => x.data)
      .do(loc => {
        (<any> document).location = loc
      })
      .subscribe(n => {})
      //.then(c => console.log(`Global redirect$ completed`), e => console.error(`Global redirect$ error: `, e))


    const cookie$ = sharedSource$
      .filter(x => x.type === `cookie` && x.data)
      .map(x => x.data)
      .publish().refCount()

    // const cookieClear$ = cookie$
    //   .filter(x => x.type === `clear`)
    //   .map(x => {
    //     return x
    //   })
    //   .do(() => cookie.empty())

    // const cookieSet$ = cookie$
    //   .filter(x => x.type === `set` && x.data && x.data.key && x.data.value)
    //   .do(x => cookie.set(x.data.key, x.data.value))

    const cookieGet$ = cookie$
      .filter(x => x.type === `get`)

    const cookieRead$ = cookieGet$
      .map(x => {
        return x
      })
      .map(() => Cookie.get())
      .startWith(Cookie.get())
      //.delay(1)  // Since this is a merging of multiple drivers, delay output to ensure all
                 // subscribers are wired before initial emission.

    return {
      cookie$: runSA.remember(runSA.adapt(cookieRead$, rxjsAdapter.streamSubscribe)),
      geolocation$: runSA.remember(runSA.adapt(geolocationRead$, rxjsAdapter.streamSubscribe)),
      resize$: runSA.remember(runSA.adapt(makeResizeStream(), rxjsAdapter.streamSubscribe))
    }
  }

  (<any> globalDriver).streamAdapter = rxjsAdapter

  return globalDriver

}
