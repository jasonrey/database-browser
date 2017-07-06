const electron = require('electron'),
    {app, BrowserWindow, Menu, ipcMain} = electron,
    config = new (require('electron-config'))({
        name: 'dbbr'
    }),
    env = process.env.NODE_ENV || 'development',
    debug = process.env.DEBUG;

global.__basepath = __dirname;
global.basepath = path => `${__basepath}/${path}`;

let appWindow;

const createWindow = () => {
    const target = basepath('app/index.html');

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

    appWindow = new BrowserWindow(option);

    appWindow.loadURL(`file://${target}`);

    (env === 'development' || debug) && appWindow.webContents.openDevTools();

    appWindow.on('close', () => {
        const position = appWindow.getPosition(),
            size = appWindow.getSize();

        config.set('position.x', position[0]);
        config.set('position.y', position[1]);
        config.set('size.w', size[0]);
        config.set('size.h', size[1]);
    })

    appWindow.on('closed', () => appWindow = null);
}

app.on('ready', createWindow);

app.on('window-all-closed', () => process.platform !== 'darwin' && app.quit());

app.on('activate', () => appWindow === null && createWindow());
