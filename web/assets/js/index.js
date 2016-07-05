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

		return new Promise((resolve, reject) => {
			var insertId;

			$db.q(sql).then(function(response) {
				history.set('state', true);

				if (response.result.constructor.name === 'OkPacket') {
					$$.TOTAL.text(response.result.affectedRows);

					history.set('total', response.result.affectedRows);
					history.set('insertId', response.result.insertId);

					if (response.result.insertId) {
						insertId = response.result.insertId;

						var insertTablename = sql.match(/insert into (.*?) .*/i)[1].replace(/`/g, '');

						return $db.q('show keys from ?? where ?? = ?', [insertTablename, 'Key_name', 'PRIMARY']);
					}
				}

				if (response.result.constructor.name === 'Array') {
					populateResultTable(response.fields, response.result);

					history.set('total', response.result.length);
				}

				console.log(response);

				return Promise.resolve();
			}, function(err) {
				history.set('state', false);
				history.set('error', err);

				// TODO: Based on settings
				if (!options || !options.noHistory) {
					history.update();
				}

				populateResultError(err);

				reject(err);

				return Promise.reject();
			}).then(function(response) {
				if (!response) {
					return Promise.resolve();
				}

				if (response.result.length === 0) {
					return Promise.reject('No primary key found.');
				}

				return $db.q('select * from ?? where ?? = ?', [response.result[0].Table, response.result[0].Column_name, insertId]);
			}, function(err) {
				if (!err) {
					return Promise.reject();
				}

				history.set('state', false);
				history.set('error', err);

				// TODO: Based on settings
				if (!options || !options.noHistory) {
					history.update();
				}

				populateResultError(err);

				reject(err);

				return Promise.reject();
			}).then(function(response) {
				if (!options || !options.noHistory) {
					history.update();
				}

				if (response) {
					populateResultTable(response.fields, response.result);

					resolve(response);
				}
			}, function(err) {
				if (err) {
					history.set('state', false);
					history.set('error', err);

					// TODO: Based on settings
					if (!options || !options.noHistory) {
						history.update();
					}

					populateResultError(err);

					reject(err);
				}
			});
		});
	};

	var populateResultTable = function(fields, rows) {
		$$.RESULT.attr('data-state', 'success');
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
			var row = '';

			for (var k = 0; k < fields.length; k++) {
				var type = DB.TYPES[fields[k].type],
					value = rows[j][fields[k].name];

				if (rows[j][fields[k].name] === null ||
					value === '0000-00-00 00:00:00') {
					type += ' null';
				}

				row += $template('result-table-cell', {
					type: type,
					value: value
				});
			}

			body += $template('result-table-row', {
				cells: row
			});
		}

		$$.TABLEBODY.html(body);
	};

	var populateResultError = function(err) {
		$$.RESULT.attr('data-state', 'error');

		$$.ERRORMESSAGE.html(err);
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

			$db.q('show columns from ??', [tablename]).then(function(response) {

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
			});
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

		for (var key in server) {
			var value = server[key];

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

		$$.CONNECTIONNAME.text(data.user + '@' + data.host);

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
			query = item.find('.query').text();

		$dbquery(query, [], {
			noHistory: true
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
		$db.q('use ??', [this.value])
			.then(function(response) {
				return $db.q('show tables');
			}, function(err) {
				// TODO: Show error in result
			})
			.then(function(response) {
				var html = '';

				for (var i = 0; i < response.result.length; i++) {
					html += $template('table-list-item', {
						name: response.result[i][response.fields[0].name]
					});
				}

				$$.TABLELIST.html(html);
			});
	});

	$$.NEW.on('click', 'button', function() {
		var button = $(this);

		var key = $$.NEW.attr('data-key');

		if (button.hasClass('delete')) {
			$$.SERVERLIST.find('li[data-key="' + key + '"]').remove();

			$storage.delete('servers.' + key);
		}

		var data = {};

		if (button.hasClass('add') || button.hasClass('go') || button.hasClass('save')) {
			$$.NEWCONNECTIONFORMINPUTS.each(function() {
				data[this.name] = this.value;
			});

			if (!data.host || !data.user || !data.password) {
				return;
			}
		}

		if (button.hasClass('add')) {
			key = Date.now().toString() + Math.random().toString().substr(2);

			$storage.set('servers.' + key, data);

			$$.SERVERLIST.append($template('server-list-item', {
				key: key,
				user: data.user,
				host: data.host
			}));
		}

		if (button.hasClass('save')) {
			$storage.set('servers.' + key, data);

			$$.SERVERLIST.find('li[data-key="' + key + '"]').replaceWith($template('server-list-item', {
				key: key,
				user: data.user,
				host: data.host
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

		$$.NEWCONNECTIONFORMINPUTS.parents('.group').removeClass('active');

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
			html += $template('server-list-item', {
				key: key,
				user: servers[key].user,
				host: servers[key].host
			});
		}

		$$.SERVERLIST.html(html);
	}
});
