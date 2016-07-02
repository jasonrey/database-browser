$(function() {
	'use strict';

	// Elements
	var $$ = {};

	// Init all ID elements
	$('[id]').each(function() {
		$$[this.id.toUpperCase().replace(/-/g, '')] = $(this);
	});

	// Additional elements

	$$.BODY = $('body');
	$$.NEWCONNECTIONFORMINPUTS = $$.NEW.find('input');

	// Bindings

	$$.BODY.on('click', 'form .group', function() {
		var group = $(this),
			input = group.find('input');

		input.focus();
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

	$$.ADDSERVER.on('click', function() {
		$$.CONTENT.attr('data-content', 'new');
	});

	$$.SIDEBARTABNAV.on('click', 'button', function() {
		var button = $(this),
			name = button.attr('data-name');

		$$.CONTENT.attr('data-tab', name);
	});

	$$.TABLESLIST.on('click', '.table-name', function() {
		var item = $(this).parents('li'),
			siblings = item.siblings();

		siblings.removeClass('active');

		item.addClass('active');
	});

	$$.TABLESLIST.on('click', '.expand', function() {
		var item = $(this).parents('li');

		item.toggleClass('expanded');
	});

	$$.TABLESLIST.on('click', '.edit', function() {
		var item = $(this).parents('li'),
			siblings = item.siblings();

		siblings.removeClass('active');

		item.addClass('active');
	});

	$$.SERVERSLIST.on('click', '.edit', function(event) {
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

	$$.SERVERSLIST.on('click', 'span', function(event) {
		// Connect
	});

	$$.NEW.on('click', 'button', function() {
		var button = $(this);

		var key = $$.NEW.attr('data-key');

		if (button.hasClass('delete')) {
			$$.SERVERSLIST.find('li[data-key="' + key + '"]').remove();

			$storage.delete('servers.' + key);
		}

		var data = {};

		if (button.hasClass('add') || button.hasClass('go') || button.hasClass('save')) {
			$$.NEWCONNECTIONFORMINPUTS.each(function() {
				data[this.name] = this.value;
			});

			if (!data.hostname || !data.username || !data.password) {
				return;
			}
		}

		if (button.hasClass('add')) {
			key = Date.now().toString() + Math.random().toString().substr(2);

			$storage.set('servers.' + key, data);

			$$.SERVERSLIST.append($template('servers-list-item', {
				key: key,
				username: data.username,
				hostname: data.hostname
			}));
		}

		if (button.hasClass('save')) {
			$storage.set('servers.' + key, data);

			$$.SERVERSLIST.find('li[data-key="' + key + '"]').replaceWith($template('servers-list-item', {
				key: key,
				username: data.username,
				hostname: data.hostname
			}));
		}

		if (button.hasClass('go')) {

		}

		// Clear field

		$$.NEW
			.removeClass('editing')
			.removeAttr('data-key');

		$$.NEWCONNECTIONFORMINPUTS.each(function() {
			this.value = '';
		});

		$$.NEWCONNECTIONFORMINPUTS.parents('.group').removeClass('active');

		$$.SERVERSLIST.find('li.editing').removeClass('editing');
	});

	// Storage init
	var storages = {
		servers: {}
	};

	$storage.init(storages);

	// Init
	var servers = $storage.get('servers');

	if (servers) {
		var html = '';

		for (var key in servers) {
			html += $template('servers-list-item', {
				key: key,
				username: servers[key].username,
				hostname: servers[key].hostname
			});
		}

		$$.SERVERSLIST.html(html);
	}
});
