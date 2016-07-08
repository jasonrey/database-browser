const pug = require('pug');
const sass = require('node-sass');
const postcss = require('postcss');
const autoprefixer = require('autoprefixer');
const fs = require('fs');

const electron = require('electron');
const {app, BrowserWindow, Menu, ipcMain} = electron;

const Config = require('electron-config');
const config = new Config({
	name: 'dbbr'
});

const appMenu = require(__dirname + '/menus/app.js');

global.__basepath = __dirname;

let win;

let createWindow = function() {
	let processes = [];

	let target = `${__dirname}/web/index.html`;

	processes.push(new Promise((resolve, reject) => {
		let html = pug.renderFile('web/templates/app.pug', {
			pretty: true
		});

		fs.writeFile(target, html, (err) => {
			if (err) {
				return reject();
			}

			resolve();
		});
	}));

	processes.push(new Promise((resolve, reject) => {
		fs.mkdir(__dirname + '/web/assets/css', () => {
			fs.readdir(__dirname + '/web/assets/sass', (err, items) => {
				sass.render({
					file: __dirname + '/web/assets/sass/index.sass',
					includePaths: [__dirname + '/web/assets/sass']
				}, (err, result) => {
					if (err) {
						console.log(err);
						reject();
					} else {
						postcss([autoprefixer])
							.process(result.css)
							.then((result) => {
								fs.writeFile(__dirname + '/web/assets/css/index.css', result.css, () => {
									resolve();
								});
							});
					}
				});
			});
		});
	}));

	Promise.all(processes).then(() => {
		Menu.setApplicationMenu(appMenu);

		let option = {
			width: config.get('size.w') || 1200,
			height: config.get('size.h') || 800,
			title: 'Database Browser'
		};

		if (config.get('position.x')) {
			option.x = config.get('position.x');
		}

		if (config.get('position.y')) {
			option.y = config.get('position.y');
		}

		win = new BrowserWindow(option);

		win.loadURL(`file://${target}`);

		win.webContents.openDevTools();

		// win.webContents.on('context-menu', function(event, params) {
		// 	console.log(event, params);
		// 	contextMenu.test.popup(win, params.x, params.y);
		// });

		win.on('close', () => {
			let position = win.getPosition(),
				size = win.getSize();

			config.set('position.x', position[0]);
			config.set('position.y', position[1]);
			config.set('size.w', size[0]);
			config.set('size.h', size[1]);
		});

		win.on('closed', () => {
			win = null;
		});
	});
};

app.on('ready', createWindow);

app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') {
		app.quit();
	}
});

app.on('activate', function () {
	if (win === null) {
		createWindow();
	}
});
