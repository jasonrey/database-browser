(() => {
	'use strict';

	const {remote} = require('electron');
	const {Menu} = remote;

	let clickHandler;

	let menus = {
		tableitem: Menu.buildFromTemplate([
			{
				label: 'Edit',
				click() {
					clickHandler('edit');
				}
			},
			{
				type: 'separator'
			},
			{
				label: 'Truncate',
				click() {
					clickHandler('truncate');
				}
			},
			{
				label: 'Drop',
				click() {
					clickHandler('drop');
				}
			},
			{
				type: 'separator'
			}/*,
			{
				label: 'Export',
				submenu: [
					{
						label: 'SQL',
						click() {
							clickHandler('export-sql');
						}
					},
					{
						label: 'CSV',
						click() {
							clickHandler('export-csv');
						}
					},
					{
						label: 'JSON',
						click() {
							clickHandler('export-json');
						}
					}
				]
			},
			{
				type: 'separator'
			},
			{
				label: 'Show Syntax',
				click() {
					clickHandler('syntax');
				}
			}*/
		]),
		tablelist: Menu.buildFromTemplate([
			{
				label: 'New Table',
				click() {
					clickHandler('table');
				}
			},
			{
				label: 'New Database',
				click() {
					clickHandler('database');
				}
			}
		]),
		databaselist: Menu.buildFromTemplate([
			{
				label: 'New Database',
				click() {
					clickHandler('new');
				}
			}
		]),
		historyitem: Menu.buildFromTemplate([
			{
				label: 'Copy to Clipboard',
				click() {
					clickHandler('copy');
				}
			},
			{
				label: 'Delete',
				click() {
					clickHandler('delete');
				}
			}
		]),
		folderitem: Menu.buildFromTemplate([
			{
				label: 'Copy to Clipboard',
				click() {
					clickHandler('copy');
				}
			},
			{
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
