(() => {
	'use strict';

	let fs = require('fs'),
		sass = require('node-sass'),
		postcss = require('postcss'),
		autoprefixer = require('autoprefixer');

	let express = require('express'),
		app = express();

	app.disable('x-powered-by');
	app.set('trust proxy', true);

	app.set('env', process.env.NODE_ENV || 'development');

	app.set('views', __dirname + '/templates');
	app.set('view engine', 'pug');

	app.use(require('compression')());

	app.use('/assets', express.static(__dirname + '/assets'));

	app.use('/', (req, res) => {
		let processes = [];

		processes.push(new Promise((resolve, reject) => {
			fs.mkdir(__dirname + '/assets/css', () => {
				fs.readdir(__dirname + '/assets/sass', (err, items) => {
					sass.render({
						file: __dirname + '/assets/sass/index.sass',
						includePaths: [__dirname + '/assets/sass']
					}, (err, result) => {
						if (err) {
							console.log(err);
							reject();
						} else {
							postcss([autoprefixer])
								.process(result.css)
								.then((result) => {
									fs.writeFile(__dirname + '/assets/css/index.css', result.css, () => {
										resolve();
									});
								});
						}
					});
				});
			});
		}));

		Promise.all(processes).then(() => {
			res.render('index');
		});
	});

	require('http').createServer(app).listen(process.env.PORT || 3000);
})();
