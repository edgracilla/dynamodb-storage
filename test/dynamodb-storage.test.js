/* global describe, it, before, after */

'use strict'

const amqp = require('amqplib')
const cp = require('child_process')
const should = require('should')
const AWS = require('aws-sdk')

const INPUT_PIPE = 'demo.pipe.storage'
const BROKER = 'amqp://guest:guest@127.0.0.1/'
const SORT_KEY = new Date().getTime().toString()

let _app = null
let _conn = null
let _channel = null

let conf = {
  region: 'us-west-2',
  table: 'reekoh_table',
  accessKeyId: 'AKIAIOM4O5GBVUBZQTLA',
  secretAccessKey: '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'
}

let record = {
  partition_string_pk: 'PRIMARY_PARTITION_KEY',
  sort_number_pk: SORT_KEY,
  co2: '11%',
  temp: 23,
  quality: 11.25,
  reading_time: '2015-11-27T11:04:13.539Z',
  metadata: '{"metadata_json": "reekoh metadata json"}',
  random_data: 'abcdefg',
  is_normal: true
}

describe('DynamoDB Storage', function () {
  before('init', () => {
    process.env.BROKER = BROKER
    process.env.INPUT_PIPE = INPUT_PIPE
    process.env.CONFIG = JSON.stringify(conf)

    amqp.connect(BROKER).then((conn) => {
      _conn = conn
      return conn.createChannel()
    }).then((channel) => {
      _channel = channel
    }).catch((err) => {
      console.log(err)
    })
  })

  after('terminate child process', function (done) {
    this.timeout(7000)
    _conn.close()
    _app.send({
      type: 'close'
    })

    setTimeout(function () {
      _app.kill('SIGKILL')
      done()
    }, 5000)
  })

  describe('#spawn', function () {
    it('should spawn a child process', function () {
      should.ok(_app = cp.fork(process.cwd()), 'Child process not spawned.')
    })
  })

  describe('#handShake', function () {
    it('should notify the parent process when ready within 5 seconds', function (done) {
      this.timeout(5000)

      _app.on('message', function (message) {
        if (message.type === 'ready') {
          done()
        }
      })
    })
  })

  describe('#data', function () {
    it('should process the data', function (done) {
      this.timeout(8000)

      _channel.sendToQueue(INPUT_PIPE, new Buffer(JSON.stringify(record)))

      _app.on('message', (msg) => {
        if (msg.type === 'processed') done()
      })
    })
  })

  describe('#data', function () {
    it('should have inserted the data', function (done) {
      this.timeout(10000)

      AWS.config.update({
        accessKeyId: conf.accessKeyId,
        secretAccessKey: conf.secretAccessKey
      })

      let docClient = new AWS.DynamoDB.DocumentClient({region: conf.region})
      let searchParams = {
        TableName: conf.table,
        Key: {
          partition_string_pk: 'PRIMARY_PARTITION_KEY',
          sort_number_pk: SORT_KEY
        }
      }

      docClient.get(searchParams, function (err, data) {
        should.ifError(err)
        should.exist(data.Item)
        let resp = data.Item

        should.equal(record.co2, resp.co2, 'Data validation failed. Field: co2')
        should.equal(record.temp, resp.temp, 'Data validation failed. Field: temp')
        should.equal(record.quality, resp.quality, 'Data validation failed. Field: quality')
        should.equal(record.random_data, resp.random_data, 'Data validation failed. Field: random_data')
        should.equal(record.reading_time, resp.reading_time, 'Data validation failed. Field: reading_time')
        should.equal(record.metadata, resp.metadata, 'Data validation failed. Field: metadata')
        should.equal(record.is_normal, resp.is_normal, 'Data validation failed. Field: is_normal')
        done()
      })
    })
  })
})
