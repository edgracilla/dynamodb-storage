'use strict'

const reekoh = require('reekoh')
const plugin = new reekoh.plugins.Storage()

const async = require('async')
const isPlainObject = require('lodash.isplainobject')

let table = null
let docClient = null

let sendData = (data, callback) => {
  docClient.put({
    TableName: table,
    Item: data
  }, (error, record) => {
    if (!error) {
      plugin.log(JSON.stringify({
        title: 'Record Successfully inserted to DynamoDB.',
        data: record
      }))
    }

    callback(error)
  })
}

plugin.on('data', (data) => {
  if (isPlainObject(data)) {
    sendData(data, (error) => {
      if (error) return plugin.logException(error)
      plugin.emit('processed')
    })
  } else if (Array.isArray(data)) {
    async.each(data, (datum, done) => {
      sendData(datum, done)
    }, (error) => {
      if (error) plugin.logException(error)
    })
  } else {
    plugin.logException(new Error(`Invalid data received. Data must be a valid Array/JSON Object or a collection of objects. Data: ${data}`))
  }
})

plugin.once('ready', () => {
  let AWS = require('aws-sdk')
  let options = plugin.config

  AWS.config.update({
    accessKeyId: options.accessKeyId,
    secretAccessKey: options.secretAccessKey
  })

  docClient = new AWS.DynamoDB.DocumentClient({region: options.region})

  table = options.table

  plugin.log('DynamoDB plugin ready.')
  plugin.emit('init')
})

module.exports = plugin
