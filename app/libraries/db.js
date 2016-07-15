(() => {
	'use strict';

	const mysql = require('mysql');
	const tunnel = require('open-ssh-tunnel');
	const fs = require('fs');

	class DB {
		constructor(data) {
			data.dateStrings = true;

			this.open = new Promise((resolve, reject) => {
				this.connect(data)
					.then(() => {
						var processes = [];

						this.collations = {};
						this.collationsDefault = {};
						this.variables = {};
						this.engines = {};

						processes.push(new Promise((res, rej) => {
							this.connection.query('select * from ??.?? order by ??, ??', ['information_schema', 'COLLATIONS', 'CHARACTER_SET_NAME', 'COLLATION_NAME'], (err, result, fields) => {
									result.forEach((row) => {
										if (this.collations[row.CHARACTER_SET_NAME] === undefined) {
											this.collations[row.CHARACTER_SET_NAME] = {};
										}

										this.collations[row.CHARACTER_SET_NAME][row.COLLATION_NAME] = row;

										if (row.IS_DEFAULT === 'Yes') {
											this.collationsDefault[row.CHARACTER_SET_NAME] = row.COLLATION_NAME;
										}
									});

									res();
								});
						}));

						processes.push(new Promise((res, rej) => {
							this.connection.query('show variables where ?? in (?)', ['Variable_name', ['character_set_server', 'collation_server', 'default_storage_engine', 'default_storage_engine']], (err, result, fields) => {
									result.forEach((row) => {
										this.variables[row.Variable_name] = row.Value;
									});

									res();
								});
						}));

						processes.push(new Promise((res, rej) => {
							this.connection.query('select * from ??.?? order by ??', ['information_schema', 'engines', 'ENGINE'], (err, result, fields) => {
									result.forEach((row) => {
										if (row.SUPPORT !== 'NO') {
											this.engines[row.ENGINE] = row;
										}
									});

									res();
								});
						}));

						Promise.all(processes).then(() => {
							resolve();
						});
					})
					.catch((err) => {
						reject(err);
					});
			});
		}

		static getInstance(data) {
			let db = new DB(data);

			return db;
		}

		connect(data) {
			return new Promise((resolve, reject) => {
				if (data.ssh) {
					var option = {
						host: data.sshhost,
						username: data.sshuser,
						port: data.sshport || 22,
						srcAddr: data.host,
						srcPort: data.port || 3306,
						dstAddr: data.host,
						dstPort: data.port || 3306,
						localAddr: '127.0.0.1',
						localPort: 5000,
						forwardTimeout: 5000
					};

					if (data.sshkeyfile.length) {
						option.privateKey = fs.readFileSync(data.sshkeyfile);
						option.passphrase = data.sshpassword;
					} else {
						option.password = data.sshpassword;
					}

					tunnel(option).then((server) => {
						this.tunnel = server;

						this.connection = mysql.createConnection({
							user: data.user,
							password: data.password,
							host: '127.0.0.1',
							port: '5000',
							dateStrings: true
						});

						this.connection.connect((err) => {
							if (err) {
								reject(err);
							} else {
								resolve();
							}
						});
					}).catch((err) => {
						reject(err);
					});
				} else {
					this.connection = mysql.createConnection(data);

					this.connection.connect((err) => {
						if (err) {
							reject(err);
						} else {
							resolve();
						}
					});
				}
			});
		}

		close() {
			return new Promise((resolve, reject) => {
				if (this.tunnel) {
					this.tunnel.close();
				}

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
			return new Promise((resolve, reject) => {
				this.open
					.then(() => {
						if (values === undefined || values === null || values.constructor.name !== 'Array') {
							values = [];
						}

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
					})
					.catch((err) => {
						reject(err);
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
