import { ipcRenderer, remote } from 'electron';
import {
  ASYNCHRONOUS_MSG_REPLY,
  REPLY_PASTE,
  REPLAY_PUSH_IMG,
  MODULE_SYS,
  ACTION_INFO,
  MODULE_STEP_UPDATE,
  VERSION,
  MODULE_DREAM_LIST,
  MODULE_DREAM_DETAIL,
  MODULE_STEP_ADD,
} from './const';

const WebSocket = require('ws');
const Store = require('electron-store');
const store = new Store();
const clipboard = require('electron').clipboard;

let ws;

const updateEditor = document.getElementById('updateEditor');
const remoteHost = document.getElementById('remote_host');
const localClient = document.getElementById('local_client');
const connectState = document.getElementById('connect_state');
const hostIP = document.getElementById('host_ip');
const hostPort = document.getElementById('host_port');
const dreamList = document.getElementById('dream_list');
const dreamDetail = document.getElementById('dream_detail');
const connectButton = document.getElementById('connect');
const pushButton = document.getElementById('push');
const newContent = document.getElementById('newContent');
const messageView = document.getElementById('message');

var connected = false;
var currentStep = null;
var currentDream = null;

let noConnectMsg = '\nHi \n先填写下面的主机地址和端口（参照手机上的 nian 提示），\n然后点击[CONNECT TO NIAN]，等下方显示连接成功后，即可使用';

connectButton.onclick = function () {
  // 判断当前是否是连接状态，如果是连接，则是断开连接的操作
  if (connected) {
    connectButton.innerText = '连接到 nian';
    closeListener();
  } else {
    startListener();
  }
};
pushButton.onclick = function () {
  pushUpdate();
};
newContent.onclick = function () {
  // 新增一条，刷新左边的列表
  pushAdd();
  getDreamDetail(currentDream);
};

const MAC_TAG = 'darwin';
const CONNECT_OK = 1;
const PLATFORM_PC = 'web-win';
const PLATFORM_MAC = 'web-mac';

connectState.innerText = '等待连接';

// 获得存储的值
var localIP = store.get('ip');
var localPort = store.get('port');

console.log(`localIP ${localIP}`);
console.log(`localPort ${localPort}`);

if (localIP == '' || localIP == undefined) {
  localIP = '192.168.32.1';
}
if (localPort == '' || localPort == undefined) {
  localPort = '20202';
}
hostIP.value = localIP;
hostPort.value = localPort;

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

// 粘贴图片相关
let imageWidth = 0;
let imageHeight = 0;

function pasteClipToContent() {
  console.log('paste');
  const image = clipboard.readImage();
  if (image) {
    let size = image.getSize();
    imageWidth = size.width;
    imageHeight = size.height;
    console.info('imageWidth', imageWidth);
    console.info('imageHeight', imageHeight);
    console.info('image', image);
    imageView.style.display = '';
    imageView.src = image.toDataURL();
  } else {
    console.error('不是图片');
  }
}

function pushImage() {
  const image = clipboard.readImage();
  const data = image.toDataURL();
  ws.send(data, { binary: true });
}

function showDreams(dreams) {
  // console.log('dreams', dreams);
  for (let i = 0; i < dreams.length; i++) {
    let li = document.createElement('li');
    li.className = 'list-group-item';
    let item = dreams[i];
    li.innerHTML = item.name;
    li.onclick = function () {
      getDreamDetail(item);
    };
    console.log('dreams item', item);
    dreamList.appendChild(li);
  }
}

function clearInnerTextOfDreamAndStep() {
  dreamList.innerText = '';
  dreamDetail.innerText = '';
  updateEditor.innerText = '';
  currentStep = null;
  currentDream = null;
  messageView.innerText = '';
}

function showStepList(steps) {
  console.log('steps', steps);
  // 删除之前的
  dreamDetail.innerText = '';
  for (let i = 0; i < steps.length; i++) {
    let li = document.createElement('li');
    let item = steps[i];
    li.innerText = item.content;
    li.className = 'textWrap nian_step list-group-item';
    li.id = item.id;
    li.onclick = function () {
      clickStepDetail(item);
    };
    console.log('step item', item);
    dreamDetail.appendChild(li);
  }
}

