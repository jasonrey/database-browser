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

	// Constant data
	var DATA = {
		nolengthKeys: [
			'float',
			'double',
			'text',
			'date',
			'timestamp',
			'time',
			'year',
			'datetime'
		],
		noUnsigned: [
			'text',
			'char',
			'varchar',
			'text',
			'date',
			'timestamp',
			'time',
			'year',
			'datetime'
		]
	};

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

				$$.POPUPERRORMESSAGE.html(err);
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

		if (!options.noResult) {
			$$.RESULT.attr('data-state', 'loading');
		}

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
				if (!options.noResult) {
					$$.RESULT.attr('data-state', 'success');
				}

				if (!options.noHistory) {
					history.update();
				}

				if (!options.noResult && !response.err) {
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

				if (!options.noResult) {
					$populate.resultError(err);
				}
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
			var process = $db.q('show full columns from ??', [tablename]);

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

			$db.q('show table status where ?? = ?', ['Name', name])
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
					var html = '';

					_.each(response.result, function(row) {
						html += $populate.editTableRowHTML(row);
					});

					$$.TABLEEDITBODY.html(html);
				});
		},

		editTableRow: function(tablename, columnname) {
			$db.q('show full columns from ?? where ?? = ?', [tablename, 'Field', columnname])
				.then(function(response) {
					if (response.result.length) {
						$$.TABLEEDITBODY.find('tr[data-name="' + columnname + '"]').replaceWith($populate.editTableRowHTML(response.result[0]));
					}
				});
		},

		editTableRowHTML: function(row) {
			var length = row.Type.match(/\((.+)\)/);

			var type = row.Type.split('(')[0].toLowerCase();

			var data = {
				key: row.Key,
				extra: row.Extra,
				column: row.Field,
				columnname: 'data-name="' + row.Field + '"',
				length: length !== null ? length[1] : '',
				nolength: DATA.nolengthKeys.indexOf(type) >= 0 ? 'true' : '',
				unsigned: /unsigned/.test(row.Type) ? 'checked="checked"' : '',
				nounsigned: DATA.noUnsigned.indexOf(type) >= 0 ? 'disabled' : '',
				allownull: row.Null === 'YES' ? 'checked="checked"' : '',
				noallownull: row.Key === 'PRI' ? 'disabled' : '',
				default: row.Default === null ? '' : row.Default,
				defaultnull: row.Default === null && row.Null === 'YES' ? 'placeholder="null"' : '',
				comment: row.Comment
			};

			data['type' + type] = 'selected="selected"';

			return $template('table-edit-columns-row', data);
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

		if (input.val().trim().length === 0) {
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

	var tableEditNameBeforeValue;

	$$.TABLEEDITNAME.on('focus', function() {
		tableEditNameBeforeValue = this.value.trim();
	});

	$$.TABLEEDITNAME.on('blur', function() {
		var name = this.value.trim();

		if (name === '') {
			this.value = tableEditNameBeforeValue;
			return;
		}

		if (name !== tableEditNameBeforeValue) {
			$dbquery('rename table ?? to ??', [tableEditNameBeforeValue, name], {
				noResult: true
			})
				.then(function() {
					$$.TABLEEDIT.find('h2').text(name);
					$$.TABLELIST.find('li[data-name="' + tableEditNameBeforeValue + '"]')
						.attr('data-name', name)
						.attr('title', name)
						.find('.name')
							.text(name);
				})
				.catch(function(err) {
					$$.POPUP.attr('data-popup', 'error');
					$$.POPUPERRORMESSAGE.html(err);
				});
		}
	});

	$$.TABLEEDITINCREMENT.on('change', function() {
		var tablename = $$.TABLEEDITNAME.val().trim();

		$dbquery('alter table ?? auto_increment = ' + (this.value.trim() || 1), [tablename], {
			noResult: true
		})
			.then(function() {
				$db.q('show table status where ?? = ?', ['Name', tablename])
					.then(function(response) {
						$$.TABLEEDITINCREMENT.val(response.result[0].Auto_increment);
					});
			})
			.catch(function(err) {
				$$.POPUP.attr('data-popup', 'error');
				$$.POPUPERRORMESSAGE.html(err);
			});
	});

	$$.TABLEEDITENCODING.on('change', function() {
		$dbquery('alter table ?? character set = ' + this.value, [$$.TABLEEDITNAME.val().trim()], {
			noResult: true
		});
	});

	$$.TABLEEDITCOLLATION.on('change', function() {
		$dbquery('alter table ?? collate = ' + this.value, [$$.TABLEEDITNAME.val().trim()], {
			noResult: true
		});
	});

	$$.TABLEEDITBODY.on('focus', 'input[type="text"], input[type="number"], [contenteditable="true"]', function() {
		$(this).parents('td').addClass('active');
	});

	$$.TABLEEDITBODY.on('blur', 'input[type="text"], input[type="number"], [contenteditable="true"]', function() {
		$(this).parents('td').removeClass('active');
	});

	$$.TABLEEDITBODY.on('click', 'td', function(event) {
		if (event.target.tagName === 'TD') {
			var target = $(event.target),
				input = target.find('input[type="text"], input[type="number"], [contenteditable="true"]');

			if (input.length) {
				input.trigger('focus');
			}

			var checkbox = target.find('input[type="checkbox"]');

			if (checkbox.length) {
				checkbox.trigger('click');
			}

			var select = target.find('select');

			if (select.length) {
				var selectClickEvent = document.createEvent('MouseEvents');

				selectClickEvent.initMouseEvent('mousedown', true, true, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);

				select[0].dispatchEvent(selectClickEvent);
			}
		}
	});

	$$.TABLEEDITBODY.on('paste', '[contenteditable="true"]', function(event) {
		event.preventDefault();

		var text = event.originalEvent.clipboardData.getData('text/plain');

		document.execCommand('insertText', false, text);
	});

	$$.TABLEEDITBODY.on('change', '.type', function() {
		var row = $(this).parents('tr'),
			length = row.find('.length'),
			unsigned = row.find('.unsigned'),
			type = this.value.toLowerCase();

		if (DATA.nolengthKeys.indexOf(type) >= 0) {
			length.attr('data-nolength', true);
		} else {
			length.removeAttr('data-nolength');
		}

		if (DATA.noUnsigned.indexOf(type) >= 0) {
			unsigned
				.prop('checked', false)
				.prop('disabled', true);
		} else {
			unsigned.removeAttr('disabled');
		}

		$(this).parents('tr').trigger('rowupdate');
	});

	$$.TABLEEDITBODY.on('change', 'input', function() {
		$(this).parents('tr').trigger('rowupdate');
	});

	var tableEditContentBeforeValue;

	$$.TABLEEDITBODY.on('focus', '[contenteditable]', function() {
		tableEditContentBeforeValue = $(this).text().trim();
	});

	$$.TABLEEDITBODY.on('keydown', '[contenteditable]', function(event) {
		if (event.keyCode === 13) {
			$(this).trigger('blur');
			return false;
		}
	});

	$$.TABLEEDITBODY.on('blur', '[contenteditable]', function() {
		var item = $(this),
			value = item.text().trim(),
			row = item.parents('tr'),
			isNew = row.attr('data-new') === 'true';

		if (item.hasClass('column') && value.length === 0 && !isNew) {
			$$.POPUP.attr('data-popup', 'error');
			$$.POPUPERRORMESSAGE.html('Please provide a column name.');
			item.trigger('focus');
			return;
		}

		if (value !== tableEditContentBeforeValue) {
			row.trigger('rowupdate');
		}
	});

	$$.TABLEEDITBODY.on('rowupdate', 'tr', function(event, mode) {
		var row = $(this),
			tablename = $$.TABLEEDITNAME.val().trim(),
			name = row.attr('data-name'),
			isNew = row.attr('data-new') === 'true',
			key = row.find('.key').val().trim(),
			extra = row.find('.extra').val().trim(),
			column = row.find('.column').text().trim(),
			type = row.find('.type').val().trim().toLowerCase(),
			length = row.find('.length').val().trim(),
			haslength = DATA.nolengthKeys.indexOf(type) < 0,
			unsigned = DATA.noUnsigned.indexOf(type) < 0 && row.find('.unsigned').is(':checked') ? 'unsigned' : '',
			allownull = key !== 'PRI' && row.find('.allownull').is(':checked'),
			defaultvalue = row.find('.default').val().trim(),
			comment = row.find('.comment').text().trim();

		defaultvalue = allownull && defaultvalue.length === 0 ? 'null' : '';

		var query = 'alter table ?? change ?? ?? ' + type;
		var values = [tablename, name, column];

		if (isNew) {
			query = 'alter table ?? add column ??' + type;
			values = [tablename, column];
		}

		if (haslength && length.length) {
			query += '(' + length + ')';
		}

		if (unsigned) {
			query += ' unsigned';
		}

		if (!allownull) {
			query += ' not null';
		}

		if (defaultvalue.length) {
			if (defaultvalue === 'null') {
				query += ' default null';
			} else {
				query += ' default ?';
				values.push(defaultvalue);
			}
		}

		if (extra === 'auto_increment') {
			query += ' auto_increment';
		}

		if (comment.length) {
			query += ' comment ?';
			values.push(comment);
		}

		var moveColumn = mode === 'down' || mode === 'up';

		if (moveColumn) {
			if (isNew) {
				return;
			}

			row[mode === 'down' ? 'next' : 'prev']()[mode === 'down' ? 'after' : 'before'](row);
		}


		if (row.index() === 0) {
			query += ' first';
		} else {
			query += ' after ??';
			values.push(row.prev().find('.column').text().trim());
		}

		$dbquery(query, values, {
			noResult: true
		})
			.then(function(response) {
				_.each(response.result, function(newRow) {
					if (newRow.Field === column) {
						row.replaceWith($populate.editTableRowHTML(newRow));
					}
				});
			})
			.catch(function(err) {
				$$.POPUPERRORMESSAGE.html(err);

				$$.POPUP.attr('data-popup', 'error');

				if (!isNew) {
					$populate.editTableRow(tablename, name);
				}
			});
	});

	$$.TABLEEDITCOLUMNS.on('click', '#table-edit-new-column', function() {
		if ($$.TABLEEDITBODY.find('tr[data-new="true"]').length > 0) {
			return;
		}

		var newRow = $($template('table-edit-columns-row'));

		$$.TABLEEDITBODY.append(newRow);

		newRow
			.attr('data-new', 'true')
			.find('.column')
				.trigger('focus');
	});

	$$.TABLEEDITBODY.on('click', '.column-delete', function() {
		var button = $(this),
			row = button.parents('tr'),
			name = row.attr('data-name'),
			isNew = row.attr('data-new') === 'true',
			tablename = $$.TABLEEDITNAME.val().trim();

		row.addClass('pending-delete');

		if (!isNew) {
			$dbquery('alter table ?? drop column ??', [tablename, name], {
				noResult: true
			})
				.then(function(response) {
					row.remove();
				})
				.catch(function(err) {
					row.removeClass('pending-delete');

					$$.POPUPERRORMESSAGE.html(err);

					$$.POPUP.attr('data-popup', 'error');
				});
		} else {
			row.remove();
		}
	});

	$$.TABLEEDITBODY.on('click', '.column-shift', function() {
		var button = $(this),
			row = button.parents('tr'),
			column = row.find('.column'),
			direction = button.attr('data-move');

		if (direction === 'down') {
			var nextRow = row.next();

			if (nextRow.attr('data-new') === 'true' && nextRow.find('.column').text().trim().length === 0) {
				$$.POPUP.attr('data-popup', 'error');
				$$.POPUPERRORMESSAGE.html('Please provide a column name.');
				nextRow.find('.column').trigger('focus');
				return;
			}
		}

		if (row.attr('data-new') === 'true' && column.text().trim().length === 0) {
			$$.POPUP.attr('data-popup', 'error');
			$$.POPUPERRORMESSAGE.html('Please provide a column name.');
			column.trigger('focus');
			return;
		}

		row.trigger('rowupdate', direction);
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

		// TODO: Change to use storage data instead
		var query = item.find('.query').text().trim();

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

		$$.TABLEEDITCOLLATION.trigger('change');
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

	$$.EDITOR.on('paste', function(event) {
		event.preventDefault();

		var text = event.originalEvent.clipboardData.getData('text/plain');

		document.execCommand('insertText', false, text);
	});

	$$.QUERYRUN.on('click', function() {
		var sql = $$.EDITOR.text().trim();

		if (sql.length === 0) {
			return;
		}

		$dbquery(sql);
	});

	$$.QUERYSAVE.on('click', function() {
		if ($$.EDITOR.text().trim().length === 0) {
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
		var name = $$.QUERYSAVENAME.val().trim(),
			query = $$.EDITOR.text().trim();

		if ($$.POPUP.attr('data-source') === 'command') {
			query = $$.COMMAND.text().trim();
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
		var name = $$.NEWDATABASENAME.val().trim(),
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
		var name = $$.NEWTABLENAME.val().trim(),
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
