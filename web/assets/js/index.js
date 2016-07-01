$(() => {
	'use strict';

	let BODY = $('body');

	let TABLESLIST = $('#tables-list');

	let CONTENT = $('#content');
	let TABNAV = CONTENT.find('.tab-bar');
	let TABCONTENT = CONTENT.find('.tab-content');

	let PANELSIDEBAR = CONTENT.find('.panel-sidebar');
	let PANELCONTENT = CONTENT.find('.panel-content');

	BODY.on('click', 'form .group', function() {
		let group = $(this),
			input = group.find('input');

		input.focus();
	});

	BODY.on('focus', 'form .group input', function() {
		let input = $(this),
			group = input.parents('.group');

		group.addClass('active focus');
	});

	BODY.on('blur', 'form .group input', function() {
		let input = $(this),
			group = input.parents('.group');

		if (input.val() === '') {
			group.removeClass('active');
		}

		group.removeClass('focus');
	});

	BODY.on('click', '#add-server', function() {
		CONTENT.attr('data-content', 'new');
	});

	TABNAV.on('click', 'button', function() {
		let button = $(this),
			name = button.attr('data-name');

		CONTENT.attr('data-tab', name);
	});

	TABLESLIST.on('click', '.table-name', function() {
		let item = $(this).parents('li'),
			siblings = item.siblings();

		siblings.removeClass('active');

		item.addClass('active');
	});

	TABLESLIST.on('click', '.expand', function() {
		let item = $(this).parents('li');

		item.toggleClass('expanded');
	});

	TABLESLIST.on('click', '.edit', function() {
		let item = $(this).parents('li'),
			siblings = item.siblings();

		siblings.removeClass('active');

		item.addClass('active');
	});

	let NEWCONNECTIONFORM = $('#new'),
		NEWCONNECTIONFORMINPUTS = NEWCONNECTIONFORM.find('input');

	NEWCONNECTIONFORM.on('click', 'button', function() {
		let button = $(this);

		let data = {};

		for (let input of NEWCONNECTIONFORMINPUTS) {
			data[input.name] = input.value;
		}

		if (button.hasClass('blue')) {

		}
	});
});
