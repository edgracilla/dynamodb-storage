'use strict'

const reekoh = require('reekoh')
const _plugin = new reekoh.plugins.Storage()

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
      _plugin.log(JSON.stringify({
        title: 'Record Successfully inserted to DynamoDB.',
        data: record
      }))
    }

    callback(error)
  })
}

_plugin.on('data', (data) => {
  if (isPlainObject(data)) {
    sendData(data, (error) => {
      if (error) return _plugin.logException(error)
      process.send({ type: 'processed' })
    })
  } else if (Array.isArray(data)) {
    async.each(data, (datum, done) => {
      sendData(datum, done)
    }, (error) => {
      if (error) _plugin.logException(error)
    })
  } else {
    _plugin.logException(new Error(`Invalid data received. Data must be a valid Array/JSON Object or a collection of objects. Data: ${data}`))
  }
})

_plugin.once('ready', () => {
  let AWS = require('aws-sdk')
  let options = _plugin.config

  AWS.config.update({
    accessKeyId: options.accessKeyId,
    secretAccessKey: options.secretAccessKey
  })

  docClient = new AWS.DynamoDB.DocumentClient({region: options.region})

  table = options.table

  _plugin.log('DynamoDB plugin ready.')
  process.send({ type: 'ready' })
})
