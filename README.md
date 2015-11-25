# DynamoDB Storage

[![Build Status](https://travis-ci.org/Reekoh/mysql-storage.svg)](https://travis-ci.org/Reekoh/dynamodb-storage)
![Dependencies](https://img.shields.io/david/Reekoh/dynamodb-storage.svg)
![Dependencies](https://img.shields.io/david/dev/Reekoh/dynamodb-storage.svg)
![Built With](https://img.shields.io/badge/built%20with-gulp-red.svg)

DynamoDB Storage Plugin for the Reekoh IoT Platform.

## Assumptions:

1. Data would be in JSON format
2. Data would be processed based on configuration format
3. No data conversion within the plugin please use converters in Reekoh
4. Field configuration is not required and will insert data as is if not specified

## Process

1. Data would be written directly to the DynamoDB Table in the Region it is defined
2. Data will be written using aws-sdk standard library
3. All errors will be logged and no data should be written
4. Data will be parsed accordingly based on field configuration
5. Data will be overwritten if the primary key/primary+sort key is already existing per behavior of DynamoDB

## Field Configuration (Optional)

1. Input for this field is in JSON format {"(field_name)" : {"source_field" : "value"}}
2. field_name will be the name of the column in the DynamoDB Table
3  source_field (required) value will be the name of the field in the JSON Data passed to the plugin


```javascript
{
  "partition_string_pk": {
	"source_field": "partition_string"
  },
  "sort_number_pk": {
  	"source_field": "sort_number"
  },
  "co2_field": {
	"source_field": "co2"
  },
  "temp_field": {
	"source_field": "temp"
  },
  "quality_field": {
	"source_field": "quality"
  },
  "metadata_field": {
	"source_field": "metadata"
  },
  "reading_time_field": {
	"source_field": "reading_time"
  },
  "random_data_field": {
	"source_field": "random_data"
  },
  "is_normal_field": {
	"source_field": "is_normal"
  }
}
```

### Sample Data:

```javascript
{
  partition_string_pk: 'SAMPLE_PK',
  sort_number_pk: 123456
  co2: '11%',
  temp: 23,
  quality: 11.25,
  metadata: '{"name": "warehouse air conditioning"}',
  reading_time: '2015-11-27T11:04:13.539Z',
  random_data: 'abcdefg',
  is_normal: true
}
```

### DynamoDB Table Definition:

Type Field mapping    |
----------------------|
partition_string_pk   | (Primary Key - string)
sort_number_pk        | (Sort Key - number)

