import { ipcRenderer, remote } from 'electron';
import {
  ASYNCHRONOUS_MSG_REPLY,
  REPLY_PUSH,
  REPLY_CONNECT,
  MODULE_SYS,
  ACTION_INFO,
  MODULE_STEP,
  ACTION_APPEND,
  ACTION_REPLACE,
  REPLY_DISCONNECT,
  VERSION,
} from './const';

const WebSocket = require('ws');
const Store = require('electron-store');
const store = new Store();

let ws;

const txtEditor = document.getElementById('txtEditor');
const remoteHost = document.getElementById('remote_host');
const localClient = document.getElementById('local_client');
const connectState = document.getElementById('connect_state');
const hostIP = document.getElementById('host_ip');
const hostPort = document.getElementById('host_port');
const radioA = document.getElementById('radio-a');
const radioR = document.getElementById('radio-r');

const MAC_TAG = 'darwin';
const CONNECT_OK = 1;
const PLATFORM_PC = 'web-win';
const PLATFORM_MAC = 'web-mac';

connectState.innerText = '等待连接';

// 获得存储的值
var localIP = store.get('ip');
var localPort = store.get('port');
var localRadio = store.get('radio');

// storage.setItem('port','20203');
//var test = storage.getItem('test');
// console.log(`test ${test}`)

console.log(`localIP ${localIP}`);
console.log(`localPort ${localPort}`);
console.log(`localRadio ${localRadio}`);

if (localIP == '' || localIP == undefined) {
  localIP = '192.168.32.1';
}
if (localPort == '' || localPort == undefined) {
  localPort = '20202';
}
hostIP.value = localIP;
hostPort.value = localPort;
if (localRadio == 'replace') {
  radioA.checked = false;
  radioR.checked = true;
}

function getDeviceInfo() {
  let hard = PLATFORM_PC;
  if (process.platform == MAC_TAG) {
    hard = PLATFORM_MAC;
  }
  return JSON.stringify({
    ip: ws._socket.localAddress,
    port: ws._socket.localPort,
    model: hard,
  });
}

// 连接状态
var connected = false;

function startListener() {
  connectState.innerText = '连接中 ...';
  console.log('reply connect');

  const hostIPValue = hostIP.value;
  const hostPortValue = hostPort.value;
  console.log(`hostIP ${hostIPValue}`);
  console.log(`hostPort ${hostPortValue}`);

  if (hostIPValue == '' || hostIPValue == undefined
    || hostPortValue == '' || hostPortValue == undefined) {
    connectState.innerText = '请完整填写主机地址和端口号 ...';
    return;
  }

  store.set('ip', hostIPValue);
  store.set('port', hostPortValue);

  ws = new WebSocket(`ws://${hostIPValue}:${hostPortValue}/ws`);
  ws.onopen = function (e) {
// 连接建立时触发函数
    console.log(`onopen readyState=${ws.readyState} e=${e}`);
    remoteHost.innerText = `已连接到远端主机:${ws._socket.remoteAddress}:${ws._socket.remotePort}`;
    localClient.innerText = `本机地址:${ws._socket.localAddress}:${ws._socket.localPort}`;

    if (ws.readyState == CONNECT_OK) {
      // 发送一个消息，表示设备情况
      connected = true;
      const device = {
        content: getDeviceInfo(),
        module: MODULE_SYS,
        action: ACTION_INFO,
        v: VERSION,
      };
      connectState.innerText = '连接成功';
      ws.send(JSON.stringify(device));
    }
// 只读属性readyState表示连接状态
  };
  ws.onmessage = (event) => {
    console.log(`onmessage event=${event}`);
// 客户端接收服务端数据时触发
  };
  ws.onclose = (event) => {
    // 连接关闭时触发
    connected = false;
    console.log(`onclose! ${event}`);
  };
  ws.onerror = (event) => {
    // 出错信息打印
    console.log(`onError ${event}`);
    connectState.innerText = `连接出错 ${event}`;
  };
}

function closeListener() {
  ws.close();
  connectState.innerText = '连接已关闭';
}

function pushInto() {
  console.log(`connectState ${connectState}`);
  if (connected == false) {
    txtEditor.innerText = '\nHi \n先填写下面的主机地址和端口（参照手机上的 nian 提示），\n然后点击[CONNECT TO NIAN]，等下方显示连接成功后，即可使用';
    return;
  }
  let stepAction = ACTION_APPEND;
  if (radioR.checked) {
    stepAction = ACTION_REPLACE;
  }
  const step = {
    content: txtEditor.value,
    module: MODULE_STEP,
    action: stepAction,
    v: VERSION,
  };
  if (radioA.checked) {
    console.log('set radio append');
    store.set('radio', 'append');
  }
  if (radioR.checked) {
    console.log('set radio replace');
    store.set('radio', 'replace');
  }
  console.log(`read step ${step}`);
  ws.send(JSON.stringify(step));
}

ipcRenderer.on(ASYNCHRONOUS_MSG_REPLY, (event, arg) => {
  console.log(`replay arg=${arg}`);
  switch (arg) {
    case REPLY_PUSH:
      pushInto();
      break;
    case REPLY_CONNECT:
      startListener();
      break;
    case REPLY_DISCONNECT:
      closeListener();
      break;
    default:
  }
});
