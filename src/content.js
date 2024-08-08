// 创建悬浮按钮
function createFloatingButton() {
  // 创建浮动元素
  const floatingElement = document.createElement("div");
  floatingElement.id = "floating-element";
  floatingElement.innerHTML =
    '<img src="https://telegraph-image-djt.pages.dev/file/591eacf7e29c6eeb11702.png" alt="图标">';
  document.body.appendChild(floatingElement);

  let isDragging = false;
  let dragStartY = 0;
  const dragThreshold = 5; // 像素

  // 使用 Interact.js 只处理拖动
  interact(floatingElement).draggable({
    inertia: true,
    modifiers: [
      interact.modifiers.restrictRect({
        restriction: "parent",
        endOnly: true,
      }),
    ],
    autoScroll: true,
    listeners: {
      move(event) {
        const target = event.target;
        const y = (parseFloat(target.getAttribute("data-y")) || 0) + event.dy;
        target.style.transform = `translateY(${y}px)`;
        target.setAttribute("data-y", y);
      },
    },
    lockAxis: "y",
  });

  // 单独处理点击和拖动逻辑
  floatingElement.addEventListener("mousedown", (e) => {
    isDragging = false;
    dragStartY = e.clientY;
  });

  floatingElement.addEventListener("mousemove", (e) => {
    if (Math.abs(e.clientY - dragStartY) > dragThreshold) {
      isDragging = true;
    }
  });

  floatingElement.addEventListener("mouseup", (e) => {
    if (!isDragging) {
      handleClick();
    }
    isDragging = false;
  });

  function handleClick() {
    floatingElement.addEventListener("click", toggleSidebar);
  }
}

  // 创建侧边栏
function createSidebar() {
  const sidebar = document.createElement("div");
  sidebar.className = "ai-sidebar";
  sidebar.innerHTML = `
    <div class="ai-close-btn">×</div>
    <div class="ai-content">
      <div class="ai-icon-container">
        <img
          src="https://telegraph-image-djt.pages.dev/file/591eacf7e29c6eeb11702.png"
        />
      </div>
      <h2 class="ai-title">获取创作灵感</h2>
      <div class="ai-description">
        <div class="markdown-body" id="ai-output">
          <p>欢迎使用创作灵感助手！这个工具旨在帮助你：</p>
          <ul>
            <li>快速获取创作灵感</li>
            <li>学习优秀作者的写作技巧</li>
            <li>提高你的创作效率</li>
          </ul>
          <h4>使用方法</h4>
          <ol>
            <li>打开你喜欢的作者的个人主页</li>
            <li>点击"开始分析"按钮</li>
            <li>等待分析结果，获取个性化的创作建议</li>
          </ol>
          <blockquote>
            <p>灵感随时可能出现，保持开放的心态，捕捉每一个创意火花！</p>
          </blockquote>
          <p>
            准备好开始你的创作之旅了吗？点击下方的按钮，让我们一起探索无限的创作可能性！
          </p>
        </div>
      </div>
      <button class="ai-start-btn">开始分析</button>
    </div>
  `;
  document.body.appendChild(sidebar);

  // 处理关闭按钮
  const closeBtn = sidebar.querySelector(".ai-close-btn");
  closeBtn.addEventListener("click", () => {
    sidebar.classList.remove("open");
  });

  // 处理开始分析按钮
  const startBtn = sidebar.querySelector(".ai-start-btn");
  startBtn.addEventListener("click", () => {
    // 这里可以添加您的分析逻辑
    getDOMHTML();
  });
}

// 切换侧边栏显示状态
function toggleSidebar() {
  const sidebar = document.querySelector(".ai-sidebar");
  sidebar.classList.toggle("open");
}

// 获取当前页面的HTML
function getDOMHTML() {
  const output = document.getElementById("ai-output");
  const sidebar = document.querySelector(".ai-sidebar");
  const startBtn = sidebar.querySelector(".ai-start-btn");
  startBtn.textContent = "分析中...";
  output.textContent = "";
  let extractedData = "";

  // 获取当前打开的tab的URL
  const currentTab = window.location.href;

  // 正则获取当前的URL的domain
  const domainRegex = /^(?:https?:\/\/)?(?:[^@\/\n]+@)?(?:www\.)?([^:\/\n]+)/im;
  const domain = domainRegex.exec(currentTab)[1];
  if (domain === "web.okjike.com") {
    console.log("okjike");
    extractedData = extractJikeData(document.documentElement.outerHTML);
  } else if (domain === "x.com") {
    console.log("x.com");
    extractedData = extractTweetData(document.documentElement.outerHTML);
  }

  console.log(extractedData);
  // output.textContent = JSON.stringify(extractedData, null, 2);
  const config = {
    action: "createConversation",
    personalAccessToken:
      "", // 请替换为实际的令牌
    uuid: "", // 使用时间戳创建唯一ID
    messages: [
      {
        role: "user",
        content: JSON.stringify(extractedData),
      },
    ],
  };

  // 创建对话
  chrome.runtime.sendMessage(config, response => {
    if (chrome.runtime.lastError) {
      console.error('Chrome runtime error:', chrome.runtime.lastError);
      alert('创建 Coze 对话失败: ' + chrome.runtime.lastError.message);
      return;
    }

    if (response && response.success) {
      console.log('Coze 对话创建成功:', response.data);
      const messageData = {
        role: "user",
        content: JSON.stringify(extractedData),
        content_type: "text"
      };
      const conversationId = response.data.data.id;
      const chatData = {
        bot_id: "7396359160243683391",
        user_id: "EuP3ELFdmKIEmAuw",
        additional_messages: [
          {
            role: "user",
            content: JSON.stringify(extractedData),
            content_type: "text",
          },
        ],
        stream: true,
        auto_save_history: false,
      };

      if (conversationId) {
        chatData.conversation_id = conversationId;
      }

      const config = {
        action: "initiateChat",
        personalAccessToken: "pat_GQiVyZRLGHFthG60oipH6PjDb9lSTXB24Wfa5me7WSR1nCTADbxDn2uBysSH0213", // 请替换为实际的令牌
        chatData: chatData,
      };

      // 初始化聊天
      chrome.runtime.sendMessage(config, response => {
        if (response.success) {
          console.log("创建对话");
          console.log(response.message);
        } else {
          console.error(response.error);
        }
      });
    } else {
      console.error('创建 Coze 对话时出错:', response ? response.error : 'Unknown error');
      alert('创建 Coze 对话失败: ' + (response ? response.error : 'Unknown error'));
    }
  });
}

