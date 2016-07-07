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
	$$.CONNECTIONNAME = $$.CONNECTION.find('.name');
	$$.TABLEHEAD = $$.TABLE.find('thead');
	$$.TABLEBODY = $$.TABLE.find('tbody');

	// DB
	var $db;

	// Connection state
	var $connectionState = false;

	var $dbquery = function(query, value, options) {
		if (!$connectionState) {
			// TODO: Show not connected
			return;
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

		var key = $$.CONTENT.attr('data-key');

		// TODO: Log based on settings
		var history = $history(key).new();

		history.set('query', sql);
		history.set('date', Date.now());
		history.set('total', 0);
		history.set('db', $$.DATABASELIST.val());

		(new Promise((resolve, reject) => {
			// TODO: Delete pre query

			$db.q(sql).then(function(response) {
				history.set('state', true);

				if (response.result.constructor.name === 'OkPacket') {
					$$.TOTAL.text(response.result.affectedRows);

					history.set('total', response.result.affectedRows);

					// INSERT INTO
					if (response.result.insertId) {
						history.set('insertId', response.result.insertId);

						var insertTablename = sql.match(/insert into (.*?) .*/i)[1].replace(/`/g, '');

						$populate.tableCount(insertTablename);

						$db.q('show keys from ?? where ?? = ?', [insertTablename, 'Key_name', 'PRIMARY'])
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

					var alterTable = sql.match(/alter table (.*?) .*/i);

					// ALTER TABLE
					if (alterTable !== null) {
						var alterTablename = alterTable[1].replace(/`/g, '');

						$db.q('show columns from ??', [alterTablename])
							.then(function(subResponse) {
								$populate.updateTableColumns(alterTablename, subResponse);

								resolve(subResponse);
							})
							.catch(function(err) {
								resolve({
									err: err
								});
							});

						return;
					}

					// TODO: Delete

					// TODO: Update, use WHERE to pull result

					console.log(response);
				}

				if (response.result.constructor.name === 'Array') {
					history.set('total', response.result.length);

					resolve(response);

					return;
				}

				resolve({
					err: null
				});
			}, function(err) {
				history.set('state', false);
				history.set('error', err);

				reject(err);
			});
		}))
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
	};

	var $populate = {
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
						value: value
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
			$db.q('show columns from ??', [tablename]).then(function(response) {
				$populate.updateTableColumns(tablename, response);
			});
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

	$$.TABLELIST.on('click', '.table-name', function() {
		var item = $(this).parents('li'),
			siblings = item.siblings(),
			tablename = this.innerHTML.trim();

		siblings.removeClass('active');

		item.addClass('active');

		$dbquery('select * from ??', [tablename]);
	});

	$$.TABLELIST.on('click', '.expand', function() {
		var item = $(this).parents('li');

		item.toggleClass('expanded');

		if (item.hasClass('expanded')) {
			var tablename = item.find('.table-name').text().trim();

			$populate.tableColumns(tablename);
		}

	});

	$$.TABLELIST.on('click', '.edit', function() {
		var item = $(this).parents('li'),
			siblings = item.siblings();

		siblings.removeClass('active');

		item.addClass('active');
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

		$$.GROUPSSHPASSWORD.toggleClass('hasfile', !!server.sshkeyfile.length);
		$$.LABELSSHPASSWORD.attr('data-file', server.sshkeyfile.length ? server.sshkeyfile : '');

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
		var item = $(this).parents('li'),
			key = item.attr('data-key'),
			data = $storage.get('servers.' + key);

		$connectionState = false;

		$$.POPUP.attr('data-popup', 'loading');

		$$.CONTENT
			.attr('data-key', key)
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
			$$.DATABASELIST.html('');
			$$.TABLELIST.html('');
			$$.HISTORYLIST.html('');
			$$.FOLDERLIST.html('');
			$$.TOTAL.text('');
			$$.TABLEHEAD.html('');
			$$.TABLEBODY.html('');
			$$.RESULT.removeAttr('data-state');
		}

		$db = DB.getInstance(data);

		$db.q('show databases')
			.then(function(response) {
				$connectionState = true;

				$$.POPUP.removeAttr('data-popup');

				$$.CONTENT
					.attr('data-connection', 'connected')
					.attr('data-tab', 'tables');

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

				$$.DATABASELIST.html(html);

				$$.DATABASELIST.trigger('change');
			}).catch(function(err) {
				$$.CONTENT.attr('data-connection', '');

				$$.POPUPERROR.find('p').html(err);
				$$.POPUP.attr('data-popup', 'error');
			});

		// Init history
		var history = $history(key);

		var historyHTML = '';

		for (var i = history.items.length - 1; i >= 0; i--) {
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
		var folder = $storage.get('folder.' + key);

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
	});

	$$.HISTORYLIST.on('click', 'li', function() {
		var item = $(this),
			query = item.find('.query').text(),
			db = item.find('.db').text();

		$$.DATABASELIST.val(db).trigger('change');

		$db.q('use ??', [db]).then(function() {
			$dbquery(query, [], {
				noHistory: true
			});
		});
	});

	$$.FOLDERLIST.on('click', 'li', function(event) {
		if ($(event.target).hasClass('delete')) {
			return;
		}

		var item = $(this),
			query = item.find('.query').text();

		$dbquery(query);
	});

	$$.FOLDERLIST.on('click', '.delete', function() {
		var item = $(this).parents('li'),
			itemkey = item.attr('data-key'),
			key = $$.CONTENT.attr('data-key');

		$folder(key).delete(itemkey);

		item.remove();
	});

	$$.DATABASELIST.on('change', function() {
		var db = this.value;

		$db.q('use ??', [db])
			.then(function(response) {
				return $db.q('show tables');
			})
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
			})
			.catch(function(err) {
				$populate.resultError(err);
			});
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
		console.log(this.files);
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
			// TODO: Connect
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

		$$.POPUPQUERYSAVE.find('input').trigger('focus');
	});

	$$.QUERYCLEAR.on('click', function() {
		$$.EDITOR.text('');
	});

	$$.POPUP.on('click', '.actions button', function() {
		$$.POPUP.removeAttr('data-popup');
	});

	$$.POPUP.on('click', '#popup-overlay', function() {
		$$.POPUP.removeAttr('data-popup');
	});

	$$.POPUPQUERYSAVE.on('click', '.yes', function() {
		var input = $(this).parents('.popup-body').find('input'),
			name = input.val(),
			query = $$.EDITOR.text(),
			key = $$.CONTENT.attr('data-key');

		$folder(key).add({
			name: name,
			query: query,
			date: Date.now()
		});
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
	});

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
