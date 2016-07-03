(() => {
	'use strict';

	const mysql = require('mysql');

	class DB {
		constructor(data) {
			data.dateStrings = true;

			this.connection = mysql.createConnection(data);
		}

		static getInstance(data) {
			let db = new DB(data);

			return db;
		}

		connect() {
			return new Promise((resolve, reject) => {
				this.connection.connect((err) => {
					if (err) {
						reject(err);
					} else {
						resolve();
					}
				});
			});
		}

		close() {
			return new Promise((resolve, reject) => {
				this.connection.end((err) => {
					if (err) {
						reject(err);
					} else {
						resolve();
					}
				});
			});
		}

		query(sql, values) {
			if (values === undefined || values === null || values.constructor.name !== 'Array') {
				values = [];
			}

			return new Promise((resolve, reject) => {
				this.connection.query(sql, values, (err, result, fields) => {
					if (err) {
						reject(err);
					} else {
						resolve({
							result,
							fields
						});
					}
				});
			});
		}

		// alias to query
		q(sql, values) {
			return this.query(sql, values);
		}

		format(sql, values) {
			return mysql.format(sql, values);
		}
	}

	// FieldPacket type mapping
	DB.TYPES = {};

	DB.TYPES[0] = 'decimal';
	DB.TYPES[1] = 'tiny';
	DB.TYPES[2] = 'short';
	DB.TYPES[3] = 'long';
	DB.TYPES[4] = 'float';
	DB.TYPES[5] = 'double';
	DB.TYPES[6] = 'null';
	DB.TYPES[7] = 'timestamp';
	DB.TYPES[8] = 'longlong';
	DB.TYPES[9] = 'int24';
	DB.TYPES[10] = 'date';
	DB.TYPES[11] = 'time';
	DB.TYPES[12] = 'datetime';
	DB.TYPES[13] = 'year';
	DB.TYPES[14] = 'newdate';
	DB.TYPES[15] = 'varchar';
	DB.TYPES[16] = 'bit';
	DB.TYPES[17] = 'timestamp2';
	DB.TYPES[18] = 'datetime2';
	DB.TYPES[19] = 'time2';
	DB.TYPES[245] = 'json';
	DB.TYPES[246] = 'newdecimal';
	DB.TYPES[247] = 'enum';
	DB.TYPES[248] = 'set';
	DB.TYPES[249] = 'tiny_blob';
	DB.TYPES[250] = 'medium_blob';
	DB.TYPES[251] = 'long_blob';
	DB.TYPES[252] = 'blob';
	DB.TYPES[253] = 'var_string';
	DB.TYPES[254] = 'string';
	DB.TYPES[255] = 'geometry';

	module.exports = DB;
})();