// 监听消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("xxxx->request.", request);
  const output = document.getElementById("ai-output");
  if (!output) return;

  if (request.action === "newData"&& request.data.content_type ==="text"&& request.data.type ==="answer") {
    messageContent = request.data.content || "";
    // 将内容解析为 Markdown，并替换现有内容
    if (messageContent) {
      // messageContent += newContent;
      output.innerHTML += messageContent;
    }
  } else if (request.action === "streamComplete") {
    console.log("Chat stream completed");
    output.innerHTML = marked.parse(output.textContent)
    const sidebar = document.querySelector(".ai-sidebar");
    if (sidebar) {
      const startBtn = sidebar.querySelector(".ai-start-btn");
      if (startBtn) {
        startBtn.textContent = "重新分析";
      }
    }
  }
});

// 获取推特内容
function extractTweetData() {
  const tweets = document.querySelectorAll('article[data-testid="tweet"]');
  return Array.from(tweets).map((tweet) => {
    const authorElement = tweet.querySelector('[data-testid="User-Name"]');
    const contentElement = tweet.querySelector('[data-testid="tweetText"]');
    const timestampElement = tweet.querySelector("time");
    return {
      author: authorElement ? authorElement.textContent.trim() : null,
      content: contentElement ? contentElement.textContent.trim() : null,
      timestamp: timestampElement
        ? timestampElement.getAttribute("datetime")
        : null,
      likes:
        tweet.querySelector('[data-testid="like"]')?.textContent.trim() || "0",
      retweets:
        tweet.querySelector('[data-testid="retweet"]')?.textContent.trim() ||
        "0",
      replies:
        tweet.querySelector('[data-testid="reply"]')?.textContent.trim() || "0",
    };
  });
}

// 获取即刻个人主页的内容
function extractJikeData(html) {
  const posts = [];
  const postRegex = /<article[^>]*>([\s\S]*?)<\/article>/g;
  let match;

  while ((match = postRegex.exec(html)) !== null) {
    const postHtml = match[1];
    const post = {};

    // // 提取头像
    // const avatarMatch = postHtml.match(/src="(https:\/\/cdnv2\.ruguoapp\.com\/[^"]+)"/);
    // post.avatar = avatarMatch ? avatarMatch[1] : null;

    // 提取用户名
    const usernameMatch = postHtml.match(/<a href="\/u\/[^"]+">([^<]+)<\/a>/);
    post.username = usernameMatch ? usernameMatch[1] : null;

    // 提取时间戳
    const timestampMatch = postHtml.match(/<time datetime="([^"]+)"/);
    post.timestamp = timestampMatch ? timestampMatch[1] : null;

    // 提取内容
    const contentMatch = postHtml.match(
      /<div class="break-words[^"]*">([\s\S]*?)<\/div>/
    );
    post.content = contentMatch
      ? contentMatch[1]
        .replace(/<br>/g, "\n")
        .replace(/<a [^>]*>(.*?)<\/a>/g, "$1")
        .replace(/<[^>]+>/g, "")
        .trim()
      : null;

    // 提取话题
    const topicMatch = postHtml.match(
      /<a[^>]+href="\/topic\/[^"]+"[^>]*>([\s\S]*?)<\/a>/
    );
    post.topic = topicMatch
      ? topicMatch[1].replace(/<[^>]+>/g, "").trim()
      : null;

    // 提取点赞数
    const likesMatch = postHtml.match(/<span class="pl-2\.5">(\d+)<\/span>/);
    post.likes = likesMatch ? parseInt(likesMatch[1], 10) : null;

    // 提取评论数
    const commentsMatch = postHtml.match(
      /<div class="min-w-\[120px\] items-center flex cursor-pointer hover:text-web-icon-gray_hover"><div class="flex items-center justify-center"><svg[^>]*><\/svg><\/div><span class="pl-2\.5">(\d+)<\/span><\/div>/
    );
    post.comments = commentsMatch ? parseInt(commentsMatch[1], 10) : null;

    // // 提取图片URL（如果有）
    // const imageMatch = postHtml.match(/<img src="(https:\/\/cdnv2\.ruguoapp\.com\/[^"]+)"/);
    // post.imageUrl = imageMatch ? imageMatch[1] : null;

    posts.push(post);
  }

  return posts;
}
// 初始化插件
function init() {
  // 只有在当前tab是 web.okjike.com 或者 x.com 下才可以创建悬浮按钮
  const currentTab = window.location.href;
  const domainRegex = /^(?:https?:\/\/)?(?:[^@\/\n]+@)?(?:www\.)?([^:\/\n]+)/im;
  const domain = domainRegex.exec(currentTab)[1];
  if (domain === "web.okjike.com" || domain === "x.com") {
    createFloatingButton();
    createSidebar();
  }
}

// 立即运行初始化函数
init();

// 以防万一，我们也在 DOMContentLoaded 事件上再次运行它
document.addEventListener("DOMContentLoaded", init);
