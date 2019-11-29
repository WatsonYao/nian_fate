import { app, BrowserWindow, shell, Menu, MenuItem, ipcMain } from 'electron';
import { ASYNCHRONOUS_MSG, ASYNCHRONOUS_MSG_REPLY } from './const';

const Store = require('electron-store');
// 是否可以安全退出
// let safeExit = false;

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;

var appMenuTemplate = [
  {
    role: 'help',
    submenu: [
      {
        label: 'source code',
        click() {
          shell.openExternal('https://github.com/WatsonYao/nian_fate');
        },
      },
      {
        label: 'version:0.1',
      },
    ],
  },
];


const store = new Store();

const createWindow = () => {
  let sizeWidth = store.get('width');
  let sizeHeight = store.get('height');
  console.log(`sizeWidth ${sizeWidth}`);
  console.log(`sizeHeight ${sizeHeight}`);

  if (sizeWidth == undefined) {
    sizeWidth = 800;
  }
  if (sizeHeight == undefined) {
    sizeHeight = 800;
  }

  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: sizeWidth,
    height: sizeHeight,
    minWidth: 1280,
    minHeight: 640,
    webPreferences: {
      nodeIntegration: true,  // 注入node模块
    },
  });

  // and load the index.html of the app.
  mainWindow.loadURL(`file://${__dirname}/index.html`);

  // Open the DevTools.
  mainWindow.webContents.openDevTools();

  const menu = Menu.buildFromTemplate(appMenuTemplate);

  Menu.setApplicationMenu(menu);
  mainWindow.on('close', () => {
    const size = mainWindow.getSize();
    store.set('width', size[0]);
    store.set('height', size[1]);
    console.log(`close event ${mainWindow.getSize()}`);
  });

  // Emitted when the window is closed.
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow();
  }
});
process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true';

// 监听与渲染进程的通信
ipcMain.on('reqaction', (event, arg) => {
  switch (arg) {
    case 'exit':
      app.quit();
      break;
    default:
  }
});

ipcMain.on(ASYNCHRONOUS_MSG, (event, arg) => {
  // 转发消息
  event.sender.send(ASYNCHRONOUS_MSG_REPLY, arg);
});

