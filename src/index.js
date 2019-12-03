import {
  ACTION_ADD,
  ACTION_INFO,
  ACTION_LIST,
  ACTION_SEARCH,
  ACTION_UPDATE,
  MODULE_DREAM,
  MODULE_STEP,
  MODULE_SYS,
  VERSION,
} from './const';

const WebSocket = require('ws');
const Store = require('electron-store');
const store = new Store();
const clipboard = require('electron').clipboard;

let ws;

const updateEditor = document.getElementById('updateEditor');
const localClient = document.getElementById('local_client');
const connectState = document.getElementById('connect_state');
const hostIP = document.getElementById('host_ip');
const hostPort = document.getElementById('host_port');
const dreamList = document.getElementById('dream_list');
const stepList = document.getElementById('step_list');
const connectButton = document.getElementById('connect');
const updateContent = document.getElementById('updateContent');
const newContent = document.getElementById('newContent');
const messageView = document.getElementById('message');
const toggleHostAddress = document.getElementById('toggle_host_address');
const updateDream = document.getElementById('updateDream');
const searchBtn = document.getElementById('search');
const searchWordEditor = document.getElementById('searchWord');
const versionBar = document.getElementById('versionBar');
const stepCreatAt = document.getElementById('stepCreatAt');

var connected = false;
var currentStep = null;
var currentDream = null;
var showHostIP = true;
var showHostPort = true;

let noConnectMsg = '先连接，后使用';
versionBar.onclick = function (event) {
  event.preventDefault();
  var shell = require('electron').shell;
  shell.openExternal('https://github.com/WatsonYao/nian_fate');
};

toggleHostAddress.onclick = function () {
  if (showHostIP) {
    hostIP.setAttribute('type', 'password');
    hostPort.setAttribute('type', 'password');
  } else {
    hostIP.setAttribute('type', 'text');
    hostPort.setAttribute('type', 'text');
  }
  showHostIP = !showHostIP;
};

updateDream.onclick = function () {
  console.log('update dream list');
  clearSteps();
  actionOfGetDream();
};

function clearSteps() {
  stepList.innerText = '';
  currentStep = null;
  totalSteps = [];
}

connectButton.onclick = function () {
  // 判断当前是否是连接状态，如果是连接，则是断开连接的操作
  if (connected) {
    connectButton.innerText = '连接到 nian';
    closeListener();
  } else {
    startListener();
  }
};

updateContent.onclick = function () {
  pushUpdate();
};

newContent.onclick = function () {
  // 新增一条，刷新左边的列表
  pushAdd();
};

