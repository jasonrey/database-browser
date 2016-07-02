(function() {
	'use strict';

	window.$template = function(identifier, data) {
		var html = document.getElementById(identifier).innerHTML;

		html = html.replace(RegExp('\\{\\{(.+?)\\}\\}', 'g'), function(match, p1) {
			return data[p1] !== undefined ? data[p1] : '';
		});

		return html;
	};
})();
