const template = [
	{
		label: 'View',
		submenu: [
			{
				role: 'togglefullscreen'
			}
		]
	}, {
		role: 'window',
		submenu: [
			{
				role: 'minimize'
			}, {
				role: 'close'
			}
		]
	}, {
		role: 'help',
		submenu: [
			{
				label: 'Learn More',
				click() {
					require('electron').shell.openExternal('http://electron.atom.io');
				}
			}
		]
	}
];

if (process.platform === 'darwin') {
	template.unshift({
		label: 'DBBR',
		submenu: [
			{
				role: 'about'
			}, {
				type: 'separator'
			}, {
				role: 'services',
				submenu: []
			}, {
				type: 'separator'
			}, {
				role: 'hide'
			}, {
				role: 'hideothers'
			}, {
				role: 'unhide'
			}, {
				type: 'separator'
			}, {
				role: 'quit'
			}
		]
	});
}

module.exports = template;
