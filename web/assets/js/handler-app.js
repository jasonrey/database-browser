(() => {
	'use strict';

	const electron = require('electron');
	const {remote, ipcRenderer} = electron;
	const BASEPATH = remote.getGlobal('__basepath');

	const Config = require('electron-config');
	const config = new Config({
		name: 'dbbr'
	});

	window.$storage = {
		data: {},

		setup: function(storages) {
			for (var storageKey in storages) {
				var defaultValue = storages[storageKey],
					defaultValueType = defaultValue === undefined ? 'undefined' : defaultValue.constructor.name;

				var storageValue = $storage.get(storageKey),
					storageValueType = storageValue === undefined ? 'undefined' : storageValue.constructor.name;

				if (defaultValueType !== storageValueType) {
					$storage.set(storageKey, defaultValue);
				}
			}

			return this;
		},

		init: function(storages) {
			this.setup(storages);

			return this;
		},

		get: function(name) {
			return config.get(name);
		},

		set: function(name, value) {
			config.set(name, value);

			return this;
		},

		delete: function(name) {
			config.delete(name);

			return this;
		},

		toString: function() {
			return JSON.parse(config.store);
		}
	};

	window.DB = require(BASEPATH + '/libraries/db.js');

	window.$context = () => {
		ipcRenderer.send('show-context-menu');
	};
})();
