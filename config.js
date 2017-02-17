'use strict'

const validate = require('validate.js')

let constraints = {
  accessKeyId: {
    presence: true
  },
  secretAccessKey: {
    presence: true
  },
  region: {
    presence: true
  },
  table: {
    presence: true
  }
}

module.exports.validate = (attribs) => {
  return validate(attribs, constraints)
}

