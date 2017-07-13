const electron = require('electron')
const {app, BrowserWindow, Menu, ipcMain} = electron
const config = new (require('electron-config'))({
  name: 'database-browser'
})
const env = process.env.NODE_ENV || 'development'
const debug = process.env.DEBUG
const initProcesses = []

global.__basepath = __dirname
global.basepath = path => `${__basepath}/${path}`

let appWindow

const createWindow = () => {
  const target = basepath('app/index.html')

  let option = {
    width: config.get('size.w') || 1200,
    height: config.get('size.h') || 800,
    title: 'Database Browser'
  }

  if (config.get('position.x')) {
    option.x = config.get('position.x')
  }

  if (config.get('position.y')) {
    option.y = config.get('position.y')
  }

  appWindow = new BrowserWindow(option)

  appWindow.loadURL(env === 'development' ? 'http://localhost:8080' : `file://${target}`)

  if (env === 'development' || debug) {
    appWindow.webContents.openDevTools()
  }

  appWindow.on('close', () => {
    const position = appWindow.getPosition()
    const size = appWindow.getSize()

    config.set('position.x', position[0])
    config.set('position.y', position[1])
    config.set('size.w', size[0])
    config.set('size.h', size[1])
  })

  appWindow.on('closed', () => appWindow = null)
}

app.on('ready', () => {
  if (env === 'development') {
    BrowserWindow.addDevToolsExtension('node_modules/vue-devtools')
  }

  Promise.all(initProcesses)
    .then(() => {
      createWindow()
    })
})

app.on('window-all-closed', () => process.platform !== 'darwin' && app.quit())

app.on('activate', () => appWindow === null && createWindow())
