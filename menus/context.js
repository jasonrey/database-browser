(() => {
	'use strict';

	const {remote} = require('electron');
	const {Menu} = remote;

	let clickHandler;

	let menus = {
		historyitem: Menu.buildFromTemplate([
			{
				label: 'Copy to Clipboard',
				click() {
					clickHandler('copy');
				}
			}, {
				label: 'Delete',
				click() {
					clickHandler('delete');
				}
			}
		])
	};

	module.exports = (identifier, handler) => {
		if (menus[identifier] === undefined) {
			return;
		}

		clickHandler = handler;

		return menus[identifier];
	};
})();
