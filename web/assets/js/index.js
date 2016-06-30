$(() => {
	'use strict';

	let BODY = $('body');

	$('#menu').on('click', 'button', function(event) {
		let button = $(this);

		BODY.attr('data-tab', button.attr('id').split('-')[1]);
	});

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

	$('#tables-list').on('click', '.table-name', function(event) {
		let item = $(this).parents('li'),
			siblings = item.siblings();

		siblings.removeClass('active');

		item.addClass('active');
	});

	$('#tables-list').on('click', '.expand', function(event) {
		let item = $(this).parents('li');

		item.toggleClass('expanded');
	});

	$('#tables-list').on('click', '.edit', function(event) {
		let item = $(this).parents('li'),
			siblings = item.siblings();

		siblings.removeClass('active');

		item.addClass('active');
	});
});
