// import xs from 'xstream'
// import {h, h3, nav, ul, li, div, a, i, span, button, input} from '@cycle/dom'
// import combineObj from '../../../combineObj'
// import {attrs} from '../../../utils'
//
//
// function renderHeading(val) {
//   return div(`.panel-title`, [h3([val])])
// }
//
// function renderPanel({state, components: {radio, autocomplete}}) {
//   if (state.waiting) {
//     return div(`.panel.modal`, [`Waiting`])
//   } else {
//     return div(`.input-section`, [
//       div(`.form-section`, [
//         div(`.empty-section`),
//         div(`.content-section`, [
//           div(`.panel`, [
//             renderHeading(`Where is the event?`),
//             radio,
//             autocomplete,
//             h(`mapbox-map`)
//           ])
//         ])
//       ])
//       , div(`.controller-section`, [
//         div(`.separator`),
//         div(`.button-section`, [
//           a(`.appBackButton.back-button`, {attrs: {href: state.listing ? `#` : `/create`}}, [
//             span(`.fa.fa-angle-left`),
//             span(`.back-text`, [`Back`])
//           ]),
//           a(`.appNextButton.next-button`, {attrs: {href: `#`}}, [
//             span(`.next-text`, [`Next`]),
//             span(`.fa.fa-angle-right`)
//           ])
//         ])
//       ])
//     ])
//   }
// }
//
// // export default function view({state$, components}) {
// //   return combineObj({state$, components: combineObj(components)}).map(info => {
// //     return state.waiting ? div(`.panel.modal`, [`Waiting`]) :
// //       renderPanel(state)
// //   })
// // }
//
//
// export default function view({state$, components}) {
//   return combineObj({state$, components: combineObj(components)}).map(info => {
//     return info.state.waiting ? div(`.panel.modal`, [`Waiting`]) : renderPanel(info)
//   })
// }
