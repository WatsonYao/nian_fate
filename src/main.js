import { app, BrowserWindow, shell, Menu, MenuItem, ipcMain, globalShortcut, Tray } from 'electron';
import { ASYNCHRONOUS_MSG, ASYNCHRONOUS_MSG_REPLY } from './const';

const path = require('path');
const Store = require('electron-store');
// 是否可以安全退出
// let safeExit = false;

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;

const store = new Store();
let tray = null;

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
    minWidth: 1000,
    minHeight: 640,
    webPreferences: {
      nodeIntegration: true,  // 注入node模块
    },
    icon: path.join(__dirname, 'images/app_icon')
  });

  // and load the index.html of the app.
  mainWindow.loadURL(`file://${__dirname}/index.html`);

  const ret = globalShortcut.register('ctrl+shift+u', () => {
    // Open the DevTools.
    mainWindow.webContents.openDevTools();
  });

  // var appMenuTemplate = [];
  // const menu = Menu.buildFromTemplate(appMenuTemplate);
  Menu.setApplicationMenu(null);
  mainWindow.on('close', (event) => {
    if (process.platform === 'darwin') {
      mainWindow = null;
    }else{
      const size = mainWindow.getSize();
      store.set('width', size[0]);
      store.set('height', size[1]);
      mainWindow.hide();
      mainWindow.setSkipTaskbar(true);
      event.preventDefault();
      //console.log(`close event ${mainWindow.getSize()}`);
    }
  });

  if (process.platform === 'darwin') {
    //app.dock.setIcon(path.join(__dirname, 'images/app_icon'));
  }

  // Emitted when the window is closed.
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  if (process.platform === 'darwin') {
    //app.dock.setIcon(path.join(__dirname, 'images/app_icon'));

  } else {
    mainWindow.on('show', () => {
      tray.setHighlightMode('always');
    });

    mainWindow.on('hide', () => {
      tray.setHighlightMode('never');
    });

    //创建系统通知区菜单
    tray = new Tray(path.join(__dirname, 'images/app_icon.ico'));
    const contextMenu = Menu.buildFromTemplate([
      {
        label: '完全退出', click: () => {
          mainWindow.destroy();
        }
      },//我们需要在这里有一个真正的退出（这里直接强制退出）
    ]);
    tray.setToolTip('nian');
    tray.setContextMenu(contextMenu);
    tray.on('click', () => { //我们这里模拟桌面程序点击通知区图标实现打开关闭应用的功能
      mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show();
      mainWindow.isVisible() ? mainWindow.setSkipTaskbar(false) : mainWindow.setSkipTaskbar(true);
    });
  }

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

app.on('will-quit', function () {
  // Unregister a shortcut.
  globalShortcut.unregister('ctrl+shift+u');

  // Unregister all shortcuts.
  globalShortcut.unregisterAll();
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

