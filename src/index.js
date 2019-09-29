import { ipcRenderer, remote } from 'electron';
import {
  ASYNCHRONOUS_MSG_REPLY,
  REPLY_PUSH,
  REPLY_CONNECT,
  MODULE_SYS,
  ACTION_INFO,
  MODULE_STEP,
  ACTION_APPEND,
} from './const';

const WebSocket = require('ws');

const DEFAULT_PORT = 20202;
let ws;

const txtEditor = document.getElementById('txtEditor');
const remoteHost = document.getElementById('remote_host');
const localClient = document.getElementById('local_client');
const connectState = document.getElementById('connect_state');
const hostIP = document.getElementById('host_ip');
const hostPort = document.getElementById('host_port');

const MAC_TAG = 'darwin';
const CONNECT_OK = 1;
const PLATFORM_PC = 'web-win';
const PLATFORM_MAC = 'web-mac';

console.log(`port ${DEFAULT_PORT}`);
// 新建一个WebSocket通信，连接一个端口号为3000的本地服务器
connectState.innerText = '连接中 ...';

function getDeviceInfo() {
  let hard = PLATFORM_PC;
  if (process.platform == MAC_TAG) {
    hard = PLATFORM_MAC;
  }
  return {
    ip: ws._socket.localAddress,
    port: ws._socket.localPort,
    model: hard,
  };
}

function startListener() {
  console.log('reply connect');
  const hostIPValue = hostIP.value;
  const hostPortValue = hostPort.value;
  console.log(`hostIP ${hostIPValue}`);
  console.log(`hostPort ${hostPortValue}`);
  ws = new WebSocket(`ws://${hostIPValue}:${hostPortValue}/ws`);
  ws.onopen = function (e) {
// 连接建立时触发函数
    console.log(`onopen readyState=${ws.readyState} e=${e}`);
    remoteHost.innerText = `已连接到远端主机:${ws._socket.remoteAddress}:${ws._socket.remotePort}`;
    localClient.innerText = `本机地址:${ws._socket.localAddress}:${ws._socket.localPort}`;

    if (ws.readyState == CONNECT_OK) {
      // 发送一个消息，表示设备情况
      // todo 需要添加设备信息
      const device = {
        content: getDeviceInfo(),
        module: MODULE_SYS,
        action: ACTION_INFO,
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
    console.log(`onclose! ${event}`);
  };
  ws.onerror = (event) => {
    // 出错信息打印
    console.log(`onError ${event}`);
    connectState.innerText = `连接出错 ${event}`;
  };
}

function pushInto() {
  const step = {
    content: txtEditor.value,
    module: MODULE_STEP,
    action: ACTION_APPEND,
  };
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
    default:
  }
});
