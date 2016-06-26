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

		group.addClass('active');
	});

	BODY.on('blur', 'form .group input', function(event) {
		let input = $(this),
			group = input.parents('.group');

		if (input.val() === '') {
			group.removeClass('active');
		}
	});
});
