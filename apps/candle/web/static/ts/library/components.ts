import {Observable as O} from 'rxjs'
import {div, h6, em, span, select, option, textarea, label} from '@cycle/dom'
import isolate from '@cycle/isolate'
import {default as TextInput, SmartTextInputValidation} from './bootstrapTextInputGated'
import validator = require('validator')


const {isEmail} = validator

function genericValidator(input, f, empty_is_error) {
  if (!input && !empty_is_error) {
    return {
      value: input,
      errors: []
    }
  } else if (input) {
    if (!input.length && !empty_is_error) {
      return {
        value: input,
        errors: []
      }
    } else if (input.length) {
      return f(input)
    } else {
      return  {
        value: input,
        errors: ['Cannot be empty']
      }
    }
  } else {
    return {
      value: input,
      errors: ['Cannot be empty']
    }
  }
}

const emailTest = isEmail

function makeEmailValidator(empty_is_error = true): (string) => SmartTextInputValidation  {
  return function(input): SmartTextInputValidation {
    //if (input && input.match(/^[a-zA-Z .]+$/)) {
    if (genericValidator(input, emailTest, empty_is_error)) {
      return {
        value: input,
        errors: []
      }
    } else {
      return {
        value: input,
        errors: ['Invalid e-mail address']
      }
    }
  }
}

const email_input_props = {
  placeholder: `E-mail address`,
  name: `registration-email`,
  style_class: `.email-input.form-control`,
  autofocus: false,
  empty_is_error: true
}

//   placeholder: 'E-mail address',
//   name: 'email',
//   autofocus: true,
//   //required: true,
//   styleClass: '.email-input',
//   // key: `login`
//   emptyIsError: true
// })


export function EmailInputComponent(sources, initial_text$, highlight_error$, props = email_input_props) {
  const out = isolate(TextInput)(sources, {
    validator: makeEmailValidator(props.empty_is_error),
    props$: O.of(props),
    initial_text$: initial_text$.map(x => {
      return x
    }),
    highlight_error$: highlight_error$ || O.of(true)
  })

  return out
}