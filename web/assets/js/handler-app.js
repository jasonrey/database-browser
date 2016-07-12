(() => {
	'use strict';

	const electron = require('electron');
	const {remote, clipboard} = electron;
	const BASEPATH = remote.getGlobal('__basepath');

	const Config = require('electron-config');
	const config = new Config({
		name: 'dbbr'
	});

	window.$storage = {
		data: {},

		setup(storages) {
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

		init(storages) {
			this.setup(storages);

			return this;
		},

		get(name) {
			return config.get(name);
		},

		set(name, value) {
			config.set(name, value);

			return this;
		},

		delete(name) {
			config.delete(name);

			return this;
		},

		toString() {
			return JSON.parse(config.store);
		}
	};

	window.DB = require(BASEPATH + '/libraries/db.js');

	var contextMenu = require(BASEPATH + '/menus/context.js');

	window.$context = (identifier, handler) => {
		contextMenu(identifier, handler).popup(remote.getCurrentWindow());
	};

	window.$clipboard = {
		copy(text) {
			clipboard.writeText(text);
		}
	};
})();