function clickStepDetail(item) {
  console.log('clickStepDetail', item);
  currentStep = item;
  updateEditor.innerText = item.content;
}

function pushUpdate() {
  console.log(`connectState ${connectState}`);
  if (connected == false) {
    messageView.innerText = noConnectMsg;
    return;
  }
  if (currentStep == null || updateEditor.value.length == 0) {
    messageView.innerText = '当前没有填写文本';
    return;
  }
  messageView.innerText = '';
  const step = {
    content: updateEditor.value,
    module: MODULE_STEP_UPDATE,
    action: currentStep.id,
    v: VERSION,
  };
  console.log(`update step ${step}`);
  ws.send(JSON.stringify(step));
  // 发送成功，才能更新 steps 里面的content //todo
  // 找到 显示的那个布局
  let updateStep = document.getElementsByClassName('textWrap nian_step list-group-item');
  console.log('准备更新', updateStep.length);
  console.log('currentStep', currentStep);
  console.log('准备更新', updateStep);
  for (let i = 0; i < updateStep.length; i++) {
    if (updateStep[i].id == currentStep.id) {
      console.log('找到那个id', updateStep[i]);
      updateStep[i].innerHTML = updateEditor.value;
    }
  }
}

function pushAdd() {
  console.log(`connectState ${connectState}`);
  if (connected == false) {
    messageView.innerText = noConnectMsg;
    return;
  }
  if (currentDream == null) {
    messageView.innerText = '当前没有选择记本';
    return;
  }
  if (updateEditor.value.length == 0) {
    messageView.innerText = '当前没有填写文本';
    return;
  }
  messageView.innerText = '';
  const step = {
    content: updateEditor.value,
    module: MODULE_STEP_ADD,
    action: currentDream.id,
    v: VERSION,
  };
  console.log('add step', step);
  ws.send(JSON.stringify(step));
}

function getDreamDetail(item) {
  if (item == null) return;
  console.log('getDreamDetail.id', item.id);
  const getDreamDetail = {
    content: item.id.toString(), // 空表示获得所有记本信息
    module: MODULE_DREAM_DETAIL,
    action: ACTION_INFO,
    v: VERSION,
  };
  currentDream = item;
  ws.send(JSON.stringify(getDreamDetail));
}

// 信令连接相关
// 连接状态
function onopen(e) {
// 连接建立时触发函数
  console.log(`onopen readyState=${ws.readyState} e=${e}`);
  connectButton.innerText = '已连接';
  remoteHost.innerText = `远端主机:${ws._socket.remoteAddress}:${ws._socket.remotePort}`;
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
    clearInnerTextOfDreamAndStep();
    ws.send(JSON.stringify(device));
    // 发送一个消息，获得记本列表
    const getDream = {
      content: '', // 空表示获得所有记本信息
      module: MODULE_DREAM_LIST,
      action: ACTION_INFO,
      v: VERSION,
    };
    ws.send(JSON.stringify(getDream));
  }
// 只读属性readyState表示连接状态
}

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
  ws.onopen = onopen;

  ws.onmessage = (event) => {
// 客户端接收服务端数据时触发
    let item = JSON.parse(event.data);
    console.log('onmessage item.module', item.module);
    if (item.module == MODULE_DREAM_LIST) {
      console.log('onmessage show dream list');
      showDreams(item.content);
    } else if (item.module == MODULE_DREAM_DETAIL) {
      console.log('onmessage show dream detail');
      showStepList(item.content);
    } else {
      console.log('onmessage event', event.data);
    }
  };

  ws.onclose = (event) => {
    // 连接关闭时触发
    connected = false;
    console.log('onclose!', event);
    remoteHost.innerText = '远端主机';
    connectState.innerText = `连接已关闭`;
    connectButton.innerText = '连接到 nian';
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

ipcRenderer.on(ASYNCHRONOUS_MSG_REPLY, (event, arg) => {
  console.log(`replay arg=${arg}`);
  switch (arg) {
    case REPLY_PASTE:
      pasteClipToContent();
      break;
    case REPLAY_PUSH_IMG:
      pushImage();
    default:
  }
});
