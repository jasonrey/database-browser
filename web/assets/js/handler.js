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

			return this;
		},

		update: function() {
			localStorage.dbbr = JSON.stringify(this.data);

			return this;
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

			for (var i = 0; i < segments.length; i++) {
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

			return this.update();
		},

		delete: function(name) {
			var segments = name.split('.');

			var data = this.data;

			for (var i = 0; i < segments.length; i++) {
				data = data[segments[i]];

				if (i === segments.length - 2) {
					delete data[segments[i + 1]];
					break;
				}
			}

			return this.update();
		},

		toString: function() {
			return JSON.parse(this.data);
		}
	};

	$storage.init();
})();
