// import xs from 'xstream'
//
// export default function intent(sources) {
//   const fromHTTP = sources.HTTP.response$$
//     //.debug(x => console.log(`response$$`))
//     //.debug()
//     .filter(x => x.request.url === `/api/create/listing`)
//     .flatten()
//     //.debug()
//     .filter(x => x.status === 200)
//     .map(x => x.body)
//     //.debug()
//     .replaceError(err => xs.of({
//       type: `success`,
//       data: {
//         id: 12345
//       }
//     }))
//     .filter(x => x.type === `success`)
//     .map(x => x.data)
//     //.debug()
//     .remember()
//
//   return {
//     next$: sources.DOM.select(`.appNextButton`).events(`click`),
//     back$: sources.DOM.select(`.appBackButton`).events(`click`),
//     fromHTTPSuccess$: fromHTTP,//fromHTTP.success$,
//     fromHTTPError$: xs.never()//fromHTTP.error$
//   }
// }
