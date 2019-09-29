import { ipcRenderer, remote } from 'electron';

const WebSocket = require('ws');

const port = 20202;
const ws = new WebSocket('ws://192.168.47.205:20202/ws');


const txtEditor = document.getElementById('txtEditor');
const remote_host = document.getElementById('remote_host');
const local_client = document.getElementById('local_client');

console.log(`port ${port}`);
// 新建一个WebSocket通信，连接一个端口号为3000的本地服务器
ws.onopen = function (e) {
// 连接建立时触发函数
  console.log(`onopen readyState=${ws.readyState} e=${e}`);
  remote_host.innerText = `已连接到远端主机:${ws._socket.remoteAddress}:${ws._socket.remotePort}`;
  local_client.innerText = `本机地址:${ws._socket.localAddress}:${ws._socket.localPort}`;
  if (ws.readyState == 1) {
    // 发送一个消息，表示设备情况
    // todo 需要添加设备信息
    var deviceInfo = {
      ip: ws._socket.localAddress,
      port: ws._socket.localPort,
      model: 'pc-win',
    };
    var device = {
      content: deviceInfo,
      module: 'sys',
      action: 'info',
    };
    ws.send(JSON.stringify(device));
  }
// 只读属性readyState表示连接状态
};
ws.onmessage = function (event) {
  console.log(`onmessage event=${event}`);
// 客户端接收服务端数据时触发
};
ws.onclose = function (evt) {
  // 连接关闭时触发
  console.log(`onclose! ${evt}`);
};


ipcRenderer.on('asynchronous-msg-push', () => {
  // 进展模块的 信息
  // action 替换replace,追加append
  var step = {
    content: txtEditor.value,
    module: 'step',
    action: 'append',
  };
  console.log(`read step ${step}`);
  ws.send(JSON.stringify(step));
});