searchBtn.onclick = function () {
  searchStep();
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

function searchStep() {
  if (connected == false) {
    messageView.innerText = noConnectMsg;
    return;
  }
  // 获得输入框的文本
  let word = searchWordEditor.value;
  console.log('searchWordEditor', searchWordEditor);
  if (word.length == 0) {
    console.log('先输入一些文本');
    return;
  }
  // 向服务器请求
  const step = {
    content: '',
    module: MODULE_STEP,
    action: ACTION_SEARCH,
    desc: word,
    v: VERSION,
  };
  ws.send(JSON.stringify(step));
}

function showDreams(dreams) {
  dreamList.innerText = '';
  for (let i = 0; i < dreams.length; i++) {
    let item = dreams[i];
    let li = document.createElement('li');
    if (currentDream != null && item.id == currentDream.id) {
      li.className = 'list-group-item dream list-group-item-secondary';
    } else {
      li.className = 'list-group-item dream';
    }
    li.id = item.id;
    li.innerHTML = item.name;
    li.onclick = function () {
      clickDreamDetail(item);
    };
    dreamList.appendChild(li);
  }
}

let totalSteps = [];

function showStepList(steps) {
  // 删除之前的
  stepList.innerText = '';
  totalSteps = steps;
  for (let i = 0; i < steps.length; i++) {
    let li = document.createElement('li');
    let item = steps[i];
    let content = getShortContent(item.content);
    li.innerText = content;
    if (item.selected) {
      li.className = 'list-group-item step list-group-item-secondary';
    } else {
      li.className = 'list-group-item step';
    }
    li.id = item.id;
    li.onclick = function () {
      clickStepDetail(i);
    };
    stepList.appendChild(li);
  }
}

function showSearchStep(steps) {
  const searchStepList = document.getElementById('step_list_search');
  searchStepList.innerText = '';
  for (let i = 0; i < steps.length; i++) {
    let item = steps[i];
    let li = document.createElement('li');
    let content = item.content.replace(/\r\n/g, '<br>')
      .replace(/\n/g, '<br>');
    let keyWord = searchWordEditor.value;
    let update = content.split(keyWord);
    li.innerHTML = update.join('<mark style="background:#B3E5FC;">' + keyWord + '</mark>');
    li.className = 'list-group-item step-search';
    li.id = item.id;
    li.onclick = function () {
      clickSearchStep(item);
    };
    searchStepList.appendChild(li);
  }
}

function clickSearchStep(item) {
  clipboard.writeText(item.content);
}

function clickStepDetail(position) {
  let item = totalSteps[position];
  currentStep = item;
  updateEditor.innerText = item.content;
  stepCreatAt.innerText = timestampToTime(item.createAt);
  updateStepsSelected();
}

function timestampToTime(timestamp) {
  let date = new Date(timestamp * 1000);//时间戳为10位需*1000，时间戳为13位的话不需乘1000
  let Y = date.getFullYear() + '-';
  let M = (date.getMonth() + 1 < 10 ? '0' + (date.getMonth() + 1) : date.getMonth() + 1) + '-';
  let D = date.getDate() + ' ';
  let h = date.getHours() + ':';
  let m = date.getMinutes() + ':';
  let s = date.getSeconds();
  return Y + M + D + h + m + s;

};

function pushUpdate() {
  if (connected == false) {
    messageView.innerText = noConnectMsg;
    return;
  }
  if (currentStep == null) {
    messageView.innerText = '未选择要更新的进展';
    return;
  }
  messageView.innerText = '';
  const step = {
    content: updateEditor.innerText,
    module: MODULE_STEP,
    action: ACTION_UPDATE,
    desc: currentStep.id,
    v: VERSION,
  };
  ws.send(JSON.stringify(step));
  // 发送成功，才能更新 steps 里面的content //todo
  // 找到 显示的那个布局
  let updateStep = document.getElementsByClassName('list-group-item step list-group-item-secondary');
  for (let i = 0; i < updateStep.length; i++) {
    if (updateStep[i].id == currentStep.id) {
      let content = getShortContent(updateEditor.innerText);
      updateStep[i].innerText = content;
      totalSteps[i].content = updateEditor.innerText;
    }
  }
}

let maxContentLength = 80;

function getShortContent(content) {
  let length = content.length;
  if (length > maxContentLength) {
    return content.substr(0, maxContentLength) + '...';
  } else {
    return content;
  }
}

function clickDreamDetail(item) {
  if (item == null) return;
  console.log(`click dream=${item.id}+${item.name}`);
  const getDreamDetail = {
    module: MODULE_STEP,
    action: ACTION_LIST,
    desc: item.id.toString(),
    v: VERSION,
  };
  currentDream = item;
  currentStep = null;
  updateEditor.innerText = '';
  clearMessage();
  ws.send(JSON.stringify(getDreamDetail));
  // 更新点击后的样式
  updateDreamSelected();
}

function updateDreamSelected() {
  let dreams = document.getElementsByClassName('list-group-item dream');
  for (let i = 0; i < dreams.length; i++) {
    if (dreams[i].id == currentDream.id) {
      dreams[i].className = 'list-group-item dream list-group-item-secondary';
    } else {
      dreams[i].className = 'list-group-item dream';
    }
  }
}

function updateStepsSelected() {
  let steps = document.getElementsByClassName('list-group-item step');
  for (let i = 0; i < steps.length; i++) {
    if (steps[i].id == currentStep.id) {
      steps[i].className = 'list-group-item step list-group-item-secondary';
    } else {
      steps[i].className = 'list-group-item step';
    }
  }
}

function clearMessage() {
  messageView.innerText = '';
}

function pushAdd() {
  if (connected == false) {
    messageView.innerText = noConnectMsg;
    return;
  }
  if (currentDream == null) {
    messageView.innerText = '未选择记本';
    return;
  }
  messageView.innerText = '';
  updateEditor.innerText = '新增';
  currentStep = null;
  const step = {
    content: '新增',
    module: MODULE_STEP,
    action: ACTION_ADD,
    desc: currentDream.id,
    v: VERSION,
  };
  ws.send(JSON.stringify(step));
}

function connectButtonUpdate(flag) {
  if (flag) {
    connectState.innerText = '连接成功';
    connectButton.innerText = '已连接';
    connectButton.className = 'btn btn-success btn-sm';
  } else {
    connectState.innerText = '连接已关闭';
    connectButton.innerText = '连接到 nian';
    connectButton.className = 'btn btn-danger btn-sm';
  }
}

// 信令连接相关
// 连接状态
function onopen(e) {
// 连接建立时触发函数
  console.log('onopen readyState', ws.readyState);
  console.log('onopen e', e);
  connectButtonUpdate(true);
  localClient.innerText = `本机:${ws._socket.localAddress}:${ws._socket.localPort}`;
  if (ws.readyState == CONNECT_OK) {
    // 发送一个消息，表示设备情况
    connected = true;
    actionOfPushDevice();
    actionOfGetDream();
  }
// 只读属性readyState表示连接状态
}

function actionOfGetDream() {
  if (connected == false) {
    messageView.innerText = noConnectMsg;
    return;
  }
  const getDream = {
    desc: '', // 空表示获得所有记本信息
    module: MODULE_DREAM,
    action: ACTION_LIST,
    v: VERSION,
  };
  ws.send(JSON.stringify(getDream));
}

function actionOfPushDevice() {
  const device = {
    desc: getDeviceInfo(),
    module: MODULE_SYS,
    action: ACTION_INFO,
    v: VERSION,
  };
  clearInnerTextOfDreamAndStep();
  ws.send(JSON.stringify(device));
}

function clearInnerTextOfDreamAndStep() {
  dreamList.innerText = '';
  stepList.innerText = '';
  //updateEditor.innerText = '';
  currentStep = null;
  currentDream = null;
  messageView.innerText = '';
}

function startListener() {
  connectState.innerText = '连接中 ...';

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

  ws.onclose = (event) => {
    connected = false;
    console.log('ws onclose', event);
    connectButtonUpdate(false);
  };
  ws.onerror = (event) => {
    console.log('ws onError', event);
    connectState.innerText = `连接出错 ${event}`;
  };

  ws.onmessage = (event) => {
    let item = JSON.parse(event.data);
    console.log(`server message=${item.module}+${item.action}`);
    if (item.module == MODULE_DREAM && item.action == ACTION_LIST) {
      showDreams(item.content);

    } else if (item.module == MODULE_STEP && item.action == ACTION_LIST) {
      showStepList(item.content);

    } else if (item.module == MODULE_STEP && item.action == ACTION_ADD) {
      clickDreamDetail(currentDream);

    } else if (item.module == MODULE_STEP && item.action == ACTION_SEARCH) {
      showSearchStep(item.content);

    } else {
      console.log(':unknow', event.data);
    }
  };
}

function closeListener() {
  ws.close();
  connectState.innerText = '连接已关闭';
  dreamList.innerText = '';
  stepList.innerText = '';
}

