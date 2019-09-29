import { app, BrowserWindow } from 'electron';
import { ipcMain } from 'electron';
// 是否可以安全退出
// let safeExit = false;

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;

const createWindow = () => {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    minWidth: 640,
    minHeight: 360,
  });

  // and load the index.html of the app.
  mainWindow.loadURL(`file://${__dirname}/index.html`);

  // Open the DevTools.
  mainWindow.webContents.openDevTools();

  // 增加主菜单（在开发测试时会有一个默认菜单，但打包后这个菜单是没有的，需要自己增加）
  // 从模板创建主菜单
  mainWindow.on('close', (e) => {
    console.log('close event');
    console.log(e);
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

// 监听与渲染进程的通信
ipcMain.on('reqaction', (event, arg) => {
  switch (arg) {
    case 'exit':
      // 做点其它操作：比如记录窗口大小、位置等，下次启动时自动使用这些设置；
      // 不过因为这里（主进程）无法访问localStorage，这些数据需要使用其它的方式来保存和加载，
      // 这里就不作演示了。这里推荐一个相关的工具类库，
      // 可以使用它在主进程中保存加载配置数据：https://github.com/sindresorhus/electron-store
      // safeExit = true;
      app.quit();
      break;
    default:
  }
});

ipcMain.on('asynchronous-msg', (event) => {
  // 转发消息
  event.sender.send('asynchronous-msg-push', 'push');
});

