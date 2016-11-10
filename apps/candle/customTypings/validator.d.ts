import validator = require('validator')

declare module "validator/lib/isEmail" {
  export = validator.isEmail
}