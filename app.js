'use strict';

var platform          = require('./platform'),
	async             = require('async'),
	isEmpty           = require('lodash.isempty'),
	docClient, params = {};

/**
 * Emitted when device data is received. This is the event to listen to in order to get real-time data feed from the connected devices.
 * @param {object} data The data coming from the device represented as JSON Object.
 */

platform.on('data', function (data) {
	var processedData = {};

	var save = function () {
		var itemParams = {TableName: params.table, Item: {}};
		itemParams.Item = processedData;

		docClient.put(itemParams, function (error) {
			if (error) {
				console.error('Error creating record on Elasticsearch', error);
				platform.handleException(error);
			} else {
				platform.log(JSON.stringify({
					title: 'Record Successfully inserted to DynamoDB.',
					data: processedData
				}));
			}
		});
	};

	if (params.fields) {
		async.forEachOf(params.fields, function (field, key, callback) {
			var datum = data[field.source_field];
			if (datum !== undefined && datum !== null) processedData[key] = datum;
			callback();
		}, save);
	} else {
		processedData = data;
		save();
	}
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

	var init = function (e) {

		if (e) {
			console.error('Error parsing JSON field configuration for DynamoDB.', e);
			return platform.handleException(e);
		}

		AWS.config.update({
			accessKeyId: options.accessKeyId,
			secretAccessKey: options.secretAccessKey
		});

		docClient = new AWS.DynamoDB.DocumentClient({region: options.region});
		params.table = options.table;

		platform.log('DynamoDB plugin ready.');
		platform.notifyReady();

	};

	if (options.fields) {
		var parseFields = JSON.parse(options.fields);
		params.fields = parseFields;

		async.forEachOf(parseFields, function (field, key, callback) {

			if (isEmpty(field.source_field)) {
				callback(new Error('Source field is missing for ' + field + ' in DynamoDB Plugin'));
			} else
				callback();
		}, init);

	} else
		init(null);
});