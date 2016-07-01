(function() {
	'use strict';

	if (typeof localStorage.dbbr !== 'string' || (localStorage.dbbr.slice(0, 1) !== '{' && localStorage.dbbr.slice(-1) !== '}')) {
		localStorage.dbbr = '{}';
	}

	window.$storage = {
		data: {},

		init: function() {
			if (typeof localStorage.dbbr !== 'string' ||
				localStorage.dbbr.slice(0, 1) !== '{' || localStorage.dbbr.slice(-1) !== '}') {
				localStorage.dbbr = '{}';
			}

			this.data = JSON.parse(localStorage.dbbr);
		},

		update: function() {
			localStorage.dbbr = JSON.stringify(this.data);
		},

		get: function(name) {
			var segments = name.split('.');

			var data = this.data;

			for (var i = 0; i < segments.length; i++) {
				if (!data[segments[i]]) {
					return null;
				}

				data = data[segments[i]];
			}

			return data;
		},

		set: function(name, value) {
			var segments = name.split('.');

			var data = this.data;

			console.log(this.data);

			for (var i = 0; i < segments.length; i++) {
				console.log(data);
				if (!data[segments[i]] && typeof data !== 'object') {
					data = {};
				}

				if (i === segments.length - 1) {
					data[segments[i]] = value;
				} else {
					if (typeof data[segments[i]] !== 'object') {
						data[segments[i]] = {};
					}
				}

				data = data[segments[i]];
			}

			console.log(this.data);

			this.update();
		},

		delete: function() {

		}
	};

	$storage.init();
})();
