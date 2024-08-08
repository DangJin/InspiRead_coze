// 从 content script 接收消息并处理
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'createConversation') {
    createCozeConversation(request)
      .then(response => {
        console.log('Conversation created:', response);
        sendResponse({ success: true, data: response });
      })
      .catch(error => {
        console.error('Error:', error);
        sendResponse({ success: false, error: error.message });
      });

    return true; // 保持消息通道开放以进行异步响应
  }else if (request.action === 'initiateChat') {
    initiateChat(request.personalAccessToken, request.chatData)
      .then(result => sendResponse({ success: true, message: result }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;  // 表示会异步发送响应
  }
});

// 新增：创建 Coze 会话

function createCozeConversation(config) {
  console.log(config)
  return new Promise((resolve, reject) => {
    const url = 'https://api.coze.cn/v1/conversation/create';
    const { personalAccessToken, uuid, messages, fileId } = config;

    // 构建请求体
    const requestBody = {
      meta_data: {
        uuid: uuid
      },
      messages: messages.map(msg => {
        if (msg.role === 'user') {
          // 如果是用户消息且有文件ID，则构建包含图片的消息
          return {
            role: 'user',
            content: JSON.stringify([
              { type: 'text', text: msg.content },
            ]),
            content_type: 'object_string'
          };
        }
        return msg;
      })
    };

    fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${personalAccessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    })
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then(data => resolve(data))
      .catch(error => reject(error));
  });
}

// 新增：初始化聊天

function initiateChat(personalAccessToken, chatData) {
  return new Promise((resolve, reject) => {
    const url = 'https://api.coze.cn/v3/chat';

    fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${personalAccessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(chatData)
    })
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        handleEventStream(response)
      })
      .catch(error => reject(error));
  });
}

// 新增：处理事件流

function handleEventStream(response) {
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  function processEvents() {
    return reader.read().then(({ done, value }) => {
      if (done) {
        console.log('Stream complete');
        return;
      }

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop();

      lines.forEach(line => {
        if (line.trim() === '') return;

        const colonIndex = line.indexOf(':');
        if (colonIndex === -1) return;

        const event = line.slice(0, colonIndex).trim();
        const data = line.slice(colonIndex + 1).trim();

        if (event === 'event') {
          currentEvent = data;
        } else if (event === 'data') {
          handleEventData(currentEvent, data);
        }
      });

      return processEvents();
    });
  }

  return processEvents();
}

// 新增：处理事件数据
function handleEventData(event, data) {
  switch (event) {
    case 'conversation.message.delta':
      const messageData = JSON.parse(data);
      console.log(`Message ${event}:`, messageData);
      // 处理消息内容
      chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        chrome.tabs.sendMessage(tabs[0].id, { action: "newData", data: messageData });
      });
      break;
    case 'conversation.message.completed':
    case 'conversation.chat.created':
    case 'conversation.chat.in_progress':
    case 'conversation.chat.completed':
      const chatData = JSON.parse(data);
      console.log(`Chat ${event}:`, chatData);
      // 处理聊天状态
      chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        chrome.tabs.sendMessage(tabs[0].id, { action: "event", data: chatData });
      });
      break;
    case 'done':
      console.log('Stream ended');
      chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        console.log('Stream complete', tabs);
        chrome.tabs.sendMessage(tabs[0].id, { action: "streamComplete" });
      });
      break;
    default:
      console.log(`Unhandled event: ${event}`, data);
  }
}

