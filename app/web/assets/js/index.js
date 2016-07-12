$(function() {
	'use strict';

	// Elements
	window.$$ = {};

	// Init all ID elements
	$('[id]').each(function() {
		$$[this.id.toUpperCase().replace(/-/g, '')] = $(this);
	});

	// Additional elements

	$$.BODY = $('body');
	$$.NEWCONNECTIONFORMINPUTS = $$.NEW.find('input');

	// DB
	var $db;

	// Connection state
	var $connectionState = false;

	// Current connection key
	var $KEY;

	var $connect = function(data) {
		$connectionState = false;

		$$.POPUP.attr('data-popup', 'loading');

		$$.CONTENT
			.attr('data-key', $KEY)
			.attr('data-connection', 'connecting');

		var connectionName = data.user + '@' + data.host;

		if (data.ssh && data.sshhost.length) {
			connectionName += '@' + data.sshhost;
		}

		$$.CONNECTIONNAME.text(connectionName);

		if ($db && $db.constructor.name === 'DB') {
			$db.close()
				.catch(function(err) {
				});
			$$.DATABASELISTGROUP.html('');
			$$.TABLELIST.html('');
			$$.HISTORYLIST.html('');
			$$.FOLDERLIST.html('');
			$$.TOTAL.text('');
			$$.TABLEHEAD.html('');
			$$.TABLEBODY.html('');
			$$.RESULT.removeAttr('data-state');
		}

		$db = DB.getInstance(data);

		$db.open
			.then(function() {
				$connectionState = true;

				$$.POPUP.removeAttr('data-popup');

				$$.CONTENT
					.attr('data-connection', 'connected')
					.attr('data-tab', 'tables');

				$$.CONTENT.toggleClass('guest', $KEY === false);

				return $populate.databases();
			})
			.then(function() {
				$$.DATABASELIST.val($$.DATABASELIST.find('option:first-child').attr('value'));

				$$.DATABASELIST.trigger('change');

				var encodingHTML = $template('newdatabase-select-default-item', {
					name: $db.variables.character_set_server
				});

				encodingHTML += $template('newdatabase-select-disabled-item');

				for (var collationkey in $db.collations) {
					encodingHTML += $template('newdatabase-select-item', {
						name: collationkey
					});
				}

				$$.NEWDATABASEENCODING.html(encodingHTML);
				$$.NEWTABLEENCODING.html(encodingHTML);
				$$.TABLEEDITENCODING.html(encodingHTML);

				var enginesHTML = $template('newdatabase-select-default-item', {
					name: $db.variables.default_storage_engine
				});

				enginesHTML += $template('newdatabase-select-disabled-item');

				for (var enginekey in $db.engines) {
					enginesHTML += $template('newdatabase-select-item', {
						name: enginekey
					});
				}

				$$.NEWTABLEENGINE.html(enginesHTML);
			})
			.catch(function(err) {
				$$.CONTENT.attr('data-connection', '');

				$$.POPUPERROR.find('p').html(err);
				$$.POPUP.attr('data-popup', 'error');
			});

		// Init history
		if ($KEY) {
			var history = $history($KEY);

			var historyHTML = '';

			for (var i = 0; i < history.items.length; i++) {
				var date = new Date(history.items[i].date);

				historyHTML += $template('history-list-item', {
					state: history.items[i].state ? 'success' : 'error',
					query: history.items[i].query,
					db: history.items[i].db,
					total: history.items[i].total || 0,
					date: date.getFullYear() + '-' + ('00' + (date.getMonth() + 1)).slice(-2) + '-' + ('00' + date.getDate()).slice(-2) + ' ' + ('00' + date.getHours()).slice(-2) + ':' + ('00' + date.getMinutes()).slice(-2) + ':' + ('00' + date.getSeconds()).slice(-2)
				});
			}

			$$.HISTORYLIST.html(historyHTML);

			// Init folder
			var folder = $storage.get('folder.' + $KEY);

			var folderHTML = '';

			for (var itemkey in folder) {
				var folderItem = folder[itemkey];

				var itemDate = new Date(folderItem.date);

				folderHTML += $template('folder-list-item', {
					type: folderItem.name.length === 0 ? 'noname' : '',
					key: itemkey,
					name: folderItem.name,
					query: folderItem.query,
					date: itemDate.getFullYear() + '-' + ('00' + (itemDate.getMonth() + 1)).slice(-2) + '-' + ('00' + itemDate.getDate()).slice(-2) + ' ' + ('00' + itemDate.getHours()).slice(-2) + ':' + ('00' + itemDate.getMinutes()).slice(-2) + ':' + ('00' + itemDate.getSeconds()).slice(-2)
				});
			}

			$$.FOLDERLIST.html(folderHTML);
		}
	};

	var $dbquery = function(query, value, options) {
		if (!$connectionState) {
			// TODO: Show not connected
			return Promise.reject();
		}

		if (typeof options !== 'object') {
			options = {};
		}

		var sql = $db.format(query, value);

		$$.COMMAND.text(sql);

		$$.RESULT.attr('data-state', 'loading');

		$$.TOTAL.text('');
		$$.TABLEHEAD.html('');
		$$.TABLEBODY.html('');

		// TODO: Log based on settings
		var history = $history($KEY).new();

		history.set('query', sql);
		history.set('date', Date.now());
		history.set('total', 0);
		history.set('db', $$.DATABASELIST.val());

		var process = new Promise((resolve, reject) => {
			// TODO: Delete pre query

			$db.q(sql)
				.then(function(response) {
					history.set('state', true);

					if (response.result.constructor.name === 'OkPacket') {
						$$.TOTAL.text(response.result.affectedRows);

						history.set('total', response.result.affectedRows);

						// INSERT INTO
						if (response.result.insertId) {
							history.set('insertId', response.result.insertId);

							var insertTableName = sql.match(/^insert into (\S+)/i)[1].replace(/`/g, '');

							$populate.tableCount(insertTableName);

							$db.q('show keys from ?? where ?? = ?', [insertTableName, 'Key_name', 'PRIMARY'])
								.then(function(subResponse) {
									if (subResponse.result.length === 0) {
										return Promise.reject('No primary key found.');
									}

									return $db.q('select * from ?? where ?? = ?', [subResponse.result[0].Table, subResponse.result[0].Column_name, response.result.insertId]);
								})
								.then(function(subResponse) {
									resolve(subResponse);
								})
								.catch(function(err) {
									resolve({
										err: err
									});
								});

							return;
						}

						var alterTable = sql.match(/^alter table (\S+)/i);

						// ALTER TABLE
						if (alterTable) {
							var alterTableName = alterTable[1].replace(/`/g, '');

							$populate.tableColumns(alterTableName)
								.then(function(subResponse) {
									resolve(subResponse);
								})
								.catch(function(err) {
									resolve({
										err: err
									});
								});

							return;
						}

						// TRUNCATE TABLE
						var truncateTable = sql.match(/^truncate table (\S+)/i);

						if (truncateTable){
							var truncateTableName = truncateTable[1].replace(/`/g, '');

							$populate.tableCount(truncateTableName);

							resolve(response);

							return;
						}

						// DROP TABLE
						var dropTable = sql.match(/^drop table (\S+)/i);

						if (dropTable){
							var dropTableName = dropTable[1].replace(/`/g, '');

							$$.TABLELIST.find('li[data-name="' + dropTableName + '"]').remove();

							resolve(response);

							return;
						}

						var createDatabase = sql.match(/^create database (\S+)/i);

						// CREATE DATABASE
						if (createDatabase) {
							var createDatabaseName = createDatabase[1].replace(/`/g, '');

							$populate.databases()
								.then(function() {
									$$.DATABASELIST.val(createDatabaseName);

									$$.DATABASELIST.trigger('change');
								});

							resolve(response);

							return;
						}

						var dropDatabase = sql.match(/^drop database (\S+)/i);

						// DROP DATABASE
						if (dropDatabase) {
							var dropDatabaseName = dropDatabase[1].replace(/`/g, '');

							var currentDatabase = $$.DATABASELIST.val();

							$$.DATABASELIST.find('option[value="' + dropDatabaseName + '"]').remove();

							if (currentDatabase === dropDatabaseName) {
								$$.DATABASELIST.trigger('change');
							}

							resolve(response);

							return;
						}

						// TODO: Delete

						// TODO: Update, use WHERE to pull result
					}

					if (response.result.constructor.name === 'Array') {
						history.set('total', response.result.length);

						resolve(response);

						return;
					}

					console.log(response);

					resolve({
						err: null
					});
				})
				.catch(function(err) {
					history.set('state', false);
					history.set('error', err);

					reject(err);
				});
		});

		process
			.then(function(response) {
				$$.RESULT.attr('data-state', 'success');

				if (!options.noHistory) {
					history.update();
				}

				if (!response.err) {
					if (response.fields && response.result) {
						$populate.resultTable(response.fields, response.result);
					}
				}
			})
			.catch(function(err) {
				// TODO: Based on settings to log error query
				if (!options.noHistory) {
					history.update();
				}

				$populate.resultError(err);
			});

		return process;
	};

	var $populate = {
		changeDB: function(db) {
			return new Promise(function(resolve, reject) {
				$db.q('use ??', [db])
					.then(function(response) {
						return $populate.tables(db);
					})
					.then(function(response) {
						resolve();
					})
					.catch(function(err) {
						$populate.resultError(err);

						reject(err);
					});
			});
		},

		tables: function(db) {
			var query = 'show tables';

			if (db) {
				query += ' from ??';
			}

			return new Promise(function(resolve, reject) {
				$db.q(query, [db])
					.then(function(response) {
						var html = '';

						var names = [];

						for (var i = 0; i < response.result.length; i++) {
							names.push(response.result[i][response.fields[0].name]);

							html += $template('table-list-item', {
								name: response.result[i][response.fields[0].name]
							});
						}

						$$.TABLELIST.html(html);

						for (var j = 0; j < names.length; j++) {
							$populate.tableCount(names[j]);
						}

						resolve();
					})
					.catch(function(err) {
						reject(err);
					});
			});
		},

		databases: function() {
			var process = $db.q('show databases');

			process.then(function(response) {
				var html = '';

				for (var i = 0; i < response.result.length; i++) {
					// TODO: Based on settings
					if (response.result[i].Database === 'information_schema' ||
						response.result[i].Database === 'performance_schema' ||
						response.result[i].Database === 'mysql') {
						continue;
					}
					html += $template('database-list-item', {
						name: response.result[i].Database
					});
				}

				$$.DATABASELISTGROUP.html(html);
			});

			return process;
		},

		resultTable: function(fields, rows) {
			$$.TOTAL.text(rows.length);

			var head = '';

			for (var i = 0; i < fields.length; i++) {
				head += $template('result-table-head-cell', {
					type: DB.TYPES[fields[i].type],
					name: fields[i].name
				});
			}

			$$.TABLEHEAD.html(head);

			var body = '';

			for (var j = 0; j < rows.length; j++) {
				var html = '';

				for (var k = 0; k < fields.length; k++) {
					var type = DB.TYPES[fields[k].type],
						value = rows[j][fields[k].name];

					if (rows[j][fields[k].name] === null ||
						value === '0000-00-00 00:00:00') {
						type += ' null';
					}

					html += $template('result-table-cell', {
						type: type,
						value: _.escape(value)
					});
				}

				body += $template('result-table-row', {
					cells: html
				});
			}

			$$.TABLEBODY.html(body);
		},

		resultError: function(err) {
			$$.RESULT.attr('data-state', 'error');

			$$.ERRORMESSAGE.html(err);
		},

		tableColumns: function(tablename) {
			var process = $db.q('describe ??', [tablename]);

			process.then(function(response) {
				$populate.updateTableColumns(tablename, response);
			});

			return process;
		},

		updateTableColumns: function(tablename, response) {
			var item = $$.TABLELIST.find('li[data-name="' + tablename + '"]');

			var html = '';

			for (var i = 0; i < response.result.length; i++) {
				var row = response.result[i],
					type = row.Type;

				type = type.replace('unsigned', '').trim();

				if (row.Key === 'PRI') {
					type = 'pk ' + type;
				}

				html += $template('table-columns-item', {
					name: row.Field,
					type: type
				});
			}

			item.find('.table-columns').html(html);
		},

		tableCount: function(name) {
			$db.q('select count(1) as ?? from ??', ['total', name]).then(function(response) {
				$$.TABLELIST.find('li[data-name="' + name + '"] .table-name').attr('data-count', response.result[0].total);
			});
		},

		editTable: function(name) {
			$$.RESULT.attr('data-state', 'table-edit');
			$$.TABLEEDIT.find('h2').text(name);

			$$.TABLEEDITNAME.val(name);

			$db.q('show table status like ?', [name])
				.then(function(response) {
					var data = response.result[0];

					var encoding = data.Collation.split('_')[0];

					$$.TABLEEDITENCODING
						.val(encoding)
						.trigger('change');

					$$.TABLEEDITCOLLATION.val(data.Collation);

					$$.TABLEEDITINCREMENT.val(data.Auto_increment);
				});

			$db.q('show full columns from ??', [name])
				.then(function(response) {

				});
		}
	};

	// Bindings

	$$.BODY.on('click', 'form .group', function() {
		var group = $(this),
			input = group.find('input');

		input.trigger('focus');
	});

	$$.BODY.on('focus', 'form .group input', function() {
		var input = $(this),
			group = input.parents('.group');

		group.addClass('active focus');
	});

	$$.BODY.on('blur', 'form .group input', function() {
		var input = $(this),
			group = input.parents('.group');

		if (input.val() === '') {
			group.removeClass('active');
		}

		group.removeClass('focus');
	});

	$$.SIDEBARTABNAV.on('click', 'button', function() {
		var button = $(this),
			name = button.attr('data-name'),
			status = $$.CONTENT.attr('data-connection');

		if ((name === 'tables' || name === 'folder' || name === 'history') && status !=='connected') {
			return;
		}

		$$.CONTENT.attr('data-tab', name);
	});

	$$.TABLELIST.on('click', '.table-name .name', function() {
		$dbquery('select * from ??', [this.innerHTML.trim()]);
	});

	$$.TABLELIST.on('click', '.context', function() {
		var item = $(this).parents('li'),
			tablename = item.attr('data-name');

		$context('tableitem', function(type) {
			switch (type) {
				case 'edit':
					$populate.editTable(tablename);
				break;

				case 'truncate':
					$$.POPUP
						.attr('data-popup', 'truncate-table')
						.attr('data-source', tablename);
				break;

				case 'drop':
					$$.POPUP
						.attr('data-popup', 'drop-table')
						.attr('data-source', tablename);
				break;

				case 'syntax':
					// TODO: Custom result
				break;
			}
		});
	});

	$$.TABLELIST.on('contextmenu', function(event) {
		var target = $(event.target);

		if (target.closest('.table-name').length) {
			target.parents('li').find('.context').trigger('click');
			return;
		}

		if (target.closest('li[data-name]').length) {
			// TODO: Add context menu for columns
			// For now, just don't show context menu
			return;
		}

		if (target.closest('#table-list').length) {
			$context('tablelist', function(type) {
				switch (type) {
					case 'table':
						$$.NEWTABLE.trigger('click');
					break;

					case 'database':
						$$.NEWDATABASE.trigger('click');
					break;
				}
			});

			return;
		}
	});

	$$.TABLELIST.on('click', '.expand', function() {
		var item = $(this).parents('li');

		item.toggleClass('expanded');

		if (item.hasClass('expanded')) {
			var tablename = item.find('.table-name').text().trim();

			$populate.tableColumns(tablename);
		}

	});

	$$.NEWTABLE.on('click', function() {
		$$.POPUP.attr('data-popup', 'newtable');

		$$.NEWTABLEENCODING
			.val($db.variables.character_set_server)
			.trigger('change');

		$$.NEWTABLENAME
			.val('')
			.trigger('focus');
	});

	$$.NEWDATABASE.on('click', function() {
		$$.TABLELIST.html('');
		$$.POPUP.attr('data-popup', 'newdatabase');

		$$.DATABASELIST.val('#newdatabase');

		$$.NEWDATABASENAME
			.val('')
			.trigger('focus');

		$$.NEWDATABASEENCODING
			.val($db.variables.character_set_server)
			.trigger('change');
	});

	$$.TABLEEDITNAME.on('blur', function() {

	});

	$$.TABLEEDITINCREMENT.on('blur', function() {

	});

	$$.TABLEEDITENCODING.on('blur', function() {

	});

	$$.TABLEEDITCOLLATION.on('blur', function() {

	});

	$$.SERVERLIST.on('click', '.edit', function(event) {
		var button = $(this),
			item = button.parents('li'),
			siblings = item.siblings(),
			name = item.attr('data-key'),
			server = $storage.get('servers.' + name);

		item.addClass('editing');
		siblings.removeClass('editing');

		$$.NEW
			.addClass('editing')
			.attr('data-key', name);

		$$.NEWCONNECTIONFORMINPUTS.val('');

		$$.NEWCONNECTIONFORMINPUTS.filter('[name="ssh"]')
			.prop('checked', !!server.ssh)
			.trigger('change');

		$$.GROUPSSHPASSWORD.toggleClass('hasfile', server.sshkeyfile !== undefined && !!server.sshkeyfile.length);
		$$.LABELSSHPASSWORD.attr('data-file', server.sshkeyfile !== undefined && server.sshkeyfile.length ? server.sshkeyfile : '');

		$$.NEWCONNECTIONFORMINPUTS.filter('[name="sshkeyfile"]').val(server.sshkeyfile);

		for (var key in server) {
			var value = server[key];

			if (key === 'ssh' || key === 'sshkeyfile') {
				continue;
			}

			if (value) {
				$$.NEWCONNECTIONFORMINPUTS.filter('[name="' + key + '"]')
					.val(value)
					.parents('.group')
						.addClass('active');
			}

		}
	});

	$$.SERVERLIST.on('click', 'span', function(event) {
		var item = $(this).parents('li');

		$KEY = item.attr('data-key');

		var data = $storage.get('servers.' + $KEY);

		$connect(data);
	});

	$$.HISTORYLIST.on('click', 'li', function(event) {
		var item = $(this),
			index = item.index(),
			data = $storage.get('history.' + $KEY + '.' + index);

		if ($(event.target).hasClass('context')) {
			$context('historyitem', function(type) {
				switch (type) {
					case 'copy':
						$clipboard.copy(data.query);
					break;

					case 'delete':
						var history = $storage.get('history.' + $KEY);
						history.splice(index, 1);
						$storage.set('history.' + $KEY, history);
						item.remove();
					break;
				}
			});
			return;
		}

		var currentdb = $$.DATABASELIST.val(),
			useDB = Promise.resolve();

		if (data.db !== currentdb) {
			$$.DATABASELIST.val(data.db);

			useDB = $populate.changeDB(data.db);
		}

		useDB.then(function() {
			$dbquery(data.query, [], {
				noHistory: true
			});
		});
	});

	$$.HISTORYLIST.on('contextmenu', 'li', function(event) {
		$(this).find('.context').trigger('click');
	});

	$$.HISTORYCLEAR.on('click', function() {
		$$.POPUP.attr('data-popup', 'history-clear');
	});

	$$.FOLDERLIST.on('click', 'li', function(event) {
		var item = $(this),
			key = item.attr('data-key'),
			data = $storage.get('folder.' + $KEY + '.' + key);

		if ($(event.target).hasClass('context')) {
			$context('folderitem', function(type) {
				switch (type) {
					case 'copy':
						$clipboard.copy(data.query);
					break;

					case 'delete':
						$storage.delete('folder.' + $KEY + '.' + key);
						item.remove();
					break;
				}
			});
			return;
		}

		var query = item.find('.query').text();

		$dbquery(query);
	});

	$$.FOLDERLIST.on('contextmenu', 'li', function(event) {
		var item = $(this),
			button = item.find('.context');

		$(this).find('.context').trigger('click');
	});

	var previousDatabase;

	$$.DATABASELIST.on('change', function() {
		if (this.value === '#newdatabase') {
			$$.NEWDATABASE.trigger('click');
			return;
		}

		previousDatabase = this.value;

		$populate.changeDB(this.value);
	});

	$$.DATABASELIST.on('contextmenu', function() {
		$context('databaselist', function(type) {
			switch (type) {
				case 'new':
					$$.NEWDATABASE.trigger('click');
				break;
			}
		});
	});

	var encodingCollationsOptionsHTML = {};

	$$.NEWDATABASEENCODING.on('change', function() {
		if (encodingCollationsOptionsHTML[this.value] === undefined) {
			var html = $template('newdatabase-select-default-item', {
				name: $db.collationsDefault[this.value]
			});

			html += $template('newdatabase-select-disabled-item');

			_.each($db.collations[this.value], function(value, key) {
				html += $template('newdatabase-select-item', {
					name: value.COLLATION_NAME
				});
			});

			encodingCollationsOptionsHTML[this.value] = html;
		}

		$$.NEWDATABASECOLLATION.html(encodingCollationsOptionsHTML[this.value]);

		$$.NEWDATABASECOLLATION.val($db.collationsDefault[this.value]);
	});

	$$.NEWTABLEENCODING.on('change', function() {
		if (encodingCollationsOptionsHTML[this.value] === undefined) {
			var html = $template('newdatabase-select-default-item', {
				name: $db.collationsDefault[this.value]
			});

			html += $template('newdatabase-select-disabled-item');

			_.each($db.collations[this.value], function(value, key) {
				html += $template('newdatabase-select-item', {
					name: value.COLLATION_NAME
				});
			});

			encodingCollationsOptionsHTML[this.value] = html;
		}

		$$.NEWTABLECOLLATION.html(encodingCollationsOptionsHTML[this.value]);

		$$.NEWTABLECOLLATION.val($db.collationsDefault[this.value]);
	});

	$$.TABLEEDITENCODING.on('change', function() {
		if (encodingCollationsOptionsHTML[this.value] === undefined) {
			var html = $template('newdatabase-select-default-item', {
				name: $db.collationsDefault[this.value]
			});

			html += $template('newdatabase-select-disabled-item');

			_.each($db.collations[this.value], function(value, key) {
				html += $template('newdatabase-select-item', {
					name: value.COLLATION_NAME
				});
			});

			encodingCollationsOptionsHTML[this.value] = html;
		}

		$$.TABLEEDITCOLLATION.html(encodingCollationsOptionsHTML[this.value]);

		$$.TABLEEDITCOLLATION.val($db.collationsDefault[this.value]);
	});

	$$.NEW.on('change', 'input[name="ssh"]', function() {
		$$.SSHSETTINGS.toggleClass('active', this.checked);
	});

	$$.NEW.on('click', '#upload-sshkeyfile', function(event) {
		event.preventDefault();

		if ($$.GROUPSSHPASSWORD.hasClass('hasfile')) {
			$$.GROUPSSHPASSWORD.removeClass('hasfile');
			$$.LABELSSHPASSWORD.attr('data-file', '');
			$$.NEWCONNECTIONFORMINPUTS.filter('[name="sshkeyfile"]').val('');
			$$.NEWCONNECTIONFORMINPUTS.filter('[name="sshkeyfile-input"]').val('');
			$$.NEWCONNECTIONFORMINPUTS.filter('[name="sshpassword"]').val('');
		} else {
			$$.NEW.find('input[name="sshkeyfile-input"]').trigger('click');
		}
	});

	$$.NEW.on('change', 'input[name="sshkeyfile-input"]', function() {
		$$.GROUPSSHPASSWORD.toggleClass('hasfile', this.files.length);
		$$.LABELSSHPASSWORD.attr('data-file', this.files.length ? this.files[0].path : '');
		$$.NEWCONNECTIONFORMINPUTS.filter('[name="sshkeyfile"]').val(this.files.length ? this.files[0].path : '');
	});

	$$.NEW.on('click', '.actions button', function() {
		var button = $(this);

		var key = $$.NEW.attr('data-key');

		if (button.hasClass('delete')) {
			$$.SERVERLIST.find('li[data-key="' + key + '"]').remove();

			$storage.delete('servers.' + key);

			$storage.delete('history.' + key);
			$storage.delete('folder.' + key);
		}

		var data = {};
		var ssh = '';

		if (button.hasClass('add') || button.hasClass('go') || button.hasClass('save')) {
			$$.NEWCONNECTIONFORMINPUTS.each(function() {
				if (this.name === 'ssh') {
					data[this.name] = this.checked ? 1 : 0;
				} else if (this.name === 'sshkeyfile-input') {
				} else {
					data[this.name] = this.value;
				}
			});

			if (!data.host || !data.user || !data.password) {
				return;
			}
		}

		if (button.hasClass('add')) {
			key = Date.now().toString() + Math.random().toString().substr(2);

			$storage.set('servers.' + key, data);

			if (data.ssh && data.sshhost && data.sshuser) {
				ssh = data.sshuser + '@' + data.sshhost;
			}

			$$.SERVERLIST.append($template('server-list-item', {
				key: key,
				user: data.user,
				host: data.host,
				ssh: ssh,
				withssh: ssh.length > 0 ? 'withssh' : ''
			}));
		}

		if (button.hasClass('save')) {
			$storage.set('servers.' + key, data);

			ssh = '';

			if (data.ssh && data.sshhost && data.sshuser) {
				ssh = data.sshuser + '@' + data.sshhost;
			}

			$$.SERVERLIST.find('li[data-key="' + key + '"]').replaceWith($template('server-list-item', {
				key: key,
				user: data.user,
				host: data.host,
				ssh: ssh,
				withssh: ssh.length > 0 ? 'withssh' : ''
			}));
		}

		if (button.hasClass('go')) {
			$KEY = false;

			$connect(data);
		}

		// Clear field

		$$.NEW
			.removeClass('editing')
			.removeAttr('data-key');

		$$.NEWCONNECTIONFORMINPUTS.each(function() {
			this.value = '';
		});

		$$.NEWCONNECTIONFORMINPUTS.filter('[name="ssh"]').prop('checked', false).trigger('change');

		$$.NEWCONNECTIONFORMINPUTS.parents('.group').removeClass('active hasfile');

		$$.GROUPSSHPASSWORD.removeClass('hasfile');

		$$.SERVERLIST.find('li.editing').removeClass('editing');
	});

	$$.COMMANDSAVE.on('click', function() {
		$$.POPUP.attr('data-popup', 'query-save');

		$$.POPUP.attr('data-source', 'command');

		$$.QUERYSAVENAME
			.val('')
			.trigger('focus');
	});

	$$.EDITOR.on('keydown', function(event) {
		if ((event.ctrlKey || event.metaKey)) {
			// ENTER || r || e
			if (event.keyCode === 13 || event.keyCode === 82 || event.keyCode === 69) {
				$$.QUERYRUN.trigger('click');
				return false;
			}

			// s
			if (event.keyCode === 83) {
				$$.QUERYSAVE.trigger('click');
				return false;
			}

			// k
			if (event.keyCode === 75) {
				$$.QUERYCLEAR.trigger('click');
			}
		}
	});

	$$.QUERYRUN.on('click', function() {
		var sql = $$.EDITOR.text();

		if (sql === '') {
			return;
		}

		$dbquery(sql);
	});

	$$.QUERYSAVE.on('click', function() {
		if ($$.EDITOR.text() === '') {
			return;
		}

		$$.POPUP.attr('data-popup', 'query-save');

		$$.QUERYSAVENAME
			.val('')
			.trigger('focus');
	});

	$$.QUERYCLEAR.on('click', function() {
		$$.EDITOR.text('');
	});

	$$.POPUP.on('click', '.actions .no', function() {
		$$.POPUP.removeAttr('data-popup');
		$$.POPUP.removeAttr('data-source');
	});

	$$.POPUP.on('click', '#popup-overlay', function() {
		$$.POPUP.removeAttr('data-popup');
		$$.POPUP.removeAttr('data-source');
	});

	$$.POPUPQUERYSAVE.on('click', '.yes', function() {
		var name = $$.QUERYSAVENAME.val(),
			query = $$.EDITOR.text();

		if ($$.POPUP.attr('data-source') === 'command') {
			query = $$.COMMAND.text();
		}

		$folder($KEY).add({
			name: name,
			query: query,
			date: Date.now()
		});

		$$.POPUP.removeAttr('data-popup');
		$$.POPUP.removeAttr('data-source');
	});

	$$.POPUPQUERYSAVE.on('keydown', 'input', function(event) {
		if (event.keyCode === 13) {
			$$.POPUPQUERYSAVE.find('.yes').trigger('click');
			return false;
		}

		if (event.keyCode === 27) {
			$$.POPUPQUERYSAVE.find('.no').trigger('click');
			return false;
		}

		return true;
	});

	$$.POPUPHISTORYCLEAR.on('click', '.yes', function() {
		$storage.delete('history.' + $KEY);
		$$.HISTORYLIST.html('');

		$$.POPUP.removeAttr('data-popup');
	});

	$$.POPUPTRUNCATETABLE.on('click', '.yes', function() {
		var tablename = $$.POPUP.attr('data-source');

		$dbquery('truncate table ??', [tablename]);

		$$.POPUP.removeAttr('data-popup');
		$$.POPUP.removeAttr('data-source');
	});

	$$.POPUPDROPTABLE.on('click', '.yes', function() {
		var tablename = $$.POPUP.attr('data-source');

		$dbquery('drop table ??', [tablename]);

		$$.POPUP.removeAttr('data-popup');
		$$.POPUP.removeAttr('data-source');
	});

	$$.POPUPNEWDATABASE.on('click', '.yes', function(event) {
		var name = $$.NEWDATABASENAME.val(),
			encoding = $$.NEWDATABASEENCODING.val(),
			collation = $$.NEWDATABASECOLLATION.val();

		$$.NEWDATABASENAME.removeClass('error');

		if (name === '') {
			$$.NEWDATABASENAME
				.addClass('error')
				.trigger('focus');
			return;
		}

		$$.POPUP.attr('data-popup', 'loading');

		$dbquery('create database ?? default character set ? default collate ?', [name, encoding, collation])
			.then(function(response) {
				$$.POPUP.removeAttr('data-popup');
			});
	});

	$$.POPUPNEWDATABASE.on('click', '.no', function() {
		$$.DATABASELIST.val(previousDatabase);

		$$.DATABASELIST.trigger('change');
	});

	$$.POPUPNEWDATABASE.on('keydown', 'input', function(event) {
		if (event.keyCode === 13) {
			$$.POPUPNEWDATABASE.find('.yes').trigger('click');
			return false;
		}

		if (event.keyCode === 27) {
			$$.POPUPNEWDATABASE.find('.no').trigger('click');
			return false;
		}

		return true;
	});

	$$.POPUPNEWTABLE.on('click', '.yes', function(event) {
		var name = $$.NEWTABLENAME.val(),
			engine = $$.NEWTABLEENGINE.val(),
			encoding = $$.NEWTABLEENCODING.val(),
			collation = $$.NEWTABLECOLLATION.val();

		$$.NEWTABLENAME.removeClass('error');

		if (name === '') {
			$$.NEWTABLENAME.addClass('error');
			$$.NEWTABLENAME.trigger('focus');
			return;
		}

		$$.POPUP.attr('data-popup', 'loading');

		var expandedTables = [];

		$$.TABLELIST.find('li.expanded').each(function() {
			expandedTables.push($(this).attr('data-name'));
		});

		$dbquery('create table ?? (id int(11) unsigned not null primary key auto_increment) engine=' + engine + ' default charset=' + encoding + ' collate=' + collation, [name, encoding, collation])
			.then(function(response) {
				return $populate.tables();
			})
			.then(function() {
				_.each(expandedTables, function(value) {
					$$.TABLELIST.find('li[data-name="' + value + '"] .expand').trigger('click');
				});

				$$.POPUP.removeAttr('data-popup');
				$populate.editTable(name);
			})
			.catch(function(err) {
				$$.POPUP.removeAttr('data-popup');
				$populate.resultError(err);
			});
	});

	$$.POPUPNEWTABLE.on('keydown', 'input', function(event) {
		if (event.keyCode === 13) {
			$$.POPUPNEWTABLE.find('.yes').trigger('click');
			return false;
		}

		if (event.keyCode === 27) {
			$$.POPUPNEWTABLE.find('.no').trigger('click');
			return false;
		}

		return true;
	});

	$$.POPUPERROR.on('click', '.yes', function(event) {
		$$.POPUP.removeAttr('data-popup');
	});

	window.onbeforeunload = function(event) {
		if ($db && $db.constructor.name === 'DB') {
			$db.close();
		}
	};

	// Storage init
	var storages = {
		servers: {},
		history: {},
		fav: {}
	};

	$storage.init(storages);

	// Init
	var servers = $storage.get('servers');

	if (servers) {
		var html = '';

		for (var key in servers) {
			var ssh = '';

			if (servers[key].ssh && servers[key].sshuser && servers[key].sshhost) {
				ssh = servers[key].sshuser + '@' + servers[key].sshhost;
			}

			html += $template('server-list-item', {
				key: key,
				user: servers[key].user,
				host: servers[key].host,
				ssh: ssh,
				withssh: ssh.length > 0 ? 'withssh' : ''
			});
		}

		$$.SERVERLIST.html(html);
	}
});
