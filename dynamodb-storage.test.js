/*
 * Just a sample code to test the storage plugin.
 * Kindly write your own unit tests for your own plugin.
 */
'use strict';

var cp     = require('child_process'),
	assert = require('assert'),
	AWS    = require('aws-sdk'),
	should = require('should'),
	storage;

var ACCESSKEYID     = 'AKIAJNREAE4CIKEJVUWA',
	SECRETACCESSKEY = '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',
	REGION          = 'us-west-2',
	TABLE           = 'reekoh_table',
	SORT_KEY  		= new Date().getTime();

var record = {
	partition_string_pk: 'PRIMARY_PARTITION_KEY',
	sort_number_pk: SORT_KEY,
	co2: '11%',
	temp: 23,
	quality: 11.25,
	reading_time: '2015-11-27T11:04:13.539Z',
	metadata: '{"metadata_json": "reekoh metadata json"}',
	random_data: 'abcdefg',
	is_normal: true
};

describe('Storage', function () {
	this.slow(5000);

	after('terminate child process', function () {
		storage.send({
			type: 'close'
		});

		setTimeout(function () {
			storage.kill('SIGKILL');
		}, 3000);
	});

	describe('#spawn', function () {
		it('should spawn a child process', function () {
			assert.ok(storage = cp.fork(process.cwd()), 'Child process not spawned.');
		});
	});

	describe('#handShake', function () {
		it('should notify the parent process when ready within 5 seconds', function (done) {
			this.timeout(5000);

			storage.on('message', function (message) {
				if (message.type === 'ready')
					done();
			});

			storage.send({
				type: 'ready',
				data: {
					options : {
						accessKeyId     : ACCESSKEYID,
						secretAccessKey : SECRETACCESSKEY,
						region          : REGION,
						table           : TABLE,
						fields          : JSON.stringify({
												partition_string_pk: {source_field:'partition_string_pk'},
												sort_number_pk: {source_field:'sort_number_pk'},
												co2_field: {source_field: 'co2'},
												temp_field: {source_field: 'temp'},
												quality_field: {source_field: 'quality'},
												reading_time_field: {source_field: 'reading_time'},
												metadata_field: {source_field: 'metadata'},
												random_data_field: {source_field: 'random_data'},
												is_normal_field: {source_field: 'is_normal'}
											})
					}
				}
			}, function (error) {
				assert.ifError(error);
			});
		});
	});

	describe('#data', function () {
		it('should process the data', function (done) {
			storage.send({
				type: 'data',
				data: record
			}, done);
		});
	});

	describe('#data', function () {
		it('should have inserted the data', function (done) {
			this.timeout(10000);

			AWS.config.update({
				accessKeyId     : ACCESSKEYID,
				secretAccessKey : SECRETACCESSKEY
			});

			var docClient = new AWS.DynamoDB.DocumentClient({region: REGION});
			var searchParams  = {TableName : TABLE,
						         Key : {
									 	partition_string_pk : 'PRIMARY_PARTITION_KEY',
									 	sort_number_pk: SORT_KEY
									   }
								};

			docClient.get(searchParams, function(err, data){
				assert.ifError(err);
				should.exist(data.Item);
				var resp = data.Item;

				should.equal(record.co2, resp.co2_field, 'Data validation failed. Field: co2');
				should.equal(record.temp, resp.temp_field, 'Data validation failed. Field: temp');
				should.equal(record.quality, resp.quality_field, 'Data validation failed. Field: quality');
				should.equal(record.random_data, resp.random_data_field, 'Data validation failed. Field: random_data');
				should.equal(record.reading_time, resp.reading_time_field, 'Data validation failed. Field: reading_time');
				should.equal(record.metadata, resp.metadata_field, 'Data validation failed. Field: metadata');
				should.equal(record.is_normal, resp.is_normal_field, 'Data validation failed. Field: is_normal');
				done();
			});

		});
	});

});