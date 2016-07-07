const pug = require('pug');
const sass = require('node-sass');
const postcss = require('postcss');
const autoprefixer = require('autoprefixer');
const fs = require('fs');
const electron = require('electron');
const {app, BrowserWindow, Menu} = electron;

const Config = require('electron-config');
const config = new Config({
	name: 'dbbr'
});

global.__basepath = __dirname;

let mainWindow;

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

		mainWindow = new BrowserWindow(option);

		const menuTemplate = require(__dirname + '/menu.js');

		Menu.setApplicationMenu(Menu.buildFromTemplate(menuTemplate));

		mainWindow.loadURL(`file://${target}`);

		mainWindow.webContents.openDevTools();

		mainWindow.on('close', () => {
			let position = mainWindow.getPosition(),
				size = mainWindow.getSize();

			config.set('position.x', position[0]);
			config.set('position.y', position[1]);
			config.set('size.w', size[0]);
			config.set('size.h', size[1]);
		});

		mainWindow.on('closed', () => {
			mainWindow = null;
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
	if (mainWindow === null) {
		createWindow();
	}
});
