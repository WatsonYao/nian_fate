import { ipcRenderer, remote } from 'electron';

const WebSocket = require('ws');

const port = 20202;
var ws;


const txtEditor = document.getElementById('txtEditor');
const remote_host = document.getElementById('remote_host');
const local_client = document.getElementById('local_client');
const connect_state = document.getElementById('connect_state');
const host_ip = document.getElementById('host_ip');
const host_port = document.getElementById('host_port');

console.log(`port ${port}`);
// 新建一个WebSocket通信，连接一个端口号为3000的本地服务器
connect_state.innerText = '连接中 ...';

function startListener() {
  var hostIP = host_ip.value;
  var hostPort = host_port.value;
  console.log(`hostIP ${hostIP}`);
  console.log(`hostPort ${hostPort}`);
  ws = new WebSocket(`ws://${hostIP}:${hostPort}/ws`);
  ws.onopen = function (e) {
// 连接建立时触发函数
    console.log(`onopen readyState=${ws.readyState} e=${e}`);
    remote_host.innerText = `已连接到远端主机:${ws._socket.remoteAddress}:${ws._socket.remotePort}`;
    local_client.innerText = `本机地址:${ws._socket.localAddress}:${ws._socket.localPort}`;
    var hard = 'web-win';
    if (process.platform == 'darwin') {
      hard = 'web-mac';
    }
    if (ws.readyState == 1) {
      // 发送一个消息，表示设备情况
      // todo 需要添加设备信息
      var deviceInfo = {
        ip: ws._socket.localAddress,
        port: ws._socket.localPort,
        model: hard,
      };
      var device = {
        content: deviceInfo,
        module: 'sys',
        action: 'info',
      };
      connect_state.innerText = '连接成功';
      ws.send(JSON.stringify(device));
    }
// 只读属性readyState表示连接状态
  };
  ws.onmessage = function (event) {
    console.log(`onmessage event=${event}`);
// 客户端接收服务端数据时触发
  };
  ws.onclose = function (event) {
    // 连接关闭时触发
    console.log(`onclose! ${event}`);
  };
  ws.onerror = function (event) {
    // 出错信息打印
    console.log(`onError ${event}`);
    connect_state.innerText = `连接出错 ${event}`;
  };
}

ipcRenderer.on('asynchronous-msg-reply', (event, arg) => {
  console.log(`arg ${arg}`);
  if (arg == 'push') {
    // 进展模块的 信息
    // action 替换replace,追加append
    var step = {
      content: txtEditor.value,
      module: 'step',
      action: 'append',
    };
    console.log(`read step ${step}`);
    ws.send(JSON.stringify(step));
  } else if (arg == 'connect') {
    console.log('reply connect');
    startListener();
  }
});
