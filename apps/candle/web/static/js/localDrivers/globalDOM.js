import {Observable as O, ReplaySubject} from 'rxjs'
import {cookie} from 'cookie_js'
import rxjsAdapter from '@cycle/rxjs-adapter'

export default function makeGlobalDOMEventDriver() {
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
    .map(x => ({
      type: `thresholdUp`,
      data: x
    }))
  }

  //
  // function makeCookieStream() {
  //   let callback
  //
  //   const start = listener => {
  //     let lastWidth = window.innerWidth
  //     const threshold = 768 // pixels
  //     callback = ev => {
  //       if (lastWidth < threshold && ev.target.innerWidth >= threshold) {
  //         listener.next(ev)
  //       }
  //
  //       lastWidth = ev.target.innerWidth
  //     }
  //
  //     window.addEventListener(`resize`, callback)
  //   }
  //
  //   const stop = () => {
  //     listener.complete()
  //     window.removeEventListener(`resize`, callback)
  //   }
  //
  //   return xs.create({start, stop})
  //     .map(x => ({
  //       type: `cookie`,
  //       data: x
  //     }))
  // }
  //

  function GlobalDOMEventDriver(source$, runSA) {

    const sharedSource$ = rxjsAdapter.adapt(source$, runSA.streamSubscribe).share()

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
      .map(config => {
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
      .map(data => ({
        type: `geolocation`,
        data
      }))
      .map(x => {
        return x
      })
    
    // sharedSource$
    //   .filter(x => x.type === `preventDefault`)
    //   .map(x => x.data)
    //   .map(ev => {
    //     if(ev.type === `blur`) {
    //       console.log(`preventing blur default, keeping input focus`)
    //       setTimeout(() => ev.target.focus(), 4)
    //     } else {
    //       ev.preventDefault()
    //     }
    //   }).subscribe(() => {})
    
    // sharedSource$
    //   .filter(x => x.type === `preventWindowBlur`)
    //   .debug(x => console.log(`preventWindowBlur`))
    //   .map(x => x.data)
    //   .filter(ev => document.activeElement !== ev.ownerTarget)
    //   .map(ev => {
    //     ev.preventDefault()
    //   }).subscribe(() => {})
    

    sharedSource$
      .filter(x => x.type === `redirect`)
      .map(x => x.data)
      .do(loc => {
        document.location = loc
      })
      .subscribe(n => {})
      //.then(c => console.log(`Global redirect$ completed`), e => console.error(`Global redirect$ error: `, e))


    const cookie$ = sharedSource$
      .filter(x => x.type === `cookie` && x.data)
      .map(x => x.data)
      .share()

    const cookieClear$ = cookie$
      .filter(x => x.type === `clear`)
      .map(x => {
        return x
      })
      .do(() => cookie.empty())
      //.tap(x => Object.keys(cookie.all()).forEach(key => cookie.set(key, ``, {expires: -1}))

    const cookieSet$ = cookie$
      .filter(x => x.type === `set` && x.data && x.data.key && x.data.value)
      .do(x => cookie.set(x.data.key, x.data.value))

    const cookieGet$ = cookie$
      .filter(x => x.type === `get`)

    const cookieRead$ = O.merge(cookieClear$, cookieSet$, cookieGet$)
      .map(x => {
        return x
      })
      .map(() => cookie.all())
      .startWith(cookie.all())
      .map(x => ({
        type: `cookie`,
        data: x
      }))
      .map(x => {
        return x
      })

      //.observe(n => {})
      //.then(() => console.log(`cookieSourceCompleted`), e => console.error(`cookieSource error: ${e}`))

    //console.log(document.cookie)

    return runSA.remember(runSA.adapt(O.merge(
      makeResizeStream(),
      cookieRead$,
      geolocationRead$
    ), rxjsAdapter.streamSubscribe))
  }

  GlobalDOMEventDriver.streamAdapter = rxjsAdapter

  return GlobalDOMEventDriver

}
