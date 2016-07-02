(() => {
	'use strict';

	const Config = require('electron-config');
	const config = new Config({
		name: 'dbbr'
	});

	window.$storage = {
		data: {},

		setup: function(storages) {
			for (var storageKey in storages) {
				var defaultValue = storages[storageKey],
					defaultValueType = defaultValue === undefined ? 'undefined' : defaultValue.constructor.name;

				var storageValue = $storage.get(storageKey),
					storageValueType = storageValue === undefined ? 'undefined' : storageValue.constructor.name;

				if (defaultValueType !== storageValueType) {
					$storage.set(storageKey, defaultValue);
				}
			}

			return this;
		},

		init: function(storages) {
			this.setup(storages);

			return this;
		},

		get: function(name) {
			return config.get(name);
		},

		set: function(name, value) {
			config.set(name, value);

			return this;
		},

		delete: function(name) {
			config.delete(name);

			return this;
		},

		toString: function() {
			return JSON.parse(config.store);
		}
	};

	const mysql = require('mysql');

	class DB {
		constructor(data) {
			this.connection = mysql.createPool(data);
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
	}

	window.DB = DB;
})();
