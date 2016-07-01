$(() => {
	'use strict';

	let BODY = $('body');

	BODY.on('click', 'form .group', function(event) {
		let group = $(this),
			input = group.find('input');

		input.focus();
	});

	BODY.on('focus', 'form .group input', function(event) {
		let input = $(this),
			group = input.parents('.group');

		group.addClass('active focus');
	});

	BODY.on('blur', 'form .group input', function(event) {
		let input = $(this),
			group = input.parents('.group');

		if (input.val() === '') {
			group.removeClass('active');
		}

		group.removeClass('focus');
	});

	let TABLESLIST = $('#tables-list');

	TABLESLIST.on('click', '.table-name', function(event) {
		let item = $(this).parents('li'),
			siblings = item.siblings();

		siblings.removeClass('active');

		item.addClass('active');
	});

	TABLESLIST.on('click', '.expand', function(event) {
		let item = $(this).parents('li');

		item.toggleClass('expanded');
	});

	TABLESLIST.on('click', '.edit', function(event) {
		let item = $(this).parents('li'),
			siblings = item.siblings();

		siblings.removeClass('active');

		item.addClass('active');
	});

	let CONTENT = $('#content');
	let TABNAV = CONTENT.find('.tab-bar');
	let TABCONTENT = CONTENT.find('.tab-content');

	TABNAV.on('click', 'button', function() {
		let button = $(this),
			name = button.attr('data-name');

		CONTENT.attr('data-tab', name);
	});
});
