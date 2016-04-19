'use strict';

var async         = require('async'),
	isArray       = require('lodash.isarray'),
	platform      = require('./platform'),
	isPlainObject = require('lodash.isplainobject'),
	docClient, table;

let sendData = function (data, callback) {
	docClient.put({
		TableName: table,
		Item: data
	}, (error, record) => {
		if (!error) {
			platform.log(JSON.stringify({
				title: 'Record Successfully inserted to DynamoDB.',
				data: record
			}));
		}

		callback(error);
	});
};

platform.on('data', function (data) {
	if (isPlainObject(data)) {
		sendData(data, (error) => {
			if (error) platform.handleException(error);
		});
	}
	else if (isArray(data)) {
		async.each(data, (datum, done) => {
			sendData(datum, done);
		}, (error) => {
			if (error) platform.handleException(error);
		});
	}
	else
		platform.handleException(new Error(`Invalid data received. Data must be a valid Array/JSON Object or a collection of objects. Data: ${data}`));
});

/**
 * Emitted when the platform shuts down the plugin. The Storage should perform cleanup of the resources on this event.
 */
platform.once('close', function () {
	platform.notifyClose();
});

/**
 * Emitted when the platform bootstraps the plugin. The plugin should listen once and execute its init process.
 * Afterwards, platform.notifyReady() should be called to notify the platform that the init process is done.
 * @param {object} options The options or configuration injected by the platform to the plugin.
 */
platform.once('ready', function (options) {
	var AWS = require('aws-sdk');

	AWS.config.update({
		accessKeyId: options.accessKeyId,
		secretAccessKey: options.secretAccessKey
	});

	docClient = new AWS.DynamoDB.DocumentClient({region: options.region});

	table = options.table;

	platform.log('DynamoDB plugin ready.');
	platform.notifyReady();
});