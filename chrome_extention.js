// 导入认证函数
import { checkLoginStatus, login, register, logout, checkFeatureAvailable, checkAndUpdatePlansEnd, validateDiscountCode, activateDiscountCode } from './auth.js';

// 声明全局变量
let currentLanguage = 'zh_CN';

// 导出更新按钮状态的函数
export function updateButtonsState(isLoggedIn) {
  const buttons = document.querySelectorAll('.ai-generate-button, .translate-button, .sync-button');
  buttons.forEach(button => {
    if (!isLoggedIn) {
      button.disabled = true;
      button.title = 'Please login first';
    } else {
      button.disabled = false;
      button.title = '';
    }
  });
}

// 在点击功能按钮时检查
function checkFeatureAndAlert() {
  if (!checkFeatureAvailable()) {
    alert(window.translations.featureExpired.message);
    return false;
  }
  return true;
}

document.addEventListener("DOMContentLoaded", async () => {
  // 检查登录状态并更新按钮
  const isLoggedIn = await checkLoginStatus();
  updateButtonsState(isLoggedIn);
  if (isLoggedIn) {
    showActivationCodeInput(true); // 如果已登录,显示激活码输入框
    await checkAndUpdatePlansEnd();
  } else {
    showActivationCodeInput(false); // 未登录则隐藏激活码输入框
  }
  
  // 登录表单提交
  document.getElementById('login-btn').addEventListener('click', async () => {
    const loginBtn = document.getElementById('login-btn');
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    try {
      loginBtn.disabled = true;
      loginBtn.textContent = window.translations.loggingIn.message;
      
      await login(email, password);
      alert(window.translations.loginSuccess.message);
      showActivationCodeInput(true); // 登录成功后显示激活码输入框
    } catch (error) {
      alert(error.message);
    } finally {
      loginBtn.disabled = false;
      loginBtn.textContent = window.translations.login.message;
    }
  });
  
  // 注册表单提交  
  document.getElementById('register-btn').addEventListener('click', async () => {
    const registerBtn = document.getElementById('register-btn');
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    
    if (password !== confirmPassword) {
      alert(window.translations.passwordNotMatch.message);
      return;
    }
    
    try {
      registerBtn.disabled = true;
      registerBtn.textContent = window.translations.registering.message;
      
      await register(email, password);
      alert(window.translations.registerSuccess.message);
      document.getElementById('switch-to-login').click();
    } catch (error) {
      alert(error.message);
    } finally {
      registerBtn.disabled = false; 
      registerBtn.textContent = window.translations.register.message;
    }
  });
  
  // 切换表单显示
  document.getElementById('switch-to-register').addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('login-form').style.display = 'none';
    document.getElementById('register-form').style.display = 'block';
  });
  
  document.getElementById('switch-to-login').addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('register-form').style.display = 'none';
    document.getElementById('login-form').style.display = 'block';
  });
  
  // 退出登录
  document.querySelector('.logout-button').addEventListener('click', () => {
    logout();
    showActivationCodeInput(false); // 退出登录时隐藏激活码输入框
  });
});

// 初始化 Quill 编辑器
document.addEventListener("DOMContentLoaded", () => {

  // 初始化多语言 Quill 编辑器
  const quillOptions = {
    theme: "snow",
    modules: {
      toolbar: [
        ["bold", "italic", "underline", "strike"],
        ["blockquote", "code-block"],
        [{ header: 1 }, { header: 2 }],
        [{ list: "ordered" }, { list: "bullet" }],
        [{ script: "sub" }, { script: "super" }],
        [{ indent: "-1" }, { indent: "+1" }],
        [{ size: ["small", false, "large", "huge"] }],
        [{ header: [1, 2, 3, 4, 5, 6, false] }],
        [{ color: [] }, { background: [] }],
        [{ align: [] }],
        ["image"],
      ],
    },
  };

  // 为每种语言创建编辑器实例
  window.quillEditors = {
    zh: new Quill("#editor-zh", {
      ...quillOptions,
      placeholder: "请输入要同步的内容...",
    }),
    en: new Quill("#editor-en", {
      ...quillOptions,
      placeholder: "Enter content to sync...",
    }),
    ja: new Quill("#editor-ja", {
      ...quillOptions,
      placeholder: "同期するコンテンツを入力してください...",
    })
  };

  // 为每个编辑器添加 MutationObserver 监听
  Object.values(window.quillEditors).forEach(editor => {
    const observer = new MutationObserver(() => {
      console.log("编辑器内容已更新");
    });

    observer.observe(editor.root, {
      childList: true,
      characterData: true,
      subtree: true,
    });
  });

  // 个人中心功能
  const personalCenter = document.getElementById("personal-center");
  const settingsButton = document.getElementById("settings-button");

  if (settingsButton && personalCenter) {
    let personalCenterVisible = false;

    // 点击设置按钮时切换个人中心显示状态
    settingsButton.addEventListener("click", () => {
      personalCenterVisible = !personalCenterVisible;
      personalCenter.classList.toggle("show", personalCenterVisible);
    });

    // 点击个人中心外部区域时关闭
    document.addEventListener("click", (event) => {
      if (personalCenterVisible && 
          !personalCenter.contains(event.target) && 
          !settingsButton.contains(event.target)) {
        personalCenterVisible = false;
        personalCenter.classList.remove("show");
      }
    });
  } else {
    console.error("个人中心元素或设置按钮未找到");
  }

  // 主题切换功能
  const themeSwitch = document.getElementById("theme-switch");
  const body = document.body;

  // 检查本地存储中的主题设置
  const currentTheme = localStorage.getItem("theme");
  if (currentTheme) {
    body.setAttribute("data-theme", currentTheme);
    themeSwitch.checked = currentTheme === "dark";
  }

  // 监听主题切换开关的变化
  themeSwitch.addEventListener("change", function () {
    if (this.checked) {
      body.setAttribute("data-theme", "dark");
      localStorage.setItem("theme", "dark");
    } else {
      body.setAttribute("data-theme", "light");
      localStorage.setItem("theme", "light");
    }
  });

  // 加载语言设置
  loadLanguage();

  // 加载语言设置函数
  function loadLanguage() {
    chrome.storage.sync.get({ language: "zh_CN" }, function (items) {
      currentLanguage = items.language;
      const languageSelect = document.getElementById("language-select");
      if (languageSelect) {
        languageSelect.value = currentLanguage;
      }
      
      // 获取当前语言的简写（如 zh_CN 转为 zh）
      const shortLang = currentLanguage.split('_')[0];
      
      // 更新所有语言标签的激活状态
      document.querySelectorAll('.language-tabs').forEach(container => {
        const tabs = container.querySelectorAll('.language-tab');
        tabs.forEach(tab => {
          const isActive = tab.dataset.lang === shortLang;
          tab.classList.toggle('active', isActive);
          
          // 同时更新对应的内容区域
          const contentId = container.closest('.tab-content')?.id || 'dynamic-content';
          const content = document.querySelector(`#${contentId} .language-content[data-lang="${tab.dataset.lang}"]`);
          if (content) {
            content.classList.toggle('active', isActive);
          }
        });
      });
      
      // 调整语言标签顺序
      reorderLanguageTabs(currentLanguage);
      
      // 更新按钮状态
      updateButtonsVisibility(shortLang);
      
      applyLanguage(currentLanguage);
    });
  }

  initializePlatformOrder();
  // 初始化平台拖拽排序
  initPlatformDragSort();
  // 加载保存的平台排序
  loadPlatformsOrder();

  // 添加新的函数来更新按钮可见性
  function updateButtonsVisibility(currentLang) {
    const aiGenerateButton = document.getElementById('aiGenerateButton');
    const translateButton = document.getElementById('translateButton');
    const articleTranslateButton = document.getElementById('articleTranslateButton');
    
    // AI生成按钮只在当前语言标签激活时显示
    if (aiGenerateButton) {
      const activeTab = document.querySelector('.language-tab.active');
      aiGenerateButton.style.display = activeTab?.dataset.lang === currentLang ? 'block' : 'none';
    }
    
    // 翻译按钮只在非当前语言标签激活时显示
    if (translateButton) {
      const activeTab = document.querySelector('#dynamic-content .language-tab.active');
      translateButton.style.display = activeTab?.dataset.lang !== currentLang ? 'block' : 'none';
    }
    
    if (articleTranslateButton) {
      const activeTab = document.querySelector('#article-content .language-tab.active');
      articleTranslateButton.style.display = activeTab?.dataset.lang !== currentLang ? 'block' : 'none';
    }
  }

  // 添加语言标签重排序函数
  function reorderLanguageTabs(currentLang) {
    const languageTabsContainers = document.querySelectorAll('.language-tabs');
    
    languageTabsContainers.forEach(container => {
      const tabs = Array.from(container.children);
      let preferredLang = currentLang.split('_')[0]; // 从 zh_CN 提取 zh
      
      // 根据当前语言重新排序标签
      tabs.sort((a, b) => {
        const aLang = a.getAttribute('data-lang');
        const bLang = b.getAttribute('data-lang');
        
        if (aLang === preferredLang) return -1;
        if (bLang === preferredLang) return 1;
        return 0;
      });
      
      // 清空容器
      container.innerHTML = '';
      
      // 重新添加排序后的标签
      tabs.forEach(tab => {
        container.appendChild(tab);
      });
    });
  }

  // 添加语言选择事件监听器
  const languageSelect = document.getElementById("language-select");
  if (languageSelect) {
    languageSelect.addEventListener("change", function () {
      const selectedLanguage = this.value;
      chrome.storage.sync.set({ language: selectedLanguage }, function () {
        const shortLang = selectedLanguage.split('_')[0];
        reorderLanguageTabs(selectedLanguage);
        applyLanguage(selectedLanguage);
        
        // 更新语言标签激活状态和按钮显示
        document.querySelectorAll('.language-tab').forEach(tab => {
          const isActive = tab.dataset.lang === shortLang;
          tab.classList.toggle('active', isActive);
          
          const contentArea = tab.closest('.language-tabs').nextElementSibling;
          if (contentArea) {
            const content = contentArea.querySelector(`.language-content[data-lang="${tab.dataset.lang}"]`);
            if (content) {
              content.classList.toggle('active', isActive);
            }
          }
        });
        
        updateButtonsVisibility(shortLang);
      });
    });
  } else {
    console.error("未找到语言选择下拉框");
  }

  // 初始化平台语言选择
  loadPlatformLanguages();
  initPlatformLanguageListeners();

  // 添加到 DOMContentLoaded 事件监听器中
  const translateButton = document.getElementById('translateButton');
  const languageTabs = document.querySelectorAll('.language-tab');
  const defaultLanguage = 'zh'; // 设置默认语言为中文

  // 显示/隐藏翻译按钮
  function toggleTranslateButton(targetLang) {
    const currentLang = document.querySelector('#language-select').value.split('_')[0];
    const defaultLanguage = currentLang; // 使用个人中心选择的语言作为默认语言
    translateButton.style.display = targetLang !== defaultLanguage ? 'block' : 'none';
  }

  // 语言标签点击事件
  languageTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const targetLang = tab.dataset.lang;
      toggleTranslateButton(targetLang);
    });
  });

  // 动态页面翻译按钮点击事件
  translateButton.addEventListener('click', async (e) => {
    if (!checkFeatureAndAlert()) {
      e.preventDefault();
      return;
    }
    const activeTab = document.querySelector('.tab.active').dataset.tab;
    let content = '';
    let targetLang = '';
    let sourceLang = document.querySelector('#language-select').value.split('_')[0];
    
    // 获取当前激活的语言标签
    const activeLanguageTab = document.querySelector(`#${activeTab}-content .language-tab.active`);
    targetLang = activeLanguageTab.dataset.lang;
    
    // 获取源语言内容
    if (activeTab === 'dynamic') {
      content = document.getElementById(`dynamic-text-${sourceLang}`).value;
    } else if (activeTab === 'article') {
      content = window.quillEditors[sourceLang].root.innerHTML;
    }

    if (!content) {
      alert(window.translations.enterDefaultContent.message);
      return;
    }

    translateButton.disabled = true;
    translateButton.textContent = window.translations.translating.message;

    // 设置 Dify API URL 和 API 密钥
    const API_URL = "https://api.dify.ai/v1/workflows/run";
    const API_KEY = "app-Nm4t4VvkxGfgvJZ9B3H8lijl";

    // 构建请求数据
    const requestData = {
      inputs: {"inputContent":content,"language":targetLang}, // 传入工作流所需的输入数据
      response_mode: "blocking",
      user: "Dify"
    };

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${API_KEY}`
        },
        body: JSON.stringify(requestData)
      });

      const result = await response.json();
      
      if (result.data && result.data.status === "succeeded") {
        const translatedText = result.data.outputs.text;
        
        // 将翻译结果填入目标语言输入框
        document.getElementById(`dynamic-text-${targetLang}`).value = translatedText;
      } else {
        throw new Error('翻译失败：' + (result.data?.error || '未知错误'));
      }
    } catch (error) {
      console.error('翻译失败:', error);
      alert('翻译失败，请稍后重试');
    } finally {
      translateButton.disabled = false;
      translateButton.textContent = '翻译';
    }
  });

  // 文章翻译按钮
  const articleTranslateButton = document.getElementById('articleTranslateButton');
  const articleLanguageTabs = document.querySelectorAll('#article-content .language-tab');

  // 显示/隐藏文章翻译按钮
  function toggleArticleTranslateButton(targetLang) {
    const currentLang = document.querySelector('#language-select').value.split('_')[0];
    const defaultLanguage = currentLang;
    articleTranslateButton.style.display = targetLang !== defaultLanguage ? 'block' : 'none';
  }

  // 文章语言标签点击事件
  articleLanguageTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const targetLang = tab.dataset.lang;
      toggleArticleTranslateButton(targetLang);
    });
  });

  // 文章翻译按钮点击事件
  articleTranslateButton.addEventListener('click', async (e) => {
    if (!checkFeatureAndAlert()) {
      e.preventDefault();
      return;
    }
    let content = '';
    let targetLang = '';
    let sourceLang = document.querySelector('#language-select').value.split('_')[0];
    
    // 获取当前激活的语言标签
    const activeLanguageTab = document.querySelector('#article-content .language-tab.active');
    targetLang = activeLanguageTab.dataset.lang;
    
    // 获取源语言内容
    content = window.quillEditors[sourceLang].root.innerHTML;

    if (!content || content === '<p><br></p>') {
      alert(window.translations.enterDefaultContent.message);
      return;
    }

    articleTranslateButton.disabled = true;
    articleTranslateButton.textContent = window.translations.translating.message;

    // 设置 Dify API URL 和 API 密钥
    const API_URL = "https://api.dify.ai/v1/workflows/run";
    const API_KEY = "app-Nm4t4VvkxGfgvJZ9B3H8lijl";

    // 构建请求数据
    const requestData = {
      inputs: {"inputContent": content, "language": targetLang},
      response_mode: "blocking",
      user: "Dify"
    };

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${API_KEY}`
        },
        body: JSON.stringify(requestData)
      });

      const result = await response.json();
      
      if (result.data && result.data.status === "succeeded") {
        const translatedText = result.data.outputs.text;
        window.quillEditors[targetLang].root.innerHTML = translatedText;
      } else {
        throw new Error('翻译失败：' + (result.data?.error || '未知错误'));
      }
    } catch (error) {
      console.error('翻译失败:', error);
      alert('翻译失败，请稍后重试');
    } finally {
      articleTranslateButton.disabled = false;
      articleTranslateButton.textContent = window.translations.translateButton.message;
    }
  });

  // 在 DOMContentLoaded 事件监听器中添加
  const aiGenerateButton = document.getElementById('aiGenerateButton');

  // 显示/隐藏AI生成按钮
  function toggleAiGenerateButton(targetLang) {
    const currentLang = document.querySelector('#language-select').value.split('_')[0];
    aiGenerateButton.style.display = targetLang === currentLang ? 'block' : 'none';
  }

  // 初始化时设置AI生成按钮状态
  const initialActiveTab = document.querySelector('#dynamic-content .language-tab.active');
  if (initialActiveTab) {
    toggleAiGenerateButton(initialActiveTab.dataset.lang);
  }

  // 语言标签点击事件修改
  languageTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const targetLang = tab.dataset.lang;
      toggleTranslateButton(targetLang);
      toggleAiGenerateButton(targetLang);
    });
  });

  // AI生成按钮点击事件
  aiGenerateButton.addEventListener('click', async (e) => {
    if (!checkFeatureAndAlert()) {
      e.preventDefault();
      return;
    }
    const activeTab = document.querySelector('.tab.active').dataset.tab;
    const currentLang = document.querySelector('#language-select').value.split('_')[0];
    const content = document.getElementById(`dynamic-text-${currentLang}`).value;

    if (!content) {
      alert(window.translations.enterPrompt.message);
      return;
    }

    aiGenerateButton.disabled = true;
    aiGenerateButton.textContent = window.translations.generating.message;

    const API_URL = "https://api.dify.ai/v1/workflows/run";
    const API_KEY = "app-vSyKXQ2s5vx4Cw0KZiUzf9Oe";

    const requestData = {
      inputs: {
        "inputKeyword": content,
        "language": currentLang
      },
      response_mode: "blocking",
      user: "Dify"
    };

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${API_KEY}`
        },
        body: JSON.stringify(requestData)
      });

      const result = await response.json();
      
      if (result.data && result.data.status === "succeeded") {
        const generatedText = result.data.outputs.text;
        document.getElementById(`dynamic-text-${currentLang}`).value = generatedText;
      } else {
        throw new Error('生成失败：' + (result.data?.error || '未知错误'));
      }
    } catch (error) {
      console.error('AI生成失败:', error);
      alert('生成失败，请稍后重试');
    } finally {
      aiGenerateButton.disabled = false;
      aiGenerateButton.textContent = window.translations.aiGenerateButton.message;
    }
  });
});

// 应用语言设置函数
function applyLanguage(lang) {
  currentLanguage = lang;
  fetch(`_locales/${lang}/messages.json`)
    .then((response) => response.json())
    .then((data) => {
      window.translations = data;
      const translations = data;
      document.querySelectorAll("[data-i18n]").forEach((element) => {
        const key = element.getAttribute("data-i18n");
        if (translations[key]) {
          element.textContent = translations[key]["message"];
        }
      });
      document.querySelectorAll("[data-i18n-placeholder]").forEach((element) => {
        const key = element.getAttribute("data-i18n-placeholder");
        if (translations[key]) {
          element.setAttribute("placeholder", translations[key]["message"]);
        }
      });
      // 处理title属性的多语言
      document.querySelectorAll("[data-i18n-title]").forEach((element) => {
        const key = element.getAttribute("data-i18n-title");
        if (translations[key]) {
            element.setAttribute("title", translations[key]["message"]);
        }
      });
      // if (translations.quill_placeholder && translations.quill_placeholder.message) {
      //   Object.values(window.quillEditors).forEach(editor => {
      //     editor.root.dataset.placeholder = translations.quill_placeholder.message;
      //   });
      // };
    });
}

// 获取DOM元素
const tabs = document.querySelectorAll(".tab");
const platformContainers = document.querySelectorAll(".platforms");
const selectAllCheckbox = document.getElementById("selectAll");
const syncButton = document.getElementById("syncButton");
const imageUpload = document.getElementById("imageUpload");
const imagePreview = document.getElementById("imagePreview");
let selectedImages = [];

// 当前选中的标签和平台
let currentTab = "dynamic";
let selectedPlatforms = [];

// 获取所有标签页内容元素
const tabContents = document.querySelectorAll(".tab-content");

// 标签切功能
tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    tabs.forEach((t) => t.classList.remove("active"));
    tab.classList.add("active");
    currentTab = tab.dataset.tab;
    showTabContent(currentTab);
    showPlatforms(currentTab);
  });
});

// 显示对应标签的内容
function showTabContent(tabName) {
  tabContents.forEach((content) => {
    if (content.id === `${tabName}-content`) {
      content.classList.add("active");
    } else {
      content.classList.remove("active");
    }
  });
}

// 显示对应标签的平台
function showPlatforms(tabName) {
  platformContainers.forEach((container) => {
    if (container.classList.contains(`${tabName}-platforms`)) {
      container.style.display = "flex";
    } else {
      container.style.display = "none";
    }
  });
  updateSelectedPlatforms();
}

// 平台选择功能
platformContainers.forEach((container) => {
  const platforms = container.querySelectorAll('input[type="checkbox"]');
  platforms.forEach((platform) => {
    platform.addEventListener("change", () => {
      updateSelectedPlatforms();
    });
  });
});

// 全选功能
selectAllCheckbox.addEventListener("change", () => {
  const currentPlatforms = document
    .querySelector(`.${currentTab}-platforms`)
    .querySelectorAll('input[type="checkbox"]');
  currentPlatforms.forEach((platform) => {
    platform.checked = selectAllCheckbox.checked;
  });
  updateSelectedPlatforms();
});

// 更新选中的平台
function updateSelectedPlatforms() {
  const currentPlatforms = document
    .querySelector(`.${currentTab}-platforms`)
    .querySelectorAll('input[type="checkbox"]');
  selectedPlatforms = Array.from(currentPlatforms)
    .filter((platform) => platform.checked)
    .map((platform) => platform.value);

  selectAllCheckbox.checked =
    selectedPlatforms.length === currentPlatforms.length;
}

// 等待元素出现的函数
function waitForElement(tabId, selector, timeout) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    const checkElement = async () => {
      const elementExists = await chrome.scripting.executeScript({
        target: { tabId: tabId },
        func: (selector) => !!document.querySelector(selector),
        args: [selector],
      });

      if (elementExists[0].result) {
        resolve();
      } else if (Date.now() - startTime > timeout) {
        reject(new Error(`等待元素 ${selector} 超时`));
      } else {
        setTimeout(checkElement, 500); // 每500ms检查一次
      }
    };
    checkElement();
  });
}

// 动态标签页的语言切换
const dynamicLanguageTabs = document.querySelectorAll('#dynamic-content .language-tab');
const dynamicLanguageContents = document.querySelectorAll('#dynamic-content .language-content');

dynamicLanguageTabs.forEach(tab => {
  tab.addEventListener('click', () => {
    dynamicLanguageTabs.forEach(t => t.classList.remove('active'));
    dynamicLanguageContents.forEach(c => c.classList.remove('active'));
    
    tab.classList.add('active');
    const lang = tab.dataset.lang;
    document.querySelector(`#dynamic-content .language-content[data-lang="${lang}"]`).classList.add('active');
  });
});

// 文章标签页的语言切换
const articleLanguageTabs = document.querySelectorAll('#article-content .language-tab');
const articleLanguageContents = document.querySelectorAll('#article-content .language-content');

articleLanguageTabs.forEach(tab => {
  tab.addEventListener('click', () => {
    articleLanguageTabs.forEach(t => t.classList.remove('active'));
    articleLanguageContents.forEach(c => c.classList.remove('active'));
    
    tab.classList.add('active');
    const lang = tab.dataset.lang;
    document.querySelector(`#article-content .language-content[data-lang="${lang}"]`).classList.add('active');
  });
});

// 同步功能
function handleSync(tabType) {
  return async (e) => {
    // 检查登录状态
    const isLoggedIn = await checkLoginStatus();
    if (!isLoggedIn) {
      alert('请先登录后再使用同步功能');
      return;
    }
    if (!checkFeatureAndAlert()) {
      e.preventDefault();
      return;
    }
    
    let contents = {};
    if (tabType === "dynamic") {
      // 获取所有语言的内容
      contents = {
        zh: document.getElementById("dynamic-text-zh").value.trim(),
        en: document.getElementById("dynamic-text-en").value.trim(),
        ja: document.getElementById("dynamic-text-ja").value.trim()
      };
    } else if (tabType === "article") {
      // 获取所有语言的编辑器内容
      contents = {
        zh: window.quillEditors.zh.root.innerHTML.trim(),
        en: window.quillEditors.en.root.innerHTML.trim(),
        ja: window.quillEditors.ja.root.innerHTML.trim()
      };
    } else if (tabType === "video") {
      content = document.getElementById("video-text").value.trim();
    }

    // 检查所有语言的内容是否都为空
    const isAllEmpty = Object.values(contents).every(
      content => content === "" || content === "<p><br></p>"
    );
    
    if (isAllEmpty) {
      alert(window.translations.enterContent.message);
      return;
    }
    
    // 请选择至少一个同步平台
    if (selectedPlatforms.length === 0) {
      alert(window.translations.selectPlatform.message);
      return;
    }

    const syncButton = document.getElementById(
      tabType === "article" ? "articleSyncButton" : "syncButton"
    );
    syncButton.disabled = true;
    syncButton.textContent = "同步中...";

    toggleSyncControls(true);

    try {
      const syncPromises = selectedPlatforms.map((platform) => {
        const platformElement = document.querySelector(`input[value="${platform}"]`).closest(".platform");
        const progressIndicator = platformElement.querySelector(".progress-indicator");
        // 获取用户为该平台选择的语言
        const selectedLanguage = platformElement.querySelector(".platform-language").value;
        // 根据选择的语言获取对应内容
        const contentToSync = contents[selectedLanguage] || contents.zh;
        
        return syncToPlatform(platform, contentToSync, progressIndicator);
      });

      await Promise.all(syncPromises);
    } catch (error) {
      console.error("同步过程中出错:", error);
    } finally {
      syncButton.disabled = false;
      toggleSyncControls(false);
      syncButton.textContent = "同步";
    }
  };
}

syncButton.addEventListener("click", handleSync("dynamic"));
document
  .getElementById("articleSyncButton")
  .addEventListener("click", handleSync("article"));

// 同步到特定平台的函数
async function syncToPlatform(platform, content, progressIndicator) {
  try {
    progressIndicator.style.width = "0%";
    progressIndicator.style.backgroundColor = "var(--primary-color)";

    const updateProgress = (progress) => {
      progressIndicator.style.width = `${progress}%`;
    };

    let syncFunction;
    switch (platform) {
      // 动态同步
      case "toutiao":
        syncFunction = syncToToutiao;
        break;
      case "jike":
        syncFunction = syncToJike;
        break;
      case "weibo":
        syncFunction = syncToWeibo;
        break;
      case "twitter":
        syncFunction = syncToTwitter;
        break;
      case "bilibili":
        syncFunction = syncToBilibili;
        break;
      case "baijiahao":
        syncFunction = syncToBaijiahao;
        break;
      case "zhihu":
        syncFunction = syncToZhihuIdea;
        break;
      case "facebook":
        syncFunction = syncToFacebook;
        break;
      case "threads":
        syncFunction = syncToThreads;
        break;
      case "douban":
        syncFunction = syncToDouban;
        break;
      case "dedao":
        syncFunction = syncToDedao;
        break;
      case "csdndynamic":
        syncFunction = syncToCSDNDynamic;
        break;
      case "bluesky":
        syncFunction = syncToBluesky;
        break;
      case "v2ex":
        syncFunction = syncToV2ex;
        break;
      case "w2solo":
        syncFunction = syncToW2solo;
        break;
      case "wangyidynamic":
        syncFunction = syncToWangyiDynamic;
        break;
      case "zsxq":
        syncFunction = syncToZsxq;
        break;
      case "tumblr":
        syncFunction = syncToTumblr;
        break;
      case "quora":
        syncFunction = syncToQuora;
        break;
      case "mastodon":
        syncFunction = syncToMastodon;
        break;
      // 文章同步
      case "toutiaoarticle":
        syncFunction = syncToToutiaoArticle;
        break;
      case "wechatarticle":
        syncFunction = syncToWechatArticle;
        break;
      case "jianshuarticle":
        syncFunction = syncToJianshuArticle;
        break;
      case "qiehaoarticle":
        syncFunction = syncToQQArticle;
        break;
      case "bilibiliarticle":
        syncFunction = syncToBilibiliArticle;
        break;
      case "csdnarticle":
        syncFunction = syncToCSDNArticle;
        break;
      case "juejinarticle":
        syncFunction = syncToJuejinArticle;
        break;
      case "bokeyuanarticle":
        syncFunction = syncToBokeyuanArticle;
        break;
      case "wangyiarticle":
        syncFunction = syncToWangyiArticle;
        break;
      case "souhuarticle":
        syncFunction = syncToSohuArticle;
        break;
      case "51ctoarticle":
        syncFunction = syncTo51ctoArticle;
        break;
      case "mediumarticle":
        syncFunction = syncToMediumArticle;
        break;
      case "zhihuarticle":
        syncFunction = syncToZhihuArticle;
        break;
      default:
        throw new Error("未知平台");
    }

    await syncFunction(content, updateProgress);

    progressIndicator.style.width = "100%";
    progressIndicator.style.backgroundColor = "green";
  } catch (error) {
    console.error(`同步到 ${platform} 失败:`, error);
    progressIndicator.style.width = "100%";
    progressIndicator.style.backgroundColor = "red";
  }
}

// 处理同步结果的函数
function handleSyncResults(results) {
  const successfulPlatforms = results
    .filter((result) => result.success)
    .map((result) => result.platform);
  const failedPlatforms = results
    .filter((result) => !result.success)
    .map((result) => result.platform);

  let message = "";
  if (successfulPlatforms.length > 0) {
    message += `内容已成功同步到以下平台：${successfulPlatforms.join(", ")}\n`;
  }
  if (failedPlatforms.length > 0) {
    message += `同步失败的平台：${failedPlatforms.join(
      ", "
    )}\n请查看控制台以获取详细错误信息。`;
  }

  alert(message);

  results.forEach((result) => {
    if (!result.success) {
      console.error(`同步到 ${result.platform} 失败:`, result.error);
    }
  });
}

// 处理图片选择
document
  .getElementById("imageUpload")
  .addEventListener("change", handleImageUpload);
document
  .getElementById("articleImageUpload")
  .addEventListener("change", handleImageUpload);

// 处理图片上传的函数
function handleImageUpload(event) {
  const files = event.target.files;
  selectedImages = selectedImages.concat(Array.from(files));
  updateImagePreview();
}

// 更新图片预览的函数
function updateImagePreview() {
  let imagePreview;
  if (currentTab === "dynamic") {
    imagePreview = document.getElementById("imagePreview");
  } else if (currentTab === "article") {
    imagePreview = document.getElementById("articleImagePreview");
  } else {
    console.log("当前标签页不支持图片预览");
    return;
  }

  if (!imagePreview) {
    console.error(`找不到 ${currentTab} 标签页的图片预览容器`);
    return;
  }

  imagePreview.innerHTML = "";

  selectedImages.forEach((file, index) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const imgContainer = document.createElement("div");
      imgContainer.className = "image-container";
      imgContainer.dataset.index = index.toString();

      const img = document.createElement("img");
      img.src = e.target.result;

      const deleteButton = document.createElement("div");
      deleteButton.className = "delete-image";
      deleteButton.innerHTML = "×";
      deleteButton.onclick = (event) => {
        event.stopPropagation();
        deleteImage(index);
      };

      imgContainer.appendChild(img);
      imgContainer.appendChild(deleteButton);
      imagePreview.appendChild(imgContainer);
    };
    reader.readAsDataURL(file);
  });
}

// 删除图片的函数
function deleteImage(index) {
  selectedImages.splice(index, 1);
  updateImagePreview();
}

// 切换同步控件状态的函数
function toggleSyncControls(disabled) {
  const controls = document.querySelectorAll(".sync-control");
  controls.forEach((control) => {
    if (control.tagName === "DIV") {
      control.style.pointerEvents = disabled ? "none" : "auto";
      control.style.opacity = disabled ? "0.5" : "1";
    } else {
      control.disabled = disabled;
    }
  });

  // 特别处理所有语言的 Quill 编辑器
  if (window.quillEditors) {
    Object.values(window.quillEditors).forEach(editor => {
      editor.enable(!disabled);
    });
  }
}

// 保存平台语言选择
function savePlatformLanguage(platformId, language) {
  chrome.storage.sync.set({
    [`platform_language_${platformId}`]: language
  });
}

// 加载平台语言选择
function loadPlatformLanguages() {
  const platformSelects = document.querySelectorAll('.platform-language');
  platformSelects.forEach(select => {
    const platform = select.closest('.platform').querySelector('input[type="checkbox"]').value;
    chrome.storage.sync.get(`platform_language_${platform}`, (result) => {
      const savedLanguage = result[`platform_language_${platform}`];
      if (savedLanguage) {
        select.value = savedLanguage;
      }
    });
  });
}

// 为语言选择下拉框添加事件监听
function initPlatformLanguageListeners() {
  const platformSelects = document.querySelectorAll('.platform-language');
  platformSelects.forEach(select => {
    select.addEventListener('change', (e) => {
      const platform = e.target.closest('.platform').querySelector('input[type="checkbox"]').value;
      savePlatformLanguage(platform, e.target.value);
    });
  });
}

// 微头条同步功能
async function syncToToutiao(content, updateProgress) {
  try {
    updateProgress(10);
    // 打开微头条发布页面
    const tab = await chrome.tabs.create({
      url: "https://mp.toutiao.com/profile_v4/weitoutiao/publish",
      active: false,
    });
    updateProgress(20);

    // 等待页面加完成
    await new Promise((resolve) => setTimeout(resolve, 3000));
    updateProgress(30);

    // 使用动态等待和重试机制
    const maxRetries = 3;
    const maxWaitTime = 30000; // 最大等待时间30秒
    let retries = 0;

    while (retries < maxRetries) {
      try {
        updateProgress(40 + retries * 10);
        await waitForElement(tab.id, ".ProseMirror", maxWaitTime);

        // 注入脚本并执行
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: async (content, images) => {
            const contentEditor = document.querySelector(".ProseMirror");
            if (contentEditor) {
              contentEditor.focus();
              document.execCommand("insertText", false, content);

              if (images && images.length > 0) {
                for (const image of images) {
                    const blob = await fetch(image).then((r) => r.blob());
                    const file = new File([blob], "image.png", {
                      type: "image/png",
                    });
                  
                  const clipboardData = new DataTransfer();
                  clipboardData.items.add(file);

                  const pasteEvent = new ClipboardEvent("paste", {
                    bubbles: true,
                    cancelable: true,
                    clipboardData: clipboardData,
                  });

                  contentEditor.dispatchEvent(pasteEvent);
                }
              }
            } else {
              throw new Error("未找到内容编辑器");
            }
          },
          args: [
            content,
            selectedImages.map((img) => URL.createObjectURL(img)),
          ],
        });

        updateProgress(90);
        console.log("内容已同步到微头条");
        return;
      } catch (error) {
        console.error(`尝试 ${retries + 1} 失败:`, error);
        retries++;
        if (retries >= maxRetries) {
          throw new Error("同步到微头条失败，请稍后重试");
        }
        await new Promise((resolve) => setTimeout(resolve, 3000)); // 等待3秒后重试
      }
    }
  } catch (error) {
    console.error("同步到微头条时出错:", error);
    throw error;
  }
}

// 即刻同步功能
async function syncToJike(content, updateProgress) {
  try {
    updateProgress(10);
    const tab = await chrome.tabs.create({
      url: "https://web.okjike.com",
      active: false,
    });
    updateProgress(20);

    await new Promise((resolve) => setTimeout(resolve, 3000));
    updateProgress(30);

    const maxRetries = 3;
    const maxWaitTime = 30000; // 最大等待时间30秒
    let retries = 0;

    while (retries < maxRetries) {
      try {
        updateProgress(40 + retries * 10);
        await waitForElement(
          tab.id,
          'textarea[placeholder="分享你的想法..."]',
          maxWaitTime
        );

        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: async (content, images) => {
            const contentEditor = document.querySelector(
              'textarea[placeholder="分享你的想法..."]'
            );
            if (contentEditor) {
              contentEditor.value = content;
              contentEditor.dispatchEvent(
                new Event("input", { bubbles: true })
              );

              if (images && images.length > 0) {
                for (const image of images) {
                    const blob = await fetch(image).then((r) => r.blob());
                    const file = new File([blob], "image.png", {
                      type: "image/png",
                    });
                  
                  const clipboardData = new DataTransfer();
                  clipboardData.items.add(file);

                  const pasteEvent = new ClipboardEvent("paste", {
                    bubbles: true,
                    cancelable: true,
                    clipboardData: clipboardData,
                  });

                  contentEditor.dispatchEvent(pasteEvent);
                }
              }
            } else {
              throw new Error("未找到内容编辑器");
            }
          },
          args: [
            content,
            selectedImages.map((img) => URL.createObjectURL(img)),
          ],
        });

        updateProgress(90);
        console.log("内容已同步到即刻");
        return;
      } catch (error) {
        console.error(`尝试 ${retries + 1} 失败:`, error);
        retries++;
        if (retries >= maxRetries) {
          throw new Error("同步即刻失败，请稍后重试");
        }
        await new Promise((resolve) => setTimeout(resolve, 3000)); // 等待3秒后重试
      }
    }
  } catch (error) {
    console.error("同步到即刻时出错:", error);
    throw error;
  }
}

// 微博同步功能
async function syncToWeibo(content, updateProgress) {
  try {
    updateProgress(10);
    const tab = await chrome.tabs.create({
      url: "https://weibo.com",
      active: false,
    });
    updateProgress(20);

    await new Promise((resolve) => setTimeout(resolve, 3000));
    updateProgress(30);

    const maxRetries = 3;
    const maxWaitTime = 30000; // 最大等待时间30秒
    let retries = 0;

    while (retries < maxRetries) {
      try {
        updateProgress(40 + retries * 10);
        await waitForElement(tab.id, "textarea.Form_input_2gtXx", maxWaitTime);

        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: async (content, images) => {
            const contentEditor = document.querySelector(
              "textarea.Form_input_2gtXx"
            );
            if (contentEditor) {
              contentEditor.value = content;
              contentEditor.dispatchEvent(
                new Event("input", { bubbles: true })
              );

              if (images && images.length > 0) {
                for (const image of images) {
                    const blob = await fetch(image).then((r) => r.blob());
                    const file = new File([blob], "image.png", {
                      type: "image/png",
                    });
                  
                  const clipboardData = new DataTransfer();
                  clipboardData.items.add(file);

                  const pasteEvent = new ClipboardEvent("paste", {
                    bubbles: true,
                    cancelable: true,
                    clipboardData: clipboardData,
                  });

                  contentEditor.dispatchEvent(pasteEvent);
                }
              }
            } else {
              throw new Error("未找到内容编辑器");
            }
          },
          args: [
            content,
            selectedImages.map((img) => URL.createObjectURL(img)),
          ],
        });
        updateProgress(90);
        console.log("内容已同步到微博");
        return;
      } catch (error) {
        console.error(`尝试 ${retries + 1} 失败:`, error);
        retries++;
        if (retries >= maxRetries) {
          throw new Error("同步到微博失败，请稍后重试");
        }
        await new Promise((resolve) => setTimeout(resolve, 3000)); // 等待5秒后重试
      }
    }
  } catch (error) {
    console.error("同步到微博时出错:", error);
    throw error;
  }
}
// 推特同步功能
async function syncToTwitter(content, updateProgress) {
  try {
    updateProgress(10);
    const tab = await chrome.tabs.create({
      url: "https://x.com/home",
      active: false,
    });
    updateProgress(20);

    await new Promise((resolve) => setTimeout(resolve, 5000));
    updateProgress(30);

    const maxRetries = 3;
    const maxWaitTime = 30000; // 最大等待时间30秒
    let retries = 0;

    while (retries < maxRetries) {
      try {
        updateProgress(40 + retries * 10);
        await waitForElement(
          tab.id,
          'div[data-testid="tweetTextarea_0"]',
          maxWaitTime
        );

        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: async (content, images) => {
            const contentEditor = document.querySelector(
              'div[data-testid="tweetTextarea_0"]'
            );
            if (contentEditor) {
              contentEditor.focus();
              // 使用 clipboard API 粘贴富文本内容
              const clipboardData = new DataTransfer();
              clipboardData.setData("text/plain", content);
              const pasteEvent = new ClipboardEvent("paste", {
                clipboardData: clipboardData,
                bubbles: true,
                cancelable: true,
              });
              contentEditor.dispatchEvent(pasteEvent);

              if (images && images.length > 0) {
                const fileInput = document.querySelector(
                  'input[type="file"][data-testid="fileInput"]'
                );
                if (fileInput) {
                  const dataTransfer = new DataTransfer();
                  for (const image of images) {
                      const blob = await fetch(image).then((r) => r.blob());
                      const file = new File([blob], "image.png", {
                        type: "image/png",
                      });
                    dataTransfer.items.add(file);
                  }
                  fileInput.files = dataTransfer.files;
                  fileInput.dispatchEvent(
                    new Event("change", { bubbles: true })
                  );
                } else {
                  throw new Error("未找到图片上传输入框");
                }
              }
            } else {
              throw new Error("未找到内容编辑器");
            }
          },
          args: [
            content,
            selectedImages.map((img) => URL.createObjectURL(img)),
          ],
        });

        updateProgress(90);
        console.log("内容已同步到推特");
        return;
      } catch (error) {
        console.error(`尝试 ${retries + 1} 失败:`, error);
        retries++;
        if (retries >= maxRetries) {
          throw new Error("同步到推特失败，请稍后重试");
        }
        await new Promise((resolve) => setTimeout(resolve, 3000)); // 等待3秒后重试
      }
    }
  } catch (error) {
    console.error("同步到推特时出错:", error);
    throw error;
  }
}

// B站动态同步功能
async function syncToBilibili(content, updateProgress) {
  try {
    updateProgress(10);
    const tab = await chrome.tabs.create({
      url: "https://t.bilibili.com",
      active: false,
    });
    updateProgress(20);

    await new Promise((resolve) => setTimeout(resolve, 3000));
    updateProgress(30);

    const maxRetries = 3;
    const maxWaitTime = 30000; // 最大等待时间30秒
    let retries = 0;

    while (retries < maxRetries) {
      try {
        updateProgress(40 + retries * 10);
        await waitForElement(tab.id, ".bili-rich-textarea__inner", maxWaitTime);

        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: (content) => {
            const contentEditor = document.querySelector(
              ".bili-rich-textarea__inner"
            );
            if (contentEditor) {
              contentEditor.textContent = content;
              contentEditor.dispatchEvent(
                new Event("input", { bubbles: true })
              );
            } else {
              throw new Error("未找到动态输入框");
            }
          },
          args: [content],
        });

        updateProgress(90);
        console.log("内容已同步到B站动态");
        return;
      } catch (error) {
        console.error(`尝试 ${retries + 1} 失败:`, error);
        retries++;
        if (retries >= maxRetries) {
          throw new Error("同步到B站动态失败，请稍后重试");
        }
        await new Promise((resolve) => setTimeout(resolve, 3000)); // 等待3秒后重试
      }
    }
  } catch (error) {
    console.error("同步到B站动态时出错:", error);
    throw error;
  }
}

// 百家号动态同步功能
async function syncToBaijiahao(content, updateProgress) {
  try {
    updateProgress(10);
    const tab = await chrome.tabs.create({
      url: "https://baijiahao.baidu.com/builder/rc/edit?type=events",
      active: false,
    });
    updateProgress(20);

    await new Promise((resolve) => setTimeout(resolve, 3000));
    updateProgress(30);

    const maxRetries = 3;
    const maxWaitTime = 30000; // 最大等待时间30秒
    let retries = 0;

    while (retries < maxRetries) {
      try {
        updateProgress(40 + retries * 10);
        await waitForElement(tab.id, "textarea.cheetah-input", maxWaitTime);

        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: (content) => {
            const contentEditor = document.querySelector(
              "textarea.cheetah-input"
            );
            if (contentEditor) {
              contentEditor.value = content;
              contentEditor.dispatchEvent(
                new Event("input", { bubbles: true })
              );
            } else {
              throw new Error("未找到百家号动态输入框");
            }
          },
          args: [content],
        });

        updateProgress(90);
        console.log("内容已同步到百家号动态");
        return;
      } catch (error) {
        console.error(`尝试 ${retries + 1} 失败:`, error);
        retries++;
        if (retries >= maxRetries) {
          throw new Error("同步到百家号动态失败，请稍后重试");
        }
        await new Promise((resolve) => setTimeout(resolve, 3000)); // 等待3秒后重试
      }
    }
  } catch (error) {
    console.error("同步到百家号动态时出错:", error);
    throw error;
  }
}

// 知乎想法同步功能
async function syncToZhihuIdea(content, updateProgress) {
  try {
    updateProgress(10);
    const tab = await chrome.tabs.create({
      url: "https://www.zhihu.com/",
      active: false,
    });
    updateProgress(20);

    await new Promise((resolve) => setTimeout(resolve, 3000));
    updateProgress(30);

    const maxRetries = 3;
    const maxWaitTime = 30000; // 最大等待时间30秒
    let retries = 0;

    while (retries < maxRetries) {
      try {
        updateProgress(40 + retries * 10);
        await waitForElement(tab.id, ".GlobalWriteV2-topTitle", maxWaitTime);

        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: async (content) => {
            const writeButtons = document.querySelectorAll(
              ".GlobalWriteV2-topTitle"
            );
            const writeButton = Array.from(writeButtons).find(
              (button) => button.textContent.trim() === "写想法"
            );
            if (writeButton) {
              writeButton.click();
              await new Promise((resolve) => setTimeout(resolve, 2000));
            } else {
              console.error('未找到"写想法"按钮');
              return;
            }

            // 查找想法输入框
            const contentEditor = document.querySelector(
              'div[data-contents="true"] div.public-DraftStyleDefault-block'
            );
            if (contentEditor) {
              // 填充文本内容
              contentEditor.innerHTML = `<span data-offset-key="0-0-0"><span data-text="true">${content}</span></span>`;
              contentEditor.dispatchEvent(
                new Event("input", { bubbles: true })
              );
            } else {
              console.error("未找到想法输入框");
            }
          },
          args: [content],
        });

        updateProgress(90);
        console.log("内容��同步到知乎想法");
        return;
      } catch (error) {
        console.error(`尝试 ${retries + 1} 失败:`, error);
        retries++;
        if (retries >= maxRetries) {
          throw new Error("同步到知乎想法失败，请稍后重试");
        }
        await new Promise((resolve) => setTimeout(resolve, 3000)); // 等待3秒后重试
      }
    }
  } catch (error) {
    console.error("同步到知乎想法时出错:", error);
    throw error;
  }
}

// Facebook动态同步功能
async function syncToFacebook(content, updateProgress) {
  try {
    updateProgress(10);
    const tab = await chrome.tabs.create({
      url: "https://www.facebook.com/",
      active: false,
    });
    updateProgress(20);

    await new Promise((resolve) => setTimeout(resolve, 5000));
    updateProgress(30);

    const maxRetries = 3;
    const maxWaitTime = 30000; // 最大等待时间30秒
    let retries = 0;

    while (retries < maxRetries) {
      try {
        updateProgress(40 + retries * 10);
        await waitForElement(tab.id, 'div[role="region"]', maxWaitTime);

        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: async (content, images) => {
            // 查找并点击"创建帖子"按钮
            const regionDiv = document.querySelector('div[role="region"]');
            if (regionDiv) {
              const createPostButton =
                regionDiv.querySelector('div[role="button"]');
              if (createPostButton) {
                createPostButton.click();
                await new Promise((resolve) => setTimeout(resolve, 3000));
              } else {
                throw new Error('未找到"创建帖子"按钮');
              }
            } else {
              throw new Error('未找到包含"创建帖子"按钮的区域');
            }

            // 等待对话框出现
            let dialogForm = null;
            let contentEditor = null;
            let attempts = 0;
            const maxAttempts = 10;

            while (attempts < maxAttempts) {
              dialogForm = document.querySelector('form [role="dialog"]');
              if (dialogForm) {
                contentEditor = document.querySelector(
                  'div[contenteditable="true"][role="textbox"][spellcheck="true"][tabindex="0"][data-lexical-editor="true"]'
                );
                if (contentEditor) break;
              }
              await new Promise((resolve) => setTimeout(resolve, 1000));
              attempts++;
            }

            if (!contentEditor) {
              throw new Error("未找到帖子输入框");
            }

            contentEditor.focus();
            // 使用 clipboard API 粘贴富文本内容
            const clipboardData = new DataTransfer();
            clipboardData.setData("text/plain", content);
            const pasteEvent = new ClipboardEvent("paste", {
              clipboardData: clipboardData,
              bubbles: true,
              cancelable: true,
            });
            contentEditor.dispatchEvent(pasteEvent);

            if (images && images.length > 0) {
              for (const image of images) {
                const blob = await fetch(image).then((r) => r.blob());
                const file = new File([blob], "image.png", {
                  type: "image/png",
                });

                const clipboardData = new DataTransfer();
                clipboardData.items.add(file);

                const pasteEvent = new ClipboardEvent("paste", {
                  bubbles: true,
                  cancelable: true,
                  clipboardData: clipboardData,
                });

                contentEditor.dispatchEvent(pasteEvent);
              }
            }
          },
          args: [
            content,
            selectedImages.map((img) => URL.createObjectURL(img)),
          ],
        });

        updateProgress(90);
        console.log("内容已同步到Facebook");
        return;
      } catch (error) {
        console.error(`重试 ${retries + 1} 失败:`, error);
        retries++;
        if (retries >= maxRetries) {
          throw new Error("同步到Facebook失败，请稍后重试");
        }
        await new Promise((resolve) => setTimeout(resolve, 5000)); // 等待5秒后重试
      }
    }
  } catch (error) {
    console.error("同步到Facebook时出错:", error);
    throw error;
  }
}

// Threads 动态同步功能
async function syncToThreads(content, updateProgress) {
  try {
    updateProgress(10);
    const tab = await chrome.tabs.create({
      url: "https://www.threads.net",
      active: false,
    });
    updateProgress(20);

    await new Promise((resolve) => setTimeout(resolve, 5000));
    updateProgress(30);

    const maxRetries = 3;
    const maxWaitTime = 30000; // 最大等待时间30秒
    let retries = 0;

    while (retries < maxRetries) {
      try {
        updateProgress(40 + retries * 10);
        await waitForElement(tab.id, 'div[role="button"]', maxWaitTime);

        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: async (content, images) => {
            const createPostButton =
              document.querySelector('div[role="button"]');
            if (createPostButton) {
              createPostButton.click();
              await new Promise((resolve) => setTimeout(resolve, 2000));
            } else {
              throw new Error("未找到创建帖子按钮");
            }

            const contentEditor = document.querySelector(
              'div[contenteditable="true"][role="textbox"]'
            );
            if (contentEditor) {
              contentEditor.focus();
              // 使用 clipboard API 粘贴富文本内容
              const clipboardData = new DataTransfer();
              clipboardData.setData("text/plain", content);
              const pasteEvent = new ClipboardEvent("paste", {
                clipboardData: clipboardData,
                bubbles: true,
                cancelable: true,
              });
              contentEditor.dispatchEvent(pasteEvent);

              if (images && images.length > 0) {
                const fileInput = document.querySelector('input[type="file"]');
                if (fileInput) {
                  const dataTransfer = new DataTransfer();
                  for (const image of images) {
                    const response = await fetch(image);
                    const blob = await response.blob();
                    const file = new File([blob], "image.png", {
                      type: "image/png",
                    });
                    dataTransfer.items.add(file);
                  }
                  fileInput.files = dataTransfer.files;
                  fileInput.dispatchEvent(
                    new Event("change", { bubbles: true })
                  );
                } else {
                  throw new Error("未找到图片上传输入框");
                }
              }
            } else {
              throw new Error("未找到内容编辑器");
            }
          },
          args: [
            content,
            selectedImages.map((img) => URL.createObjectURL(img)),
          ],
        });

        updateProgress(90);
        console.log("内容已同步到Threads");
        return;
      } catch (error) {
        console.error(`尝试 ${retries + 1} 失败:`, error);
        retries++;
        if (retries >= maxRetries) {
          throw new Error("同步到Threads失败，请稍后重试");
        }
        await new Promise((resolve) => setTimeout(resolve, 5000)); // 等待5秒后重试
      }
    }
  } catch (error) {
    console.error("同步到Threads时出错:", error);
    throw error;
  }
}

// 豆瓣动态同步功能
async function syncToDouban(content, updateProgress) {
  try {
    updateProgress(10);
    const tab = await chrome.tabs.create({
      url: "https://www.douban.com",
      active: false,
    });
    updateProgress(20);

    await new Promise((resolve) => setTimeout(resolve, 3000));
    updateProgress(30);

    const maxRetries = 3;
    const maxWaitTime = 30000; // 最大等待时间30秒
    let retries = 0;

    while (retries < maxRetries) {
      try {
        updateProgress(40 + retries * 10);
        await waitForElement(tab.id, "textarea", maxWaitTime);

        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: async (content, images) => {
            const broadcastButton = document.querySelector("textarea");
            if (broadcastButton) {
              broadcastButton.click();
              await new Promise((resolve) => setTimeout(resolve, 1000));
            } else {
              throw new Error("未找到广播按钮");
            }

            const contentEditor = document.querySelector("#isay-cont");
            if (contentEditor) {
              contentEditor.value = content;
              contentEditor.dispatchEvent(
                new Event("input", { bubbles: true })
              );

              if (images && images.length > 0) {
                for (const image of images) {
                  const blob = await fetch(image).then((r) => r.blob());
                  const file = new File([blob], "image.png", {
                    type: "image/png",
                  });

                  const clipboardData = new DataTransfer();
                  clipboardData.items.add(file);

                  const pasteEvent = new ClipboardEvent("paste", {
                    bubbles: true,
                    cancelable: true,
                    clipboardData: clipboardData,
                  });

                  contentEditor.dispatchEvent(pasteEvent);
                }
              }
            } else {
              throw new Error("未找到内容编辑器");
            }
          },
          args: [
            content,
            selectedImages.map((img) => URL.createObjectURL(img)),
          ],
        });

        updateProgress(90);
        console.log("内容已同步到豆瓣");
        return;
      } catch (error) {
        console.error(`尝试 ${retries + 1} 失败:`, error);
        retries++;
        if (retries >= maxRetries) {
          throw new Error("同步到豆瓣失败，请稍后重试");
        }
        await new Promise((resolve) => setTimeout(resolve, 3000)); // 等待3秒后重试
      }
    }
  } catch (error) {
    console.error("同步到豆瓣时出错:", error);
    throw error;
  }
}

// 得到动态同步功能
async function syncToDedao(content, updateProgress) {
  try {
    updateProgress(10);
    const tab = await chrome.tabs.create({
      url: "https://www.dedao.cn/knowledge/home",
      active: false,
    });
    updateProgress(20);

    await new Promise((resolve) => setTimeout(resolve, 3000));
    updateProgress(30);

    const maxRetries = 3;
    const maxWaitTime = 30000;
    let retries = 0;

    while (retries < maxRetries) {
      try {
        updateProgress(40 + retries * 10);
        await waitForElement(tab.id, "#richEditor", maxWaitTime);

        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: async (content, images) => {
            const contentEditor = document.querySelector("#richEditor");
            if (contentEditor) {
              contentEditor.focus();
              
              // 使用 clipboard API 粘贴内容
              const clipboardData = new DataTransfer();
              clipboardData.setData("text/plain", content);
              const pasteEvent = new ClipboardEvent("paste", {
                clipboardData: clipboardData,
                bubbles: true,
                cancelable: true,
              });
              contentEditor.dispatchEvent(pasteEvent);

              // 处理图片上传
              if (images && images.length > 0) {
                const imageInput = document.querySelector('input[type="file"]');
                if (imageInput) {
                  const dataTransfer = new DataTransfer();
                  for (const image of images) {
                    const blob = await fetch(image).then((r) => r.blob());
                    const file = new File([blob], "image.png", {
                      type: "image/png",
                    });
                    dataTransfer.items.add(file);
                  }
                  imageInput.files = dataTransfer.files;
                  imageInput.dispatchEvent(new Event("change", { bubbles: true }));
                }
              }
            } else {
              throw new Error("未找到内容编辑器");
            }
          },
          args: [content, selectedImages.map((img) => URL.createObjectURL(img))],
        });

        updateProgress(90);
        console.log("内容已同步到得到");
        return;
      } catch (error) {
        console.error(`尝试 ${retries + 1} 失败:`, error);
        retries++;
        if (retries >= maxRetries) {
          throw new Error("同步到得到失败，请稍后重试");
        }
        await new Promise((resolve) => setTimeout(resolve, 3000));
      }
    }
  } catch (error) {
    console.error("同步到得到时出错:", error);
    throw error;
  }
}

// CSDN动态同步功能
async function syncToCSDNDynamic(content, updateProgress) {
  try {
    updateProgress(10);
    const tab = await chrome.tabs.create({
      url: "https://blink.csdn.net/",
      active: false,
    });
    updateProgress(20);

    await new Promise((resolve) => setTimeout(resolve, 3000));
    updateProgress(30);

    const maxRetries = 3;
    const maxWaitTime = 30000; // 最大等待时间30秒
    let retries = 0;

    while (retries < maxRetries) {
      try {
        updateProgress(40 + retries * 10);
        await waitForElement(tab.id, "#messageText", maxWaitTime);

        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: async (content, images) => {
            const contentEditor = document.querySelector("#messageText");
            if (contentEditor) {
              contentEditor.value = content;
              contentEditor.dispatchEvent(
                new Event("input", { bubbles: true })
              );
            } else {
              throw new Error("未找到内容编辑器");
            }
          },
          args: [content, selectedImages.map((img) => URL.createObjectURL(img))],
        });

        updateProgress(90);
        console.log("内容已同步到CSDN动态");
        return;
      } catch (error) {
        console.error(`尝试 ${retries + 1} 失败:`, error);
        retries++;
        if (retries >= maxRetries) {
          throw new Error("同步到CSDN动态失败，请稍后重试");
        }
        await new Promise((resolve) => setTimeout(resolve, 3000));
      }
    }
  } catch (error) {
    console.error("同步到CSDN动态时出错:", error);
    throw error;
  }
}

// Bluesky动态同步功能
async function syncToBluesky(content, updateProgress) {
  try {
    updateProgress(10);
    const tab = await chrome.tabs.create({
      url: "https://bsky.app",
      active: false,
    });
    updateProgress(20);

    await new Promise((resolve) => setTimeout(resolve, 3000));
    updateProgress(30);

    const maxRetries = 3;
    const maxWaitTime = 30000;
    let retries = 0;

    while (retries < maxRetries) {
      try {
        updateProgress(40 + retries * 10);
        
        // 等待并点击发帖按钮
        await waitForElement(tab.id, 'button[aria-pressed="false"], div.css-175oi2r.r-1awozwy.r-1777fci.r-1xomwt0.r-1k9zyfm.r-1ey2ra3', maxWaitTime);
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: () => {
            const postButton = document.querySelector('button[aria-pressed="false"]');
            const gradientButton = document.querySelector('div.css-175oi2r.r-1awozwy.r-1777fci.r-1xomwt0.r-1k9zyfm.r-1ey2ra3');
            
            if (postButton) {
              postButton.click();
            } else if (gradientButton) {
              gradientButton.click();
            } else {
              throw new Error("未找到发帖按钮");
            }
          }
        });

        // 等待编辑器出现并粘贴内容
        await waitForElement(tab.id, 'div.tiptap.ProseMirror', maxWaitTime);
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: async (content, images) => {
            const contentEditor = document.querySelector('div.tiptap.ProseMirror');
            if (contentEditor) {
              contentEditor.focus();
              // 保留换行符的内容处理
              const formattedContent = content.replace(/\n/g, '<br>');
              contentEditor.innerHTML = formattedContent;
              contentEditor.dispatchEvent(new Event('input', { bubbles: true }));
              
              // 处理图片上传
              if (images && images.length > 0) {
                for (const image of images) {
                  const blob = await fetch(image).then((r) => r.blob());
                  const file = new File([blob], "image.png", {
                    type: "image/png",
                  });

                  const clipboardData = new DataTransfer();
                  clipboardData.items.add(file);

                  const pasteEvent = new ClipboardEvent("paste", {
                    bubbles: true,
                    cancelable: true,
                    clipboardData: clipboardData,
                  });

                  contentEditor.dispatchEvent(pasteEvent);
                }
              }
            } else {
              throw new Error("未找到内容编辑器");
            }
          },
          args: [content, selectedImages.map((img) => URL.createObjectURL(img))],
        });

        updateProgress(90);
        console.log("内容已同步到Bluesky");
        return;
      } catch (error) {
        console.error(`尝试 ${retries + 1} 失败:`, error);
        retries++;
        if (retries >= maxRetries) {
          throw new Error("同步到Bluesky失败，请稍后重试");
        }
        await new Promise((resolve) => setTimeout(resolve, 3000));
      }
    }
  } catch (error) {
    console.error("同步到Bluesky时出错:", error);
    throw error;
  }
}

// V2EX动态同步功能
async function syncToV2ex(content, updateProgress) {
  try {
    updateProgress(10);
    const tab = await chrome.tabs.create({
      url: "https://www.v2ex.com/write",
      active: false,
    });
    updateProgress(20);

    await new Promise((resolve) => setTimeout(resolve, 3000));
    updateProgress(30);

    const maxRetries = 3;
    const maxWaitTime = 30000;
    let retries = 0;

    while (retries < maxRetries) {
      try {
        updateProgress(40 + retries * 10);
        await waitForElement(tab.id, ".CodeMirror-lines", maxWaitTime);

        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: async (content, images) => {
            const contentEditor = document.querySelector(".CodeMirror-line");
            if (contentEditor) {
              contentEditor.focus();

              contentEditor.innerHTML = content;
              contentEditor.dispatchEvent(new Event('input', { bubbles: true }));
              
            } else {
              throw new Error("未找到内容编辑器");
            }
          },
          args: [content, selectedImages.map((img) => URL.createObjectURL(img))],
        });

        updateProgress(90);
        console.log("内容已同步到V2EX");
        return;
      } catch (error) {
        console.error(`尝试 ${retries + 1} 失败:`, error);
        retries++;
        if (retries >= maxRetries) {
          throw new Error("同步到V2EX失败，请稍后重试");
        }
        await new Promise((resolve) => setTimeout(resolve, 3000));
      }
    }
  } catch (error) {
    console.error("同步到V2EX时出错:", error);
    throw error;
  }
}

// w2solo动态同步功能
async function syncToW2solo(content, updateProgress) {
  try {
    updateProgress(10);
    const tab = await chrome.tabs.create({
      url: "https://w2solo.com/topics/new",
      active: false,
    });
    updateProgress(20);

    await new Promise((resolve) => setTimeout(resolve, 3000));
    updateProgress(30);

    const maxRetries = 3;
    const maxWaitTime = 30000; // 最大等待时间30秒
    let retries = 0;

    while (retries < maxRetries) {
      try {
        updateProgress(40 + retries * 10);
        await waitForElement(tab.id, "#topic_body", maxWaitTime);

        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: async (content, images) => {
            const contentEditor = document.querySelector("#topic_body");
            if (contentEditor) {
              contentEditor.value = content;
              contentEditor.dispatchEvent(new Event("input", { bubbles: true }));

              // 处理图片上传
              if (images && images.length > 0) {
                for (const image of images) {
                  const blob = await fetch(image).then((r) => r.blob());
                  const file = new File([blob], "image.png", {
                    type: "image/png",
                  });

                  const clipboardData = new DataTransfer();
                  clipboardData.items.add(file);

                  const pasteEvent = new ClipboardEvent("paste", {
                    bubbles: true,
                    cancelable: true,
                    clipboardData: clipboardData,
                  });

                  contentEditor.dispatchEvent(pasteEvent);

                  // 等待图片上传完成
                  await new Promise((resolve) => {
                    const checkUpload = setInterval(() => {
                      const imgElements = contentEditor.querySelectorAll('img');
                      const lastImg = imgElements[imgElements.length - 1];
                      if (lastImg && lastImg.src && !lastImg.src.startsWith('blob:')) {
                        clearInterval(checkUpload);
                        resolve();
                      }
                    }, 1000);
                    
                    // 设置超时时间
                    setTimeout(() => {
                      clearInterval(checkUpload);
                      resolve();
                    }, 30000); // 30秒超时
                  });
                }
              }
            } else {
              throw new Error("未找到内容编辑器");
            }
          },
          args: [content, selectedImages.map((img) => URL.createObjectURL(img))],
        });

        updateProgress(90);
        console.log("内容已同步到w2solo");
        return;
      } catch (error) {
        console.error(`尝试 ${retries + 1} 失败:`, error);
        retries++;
        if (retries >= maxRetries) {
          throw new Error("同步到w2solo失败，请稍后重试");
        }
        await new Promise((resolve) => setTimeout(resolve, 3000));
      }
    }
  } catch (error) {
    console.error("同步到w2solo时出错:", error);
    throw error;
  }
}

// 网易号动态同步功能
async function syncToWangyiDynamic(content, updateProgress) {
  try {
    updateProgress(10);
    const tab = await chrome.tabs.create({
      url: "https://mp.163.com/#/dynamic-publish",
      active: false,
    });
    updateProgress(20);

    await new Promise((resolve) => setTimeout(resolve, 3000));
    updateProgress(30);

    const maxRetries = 3;
    const maxWaitTime = 30000;
    let retries = 0;

    while (retries < maxRetries) {
      try {
        updateProgress(40 + retries * 10);
        await waitForElement(tab.id, 'textarea[name="easyContent"]', maxWaitTime);

        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: async (content, images) => {
            const contentEditor = document.querySelector('textarea[name="easyContent"]');
            if (contentEditor) {
              contentEditor.focus();
              contentEditor.value = content;
              contentEditor.dispatchEvent(new Event("input", { bubbles: true }));

              // 处理图片上传
              if (images && images.length > 0) {
                for (const image of images) {
                  const blob = await fetch(image).then((r) => r.blob());
                  const file = new File([blob], "image.png", {
                    type: "image/png",
                  });

                  const clipboardData = new DataTransfer();
                  clipboardData.items.add(file);

                  const pasteEvent = new ClipboardEvent("paste", {
                    bubbles: true,
                    cancelable: true,
                    clipboardData: clipboardData,
                  });

                  contentEditor.dispatchEvent(pasteEvent);
                  // 每次粘贴后等待2秒,确保图片上传完成
                  await new Promise(resolve => setTimeout(resolve, 8000));
                }
              }
            } else {
              throw new Error("未找到内容编辑器");
            }
          },
          args: [content, selectedImages.map((img) => URL.createObjectURL(img))],
        });

        updateProgress(90);
        console.log("内容已同步到网易号动态");
        return;
      } catch (error) {
        console.error(`尝试 ${retries + 1} 失败:`, error);
        retries++;
        if (retries >= maxRetries) {
          throw new Error("同步到网易号动态失败，请稍后重试");
        }
        await new Promise((resolve) => setTimeout(resolve, 3000));
      }
    }
  } catch (error) {
    console.error("同步到网易号动态时出错:", error);
    throw error;
  }
}

// 知识星球动态同步功能
async function syncToZsxq(content, updateProgress) {
  try {
    updateProgress(10);
    const tab = await chrome.tabs.create({
      url: "https://wx.zsxq.com",
      active: false,
    });
    updateProgress(20);

    await new Promise((resolve) => setTimeout(resolve, 3000));
    updateProgress(30);

    const maxRetries = 3;
    const maxWaitTime = 30000;
    let retries = 0;

    while (retries < maxRetries) {
      try {
        updateProgress(40 + retries * 10);
        
        // 等待并点击发帖按钮
        await waitForElement(tab.id, ".post-topic-head", maxWaitTime);
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: () => {
            const postButton = document.querySelector(".post-topic-head");
            if (postButton) {
              postButton.click();
            } else {
              throw new Error("未找到发帖按钮");
            }
          }
        });

        // 等待编辑器出现并粘贴内容
        await waitForElement(tab.id, '.ql-editor.ql-blank[contenteditable="true"]', maxWaitTime);
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: async (content, images) => {
            const contentEditor = document.querySelector('.ql-editor.ql-blank[contenteditable="true"]');
            if (contentEditor) {
              contentEditor.focus();
              
              // 直接设置innerHTML以保留格式
              contentEditor.innerHTML = content;
              contentEditor.dispatchEvent(new Event('input', { bubbles: true }));

              // 处理图片上传
              if (images && images.length > 0) {
                const imageInput = document.querySelector('input[type="file"]');
                if (imageInput) {
                  const dataTransfer = new DataTransfer();
                  for (const image of images) {
                    const blob = await fetch(image).then((r) => r.blob());
                    const file = new File([blob], "image.png", {
                      type: "image/png",
                    });
                    dataTransfer.items.add(file);
                  }
                  imageInput.files = dataTransfer.files;
                  imageInput.dispatchEvent(new Event("change", { bubbles: true }));
                }
              }
            } else {
              throw new Error("未找到内容编辑器");
            }
          },
          args: [content, selectedImages.map((img) => URL.createObjectURL(img))],
        });

        updateProgress(90);
        console.log("内容已同步到知识星球");
        return;
      } catch (error) {
        console.error(`尝试 ${retries + 1} 失败:`, error);
        retries++;
        if (retries >= maxRetries) {
          throw new Error("同步到知识星球失败，请稍后重试");
        }
        await new Promise((resolve) => setTimeout(resolve, 3000));
      }
    }
  } catch (error) {
    console.error("同步到知识星球时出错:", error);
    throw error;
  }
}

// Tumblr动态同步功能
async function syncToTumblr(content, updateProgress) {
  try {
    updateProgress(10);
    const tab = await chrome.tabs.create({
      url: "https://www.tumblr.com/new/text",
      active: false,
    });
    updateProgress(20);

    await new Promise((resolve) => setTimeout(resolve, 3000));
    updateProgress(30);

    const maxRetries = 3;
    const maxWaitTime = 30000;
    let retries = 0;

    while (retries < maxRetries) {
      try {
        updateProgress(40 + retries * 10);
        await waitForElement(tab.id, 'p[role="document"]', maxWaitTime);

        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: async (content, images) => {
            const contentEditor = document.querySelector('p[role="document"]');
            if (contentEditor) {
              contentEditor.focus();

              // 保留换行符的内容处理
              const formattedContent = content.replace(/\n/g, '<p>');
              contentEditor.innerHTML = formattedContent;
              contentEditor.dispatchEvent(new Event('input', { bubbles: true }));

              // 将光标移动到末尾
              const range = document.createRange();
              const sel = window.getSelection();
              range.selectNodeContents(contentEditor);
              range.collapse(false);
              sel.removeAllRanges();
              sel.addRange(range);

              // 一次性处理所有图片
              if (images && images.length > 0) {
                const dataTransfer = new DataTransfer();
                
                // 将所有图片添加到同一个 DataTransfer 对象
                for (const image of images) {
                  const blob = await fetch(image).then((r) => r.blob());
                  const file = new File([blob], `image_${Date.now()}.png`, {
                    type: "image/png",
                  });
                  dataTransfer.items.add(file);
                }

                // 创建单个粘贴事件包含所有图片
                const imgPasteEvent = new ClipboardEvent("paste", {
                  bubbles: true,
                  cancelable: true,
                  clipboardData: dataTransfer,
                });

                // 触发一次性粘贴事件
                contentEditor.dispatchEvent(imgPasteEvent);
                
                // 等待所有图片上传完成
                await new Promise(resolve => setTimeout(resolve, 2000 * images.length));
              }

            } else {
              throw new Error("未找到内容编辑器");
            }
          },
          args: [content, selectedImages.map((img) => URL.createObjectURL(img))],
        });

        updateProgress(90);
        console.log("内容已同步到Tumblr");
        return;
      } catch (error) {
        console.error(`尝试 ${retries + 1} 失败:`, error);
        retries++;
        if (retries >= maxRetries) {
          throw new Error("同步到Tumblr失败，请稍后重试");
        }
        await new Promise((resolve) => setTimeout(resolve, 3000));
      }
    }
  } catch (error) {
    console.error("同步到Tumblr时出错:", error);
    throw error;
  }
}

async function syncToQuora(content, updateProgress) {
  try {
    updateProgress(10);
    const tab = await chrome.tabs.create({
      url: "https://www.quora.com/answer",
      active: false,
    });
    updateProgress(20);

    await new Promise((resolve) => setTimeout(resolve, 3000));
    updateProgress(30);

    const maxRetries = 3;
    const maxWaitTime = 30000;
    let retries = 0;

    while (retries < maxRetries) {
      try {
        updateProgress(40 + retries * 10);
        
        // 等待"Add question"按钮出现并点击
        await waitForElement(tab.id, 'button[aria-label="Add question"]', maxWaitTime);
        
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: async (content, images) => {
            // 点击"Add question"按钮
            const addQuestionBtn = document.querySelector('button[aria-label="Add question"]');
            if (addQuestionBtn) {
              addQuestionBtn.click();
              
              // 等待"Create Post" div 出现
              await new Promise(resolve => {
                const observer = new MutationObserver((mutations, obs) => {
                  const createPostDiv = Array.from(document.querySelectorAll('div.q-text')).find(
                    div => div.textContent === 'Create Post'
                  );
                  if (createPostDiv) {
                    createPostDiv.click();
                    obs.disconnect();
                    resolve();
                  }
                });
                
                observer.observe(document.body, {
                  childList: true,
                  subtree: true
                });
              });
              
              // 等待编辑器出现
              await new Promise(resolve => {
                const observer = new MutationObserver(async (mutations, obs) => {
                  const editor = document.querySelector('div[data-type="plain"].section');
                  if (editor) {
                    editor.focus();
                    editor.innerHTML = content;
                    editor.dispatchEvent(new Event('input', { bubbles: true }));

                    // 先断开 observer 避免触发额外的监听
                    obs.disconnect();
                    
                    // 图片上传放在 observer 之外处理
                    if (images && images.length > 0) {
                      // 添加延迟确保内容先被正确插入
                      await new Promise(r => setTimeout(r, 1000));
                      
                      // 批量处理所有图片
                      const imagePromises = images.map(async image => {
                        try {
                          const blob = await fetch(image).then(r => r.blob());
                          const file = new File([blob], "image.png", { type: "image/png" });
                          
                          const clipboardData = new DataTransfer();
                          clipboardData.items.add(file);
                          
                          const pasteEvent = new ClipboardEvent("paste", {
                            bubbles: true,
                            cancelable: true,
                            clipboardData: clipboardData
                          });
                          
                          editor.dispatchEvent(pasteEvent);
                          // 每张图片上传后添加短暂延迟
                          await new Promise(r => setTimeout(r, 500));
                        } catch (err) {
                          console.error('图片上传失败:', err);
                        }
                      });
                      
                      await Promise.all(imagePromises);
                    }
                    
                    resolve();
                  }
                });
                
                observer.observe(document.body, {
                  childList: true,
                  subtree: true
                });
              });
              
            } else {
              throw new Error("未找到Add question按钮");
            }
          },
          args: [content, selectedImages.map((img) => URL.createObjectURL(img))],
        });

        updateProgress(90);
        console.log("内容已同步到Quora");
        return;
      } catch (error) {
        console.error(`尝试 ${retries + 1} 失败:`, error);
        retries++;
        if (retries >= maxRetries) {
          throw new Error("同步到Quora失败，请稍后重试");
        }
        await new Promise((resolve) => setTimeout(resolve, 3000));
      }
    }
  } catch (error) {
    console.error("同步到Quora时出错:", error);
    throw error;
  }
}

async function syncToMastodon(content, updateProgress) {
  try {
    updateProgress(10);
    const tab = await chrome.tabs.create({
      url: "https://mastodon.social/deck/getting-started",
      active: false,
    });
    updateProgress(20);

    await new Promise((resolve) => setTimeout(resolve, 3000));
    updateProgress(30);

    const maxRetries = 3;
    const maxWaitTime = 30000;
    let retries = 0;

    while (retries < maxRetries) {
      try {
        updateProgress(40 + retries * 10);
        await waitForElement(tab.id, '.autosuggest-textarea__textarea', maxWaitTime);

        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: async (content, images) => {
            const contentEditor = document.querySelector('.autosuggest-textarea__textarea');
            if (contentEditor) {
              contentEditor.focus();
              contentEditor.innerHTML = content;
              contentEditor.dispatchEvent(new Event('input', { bubbles: true }));

              // 处理图片上传
              if (images && images.length > 0) {
                const imageInput = document.querySelector('input[type="file"]');
                if (imageInput) {
                  const dataTransfer = new DataTransfer();
                  for (const image of images) {
                    const blob = await fetch(image).then((r) => r.blob());
                    const file = new File([blob], "image.png", {
                      type: "image/png",
                    });
                    dataTransfer.items.add(file);
                  }
                  imageInput.files = dataTransfer.files;
                  imageInput.dispatchEvent(new Event("change", { bubbles: true }));
                  
                  // 等待图片上传完成
                  await new Promise(resolve => setTimeout(resolve, 2000 * images.length));
                }
              }
            } else {
              throw new Error("未找到内容编辑器");
            }
          },
          args: [content, selectedImages.map((img) => URL.createObjectURL(img))],
        });

        updateProgress(90);
        console.log("内容已同步到Mastodon");
        return;
      } catch (error) {
        console.error(`尝试 ${retries + 1} 失败:`, error);
        retries++;
        if (retries >= maxRetries) {
          throw new Error("同步到Mastodon失败，请稍后重试");
        }
        await new Promise((resolve) => setTimeout(resolve, 3000));
      }
    }
  } catch (error) {
    console.error("同步到Mastodon时出错:", error);
    throw error;
  }
}

// 头条号文章同步功能
async function syncToToutiaoArticle(content, updateProgress) {
  try {
    updateProgress(10);
    const tab = await chrome.tabs.create({
      url: "https://mp.toutiao.com/profile_v4/graphic/publish",
      active: false,
    });
    updateProgress(20);

    await new Promise((resolve) => setTimeout(resolve, 3000));
    updateProgress(30);

    const maxRetries = 3;
    const maxWaitTime = 30000;
    let retries = 0;

    while (retries < maxRetries) {
      try {
        updateProgress(40 + retries * 10);
        await waitForElement(tab.id, ".ProseMirror", maxWaitTime);

        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: async (content, images) => {
            const contentEditor = document.querySelector(".ProseMirror");

            if (contentEditor) {
              contentEditor.focus();

              // 使用 clipboard API 粘贴富文本内容
              const clipboardData = new DataTransfer();
              clipboardData.setData("text/html", content);
              const pasteEvent = new ClipboardEvent("paste", {
                clipboardData: clipboardData,
                bubbles: true,
                cancelable: true,
              });
              contentEditor.dispatchEvent(pasteEvent);
            } else {
              throw new Error("未找到内容编辑器");
            }
          },
          args: [
            content,
            selectedImages.map((img) => URL.createObjectURL(img)),
          ],
        });

        updateProgress(90);
        console.log("内容已同步到头条号文章");
        return;
      } catch (error) {
        console.error(`尝试 ${retries + 1} 失败:`, error);
        retries++;
        if (retries >= maxRetries) {
          throw new Error("同步到头条号文章失败，请稍后重试");
        }
        await new Promise((resolve) => setTimeout(resolve, 3000));
      }
    }
  } catch (error) {
    console.error("同步到头条号文章时出错:", error);
    throw error;
  }
}

// 微信公众号文章同步功能
async function syncToWechatArticle(content, updateProgress) {
  try {
    updateProgress(10);
    let tab = await chrome.tabs.create({
      url: "https://mp.weixin.qq.com",
      active: false,
    });
    updateProgress(20);

    await new Promise((resolve) => setTimeout(resolve, 3000));
    updateProgress(30);

    const maxRetries = 3;
    const maxWaitTime = 30000; // 最大等待时间30秒
    let retries = 0;

    while (retries < maxRetries) {
      try {
        updateProgress(40 + retries * 10);
        await waitForElement(tab.id, ".new-creation__menu-item", maxWaitTime);

        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: async (content, images) => {
            const menuItems = document.querySelectorAll(
              ".new-creation__menu-item"
            );
            if (menuItems.length > 0) {
              menuItems[0].click();
            } else {
              throw new Error("未找到文章发布按钮");
            }
          },
        });

        await new Promise((resolve) => setTimeout(resolve, 3000));

        const tabs = await chrome.tabs.query({
          active: true,
          lastFocusedWindow: true,
        });
        if (tabs.length > 0) {
          tab = tabs[0]; // 更新tab为新打开的标签页
        }

        // 在新标签页中执行内容插入
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: async (content, images) => {
            const iframe = document.querySelector("iframe");
            if (iframe) {
              const iframeDocument =
                iframe.contentDocument || iframe.contentWindow.document;
              const body = iframeDocument.body;
              body.innerHTML = content;
            } else {
              throw new Error("未找到内容编辑区域");
            }
          },
          args: [
            content,
            selectedImages.map((img) => URL.createObjectURL(img)),
          ],
        });

        updateProgress(90);
        console.log("内容已同步到微信公众号文章");
        return;
      } catch (error) {
        console.error(`尝试 ${retries + 1} 失败:`, error);
        retries++;
        if (retries >= maxRetries) {
          throw new Error("同步到微信公众号文章失败，请稍后重试");
        }
        await new Promise((resolve) => setTimeout(resolve, 3000));
      }
    }
  } catch (error) {
    console.error("同步到微信公众号文章时出错:", error);
    throw error;
  }
}

// 简书文章同步功能
async function syncToJianshuArticle(content, updateProgress) {
  try {
    updateProgress(10);
    const tab = await chrome.tabs.create({
      url: "https://www.jianshu.com/writer",
      active: false,
    });
    updateProgress(20);

    await new Promise((resolve) => setTimeout(resolve, 3000));
    updateProgress(30);

    const maxRetries = 3;
    const maxWaitTime = 30000; // 最大等待时间30秒
    let retries = 0;

    while (retries < maxRetries) {
      try {
        updateProgress(40 + retries * 10);
        await waitForElement(tab.id, "._1GsW5", maxWaitTime);

        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: async (content, images) => {
            // 点击新建文章按钮
            const newArticleButton = document.querySelector("._1GsW5");
            if (newArticleButton) {
              newArticleButton.click();
              await new Promise((resolve) => setTimeout(resolve, 2000));
            } else {
              throw new Error("未找到新建文章按钮");
            }

            // 聚焦到编辑器并粘贴内容
            const editor = document.querySelector("#editor div");
            if (editor) {
              editor.innerHTML = content;
            } else {
              throw new Error("未找到编辑器");
            }
          },
          args: [content, selectedImages.map(img => URL.createObjectURL(img))],
        });

        updateProgress(90);
        console.log("内容已同步到简书文章");
        return;
      } catch (error) {
        console.error(`尝试 ${retries + 1} 失败:`, error);
        retries++;
        if (retries >= maxRetries) {
          throw new Error("同步到简书文章失败，请稍后重试");
        }
        await new Promise((resolve) => setTimeout(resolve, 3000)); // 等待3秒后重试
      }
    }
  } catch (error) {
    console.error("同步到简书文章时出错:", error);
    throw error;
  }
}

// 企鹅号文章同步功能
async function syncToQQArticle(content, updateProgress) {
  try {
    updateProgress(10);
    const tab = await chrome.tabs.create({
      url: "https://om.qq.com/main/creation/article",
      active: false,
    });
    updateProgress(20);

    await new Promise((resolve) => setTimeout(resolve, 3000));
    updateProgress(30);

    const maxRetries = 3;
    const maxWaitTime = 30000;
    let retries = 0;

    while (retries < maxRetries) {
      try {
        updateProgress(40 + retries * 10);
        await waitForElement(tab.id, ".ProseMirror", maxWaitTime);

        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: async (content, images) => {
            const contentEditor = document.querySelector(".ProseMirror");
            if (contentEditor) {
              contentEditor.focus();
              
              // 使用 clipboard API 粘贴富文本内容
              const clipboardData = new DataTransfer();
              clipboardData.setData("text/html", content);
              const pasteEvent = new ClipboardEvent("paste", {
                clipboardData: clipboardData,
                bubbles: true,
                cancelable: true,
              });
              contentEditor.dispatchEvent(pasteEvent);

            } else {
              throw new Error("未找到内容编辑器");
            }
          },
          args: [content, selectedImages.map((img) => URL.createObjectURL(img))],
        });

        updateProgress(90);
        console.log("内容已同步到企鹅号文章");
        return;
      } catch (error) {
        console.error(`尝试 ${retries + 1} 失败:`, error);
        retries++;
        if (retries >= maxRetries) {
          throw new Error("同步到企鹅号文章失败，请稍后重试");
        }
        await new Promise((resolve) => setTimeout(resolve, 3000));
      }
    }
  } catch (error) {
    console.error("同步到企鹅号文章时出错:", error);
    throw error;
  }
}

// 哔哩哔哩文章同步功能
async function syncToBilibiliArticle(content, updateProgress) {
  try {
    updateProgress(10);
    const tab = await chrome.tabs.create({
      url: "https://member.bilibili.com/read/editor/#/web",
      active: false,
    });
    updateProgress(20);

    await new Promise((resolve) => setTimeout(resolve, 3000));
    updateProgress(30);

    const maxRetries = 3;
    const maxWaitTime = 30000;
    let retries = 0;

    while (retries < maxRetries) {
      try {
        updateProgress(40 + retries * 10);
        await waitForElement(tab.id, ".ql-editor", maxWaitTime);

        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: async (content, images) => {
            const contentEditor = document.querySelector(".ql-editor");
            if (contentEditor) {
              contentEditor.focus();
              contentEditor.innerHTML = content;
            } else {
              throw new Error("未找到内容辑器");
            }
          },
          args: [content, selectedImages.map((img) => URL.createObjectURL(img))],
        });

        updateProgress(90);
        console.log("内容已同步到哔哩哔哩文章");
        return;
      } catch (error) {
        console.error(`尝试 ${retries + 1} 失败:`, error);
        retries++;
        if (retries >= maxRetries) {
          throw new Error("同步到哔哩哔哩文章失败，请稍后重试");
        }
        await new Promise((resolve) => setTimeout(resolve, 3000));
      }
    }
  } catch (error) {
    console.error("同步到哔哩哔哩文章时出错:", error);
    throw error;
  }
}

// CSDN文章同步功能
async function syncToCSDNArticle(content, updateProgress) {
  try {
    updateProgress(10);
    const tab = await chrome.tabs.create({
      url: "https://mp.csdn.net/mp_blog/creation/editor",
      active: false,
    });
    updateProgress(20);

    await new Promise((resolve) => setTimeout(resolve, 3000));
    updateProgress(30);

    const maxRetries = 3;
    const maxWaitTime = 30000;
    let retries = 0;

    while (retries < maxRetries) {
      try {
        updateProgress(40 + retries * 10);
        await waitForElement(tab.id, "iframe", maxWaitTime);

        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: async (content, images) => {
            const iframe = document.querySelector("iframe");
            if (iframe) {
              const iframeDocument = iframe.contentDocument || iframe.contentWindow.document;
              const editorBody = iframeDocument.body;
              
              if (editorBody) {
                editorBody.focus();
                // 使用 clipboard API 粘贴富文本内容
                const clipboardData = new DataTransfer();
                clipboardData.setData("text/html", content);
                const pasteEvent = new ClipboardEvent("paste", {
                  clipboardData: clipboardData,
                  bubbles: true,
                  cancelable: true,
                });
                editorBody.dispatchEvent(pasteEvent);
                
              } else {
                throw new Error("未找到编辑器内容区域");
              }
            } else {
              throw new Error("未找到编辑器iframe");
            }
          },
          args: [content, selectedImages.map(img => URL.createObjectURL(img))],
        });

        updateProgress(90);
        console.log("内容已同步到CSDN文章");
        return;
      } catch (error) {
        console.error(`尝试 ${retries + 1} 失败:`, error);
        retries++;
        if (retries >= maxRetries) {
          throw new Error("同步到CSDN文章失败，请稍后重试");
        }
        await new Promise((resolve) => setTimeout(resolve, 3000));
      }
    }
  } catch (error) {
    console.error("同步到CSDN文章时出错:", error);
    throw error;
  }
}

// 掘金文章同步功能
async function syncToJuejinArticle(content, updateProgress) {
  try {
    updateProgress(10);
    const tab = await chrome.tabs.create({
      url: "https://juejin.cn/editor/drafts/new",
      active: false,
    });
    updateProgress(20);

    await new Promise((resolve) => setTimeout(resolve, 3000));
    updateProgress(30);

    const maxRetries = 3;
    const maxWaitTime = 30000;
    let retries = 0;

    while (retries < maxRetries) {
      try {
        updateProgress(40 + retries * 10);
        await waitForElement(tab.id, ".CodeMirror-scroll", maxWaitTime);

        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: async (content, images) => {
            const contentEditor = document.querySelector(".CodeMirror-scroll");
            if (contentEditor) {
              contentEditor.focus();
              
              // 使用 clipboard API 粘贴富文本内容
              const clipboardData = new DataTransfer();
              clipboardData.setData("text/html", content);
              const pasteEvent = new ClipboardEvent("paste", {
                clipboardData: clipboardData,
                bubbles: true,
                cancelable: true,
              });
              contentEditor.dispatchEvent(pasteEvent);

            } else {
              throw new Error("未找到内容编辑器");
            }
          },
          args: [content, selectedImages.map((img) => URL.createObjectURL(img))],
        });

        updateProgress(90);
        console.log("内容已同步到掘金文章");
        return;
      } catch (error) {
        console.error(`尝试 ${retries + 1} 失败:`, error);
        retries++;
        if (retries >= maxRetries) {
          throw new Error("同步到掘金文章失败，请稍后重试");
        }
        await new Promise((resolve) => setTimeout(resolve, 3000));
      }
    }
  } catch (error) {
    console.error("同步到掘金文章时出错:", error);
    throw error;
  }
}

// 博客园文章同步功能
async function syncToBokeyuanArticle(content, updateProgress) {
  try {
    updateProgress(10);
    const tab = await chrome.tabs.create({
      url: "https://i.cnblogs.com/posts/edit",
      active: false,
    });
    updateProgress(20);

    await new Promise((resolve) => setTimeout(resolve, 3000));
    updateProgress(30);

    const maxRetries = 3;
    const maxWaitTime = 30000;
    let retries = 0;

    while (retries < maxRetries) {
      try {
        updateProgress(40 + retries * 10);
        await waitForElement(tab.id, "iframe", maxWaitTime);

        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: async (content, images) => {
            const iframe = document.querySelector("iframe");
            if (iframe) {
              const iframeDocument = iframe.contentDocument || iframe.contentWindow.document;
              const editorBody = iframeDocument.body;
              
              if (editorBody) {
                editorBody.focus();
                editorBody.innerHTML = content;
                
              } else {
                throw new Error("未找到编辑器内容区域");
              }
            } else {
              throw new Error("未找到编辑器iframe");
            }
          },
          args: [content, selectedImages.map(img => URL.createObjectURL(img))],
        });

        updateProgress(90);
        console.log("内容已同步到博客园文章");
        return;
      } catch (error) {
        console.error(`尝试 ${retries + 1} 失败:`, error);
        retries++;
        if (retries >= maxRetries) {
          throw new Error("同步到博客园文章失败，请稍后重试");
        }
        await new Promise((resolve) => setTimeout(resolve, 3000));
      }
    }
  } catch (error) {
    console.error("同步到博客园文章时出错:", error);
    throw error;
  }
}

// 易号文章同步功能
async function syncToWangyiArticle(content, updateProgress) {
  try {
    updateProgress(10);
    const tab = await chrome.tabs.create({
      url: "https://mp.163.com/subscribe_v4/index.html#/article-publish",
      active: false,
    });
    updateProgress(20);

    await new Promise((resolve) => setTimeout(resolve, 3000));
    updateProgress(30);

    const maxRetries = 3;
    const maxWaitTime = 30000;
    let retries = 0;

    while (retries < maxRetries) {
      try {
        updateProgress(40 + retries * 10);
        await waitForElement(tab.id, "div [data-editor='wyh']", maxWaitTime);

        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: async (content, images) => {
            const contentEditor = document.querySelector("div [data-editor='wyh']");
            if (contentEditor) {
              contentEditor.click();
              contentEditor.focus();
              
              // 使用 clipboard API 粘贴富文本内容
              const clipboardData = new DataTransfer();
              clipboardData.setData("text/html", content);
              const pasteEvent = new ClipboardEvent("paste", {
                clipboardData: clipboardData,
                bubbles: true,
                cancelable: true,
              });
              contentEditor.dispatchEvent(pasteEvent);

            } else {
              throw new Error("未找到内容编辑器");
            }
          },
          args: [content, selectedImages.map((img) => URL.createObjectURL(img))],
        });

        updateProgress(90);
        console.log("内容已同步到网易号文章");
        return;
      } catch (error) {
        console.error(`尝试 ${retries + 1} 失败:`, error);
        retries++;
        if (retries >= maxRetries) {
          throw new Error("同步到网易号文章失败，请稍后重试");
        }
        await new Promise((resolve) => setTimeout(resolve, 3000));
      }
    }
  } catch (error) {
    console.error("同步到网易号文章时出错:", error);
    throw error;
  }
}

// 搜狐号文章同步功能
async function syncToSohuArticle(content, updateProgress) {
  try {
    updateProgress(10);
    const tab = await chrome.tabs.create({
      url: "https://mp.sohu.com/mpfe/v4/contentManagement/news/addarticle",
      active: false,
    });
    updateProgress(20);

    await new Promise((resolve) => setTimeout(resolve, 3000));
    updateProgress(30);

    const maxRetries = 3;
    const maxWaitTime = 30000;
    let retries = 0;

    while (retries < maxRetries) {
      try {
        updateProgress(40 + retries * 10);
        await waitForElement(tab.id, ".ql-editor", maxWaitTime);

        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: async (content, images) => {
            const contentEditor = document.querySelector(".ql-editor");
            if (contentEditor) {
              contentEditor.focus();
              contentEditor.innerHTML = content;
              
            } else {
              throw new Error("未找到内容编辑器");
            }
          },
          args: [content, selectedImages.map((img) => URL.createObjectURL(img))],
        });

        updateProgress(90);
        console.log("内容已同步到搜狐号文章");
        return;
      } catch (error) {
        console.error(`尝试 ${retries + 1} 失败:`, error);
        retries++;
        if (retries >= maxRetries) {
          throw new Error("同步到搜狐号文章失败，请稍后重试");
        }
        await new Promise((resolve) => setTimeout(resolve, 3000));
      }
    }
  } catch (error) {
    console.error("同步到搜狐号文章时出错:", error);
    throw error;
  }
}

// 51cto文章同步功能
async function syncTo51ctoArticle(content, updateProgress) {
  try {
    updateProgress(10);
    const tab = await chrome.tabs.create({
      url: "https://blog.51cto.com/blogger/publish?old=1",
      active: false,
    });
    updateProgress(20);

    await new Promise((resolve) => setTimeout(resolve, 3000));
    updateProgress(30);

    const maxRetries = 3;
    const maxWaitTime = 30000;
    let retries = 0;

    while (retries < maxRetries) {
      try {
        updateProgress(40 + retries * 10);
        await waitForElement(tab.id, ".editor-container", maxWaitTime);

        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: async (content, images) => {
            const contentEditor = document.querySelector(".editor-container");
            if (contentEditor) {
              contentEditor.click();
              contentEditor.focus();
              
              // 使用 clipboard API 粘贴富文本内容
              const clipboardData = new DataTransfer();
              clipboardData.setData("text/html", content);
              const pasteEvent = new ClipboardEvent("paste", {
                clipboardData: clipboardData,
                bubbles: true,
                cancelable: true,
              });
              contentEditor.dispatchEvent(pasteEvent);

            } else {
              throw new Error("未找到内容编辑器");
            }
          },
          args: [content, selectedImages.map((img) => URL.createObjectURL(img))],
        });

        updateProgress(90);
        console.log("内容已同步到51cto文章");
        return;
      } catch (error) {
        console.error(`尝试 ${retries + 1} 失败:`, error);
        retries++;
        if (retries >= maxRetries) {
          throw new Error("同步到51cto文章失败，请稍后重试");
        }
        await new Promise((resolve) => setTimeout(resolve, 3000));
      }
    }
  } catch (error) {
    console.error("同步到51cto文章时出错:", error);
    throw error;
  }
}

// Medium文章同步功能
async function syncToMediumArticle(content, updateProgress) {
  try {
    updateProgress(10);
    const tab = await chrome.tabs.create({
      url: "https://medium.com/new-story",
      active: false,
    });
    updateProgress(20);

    await new Promise((resolve) => setTimeout(resolve, 3000));
    updateProgress(30);

    const maxRetries = 3;
    const maxWaitTime = 30000;
    let retries = 0;

    while (retries < maxRetries) {
      try {
        updateProgress(40 + retries * 10);
        await waitForElement(tab.id, '[data-testid="editorParagraphText"]', maxWaitTime);

        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: async (content, images) => {
            const contentEditor = document.querySelector('[data-testid="editorParagraphText"]');
            if (contentEditor) {
              contentEditor.focus();
              
              // 使用 clipboard API 粘贴富文本内容
              const clipboardData = new DataTransfer();
              clipboardData.setData("text/html", content);
              const pasteEvent = new ClipboardEvent("paste", {
                clipboardData: clipboardData,
                bubbles: true,
                cancelable: true,
              });
              contentEditor.dispatchEvent(pasteEvent);

            } else {
              throw new Error("未找到内容编辑器");
            }
          },
          args: [content, selectedImages.map((img) => URL.createObjectURL(img))],
        });

        updateProgress(90);
        console.log("内容已同步到Medium文章");
        return;
      } catch (error) {
        console.error(`尝试 ${retries + 1} 失败:`, error);
        retries++;
        if (retries >= maxRetries) {
          throw new Error("同步到Medium文章失败，请稍后重试");
        }
        await new Promise((resolve) => setTimeout(resolve, 3000));
      }
    }
  } catch (error) {
    console.error("同步到Medium文章时出错:", error);
    throw error;
  }
}

// 知乎文章同步功能
async function syncToZhihuArticle(content, updateProgress) {
  try {
    updateProgress(10);
    const tab = await chrome.tabs.create({
      url: "https://zhuanlan.zhihu.com/write",
      active: false,
    });
    updateProgress(20);

    await new Promise((resolve) => setTimeout(resolve, 3000));
    updateProgress(30);

    const maxRetries = 3;
    const maxWaitTime = 30000;
    let retries = 0;

    while (retries < maxRetries) {
      try {
        updateProgress(40 + retries * 10);
        await waitForElement(tab.id, ".Editable-unstyled", maxWaitTime);

        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: async (content, images) => {
            const contentEditor = document.querySelector(".Editable-unstyled");
            if (contentEditor) {
              contentEditor.focus();
              
              // 使用 clipboard API 粘贴富文本内容
              const clipboardData = new DataTransfer();
              clipboardData.setData("text/html", content);
              const pasteEvent = new ClipboardEvent("paste", {
                clipboardData: clipboardData,
                bubbles: true,
                cancelable: true,
              });
              contentEditor.dispatchEvent(pasteEvent);

            } else {
              throw new Error("未找到内容编辑器");
            }
          },
          args: [content, selectedImages.map((img) => URL.createObjectURL(img))],
        });

        updateProgress(90);
        console.log("内容已同步到知乎文章");
        return;
      } catch (error) {
        console.error(`尝试 ${retries + 1} 失败:`, error);
        retries++;
        if (retries >= maxRetries) {
          throw new Error("同步到知乎文章失败，请稍后重试");
        }
        await new Promise((resolve) => setTimeout(resolve, 3000));
      }
    }
  } catch (error) {
    console.error("同步到知乎文章时出错:", error);
    throw error;
  }
}

// 初始化显示动态平台
showPlatforms("dynamic");

// 在登录成功后显示激活码输入框
function showActivationCodeInput(show) {
  const activationCodeContainer = document.getElementById('activation-code-container');
  if (activationCodeContainer) {
    activationCodeContainer.style.display = show ? 'block' : 'none';
  }
}

// 添加激活码处理逻辑
document.getElementById('activate-code-btn').addEventListener('click', async () => {
  const activateBtn = document.getElementById('activate-code-btn');
  const code = document.getElementById('activation-code').value;
  
  if (!code) {
    alert(window.translations.enterCode.message);
    return;
  }
  
  try {
    activateBtn.disabled = true;
    activateBtn.textContent = window.translations.activating.message;
    
    const discountInfo = await validateDiscountCode(code);
    const userData = JSON.parse(localStorage.getItem('userData'));
    
    await activateDiscountCode(userData.email, code, discountInfo.usable_date);
    alert(window.translations.activateSuccess.message);
    
  } catch (error) {
    alert(error.message);
  } finally {
    activateBtn.disabled = false;
    activateBtn.textContent = window.translations.activate.message;
  }
});

// 平台拖拽排序功能
function initPlatformDragSort() {
  const platformContainers = document.querySelectorAll('.platforms');
  
  platformContainers.forEach(container => {
    const platforms = container.querySelectorAll('.platform');
    
    platforms.forEach(platform => {
      // 开始拖动
      platform.addEventListener('dragstart', (e) => {
        e.target.classList.add('dragging');
        e.dataTransfer.setData('text/plain', e.target.dataset.platformId);
      });
      
      // 结束拖动
      platform.addEventListener('dragend', (e) => {
        e.target.classList.remove('dragging');
      });
      
      // 拖动经过其他平台
      platform.addEventListener('dragover', (e) => {
        e.preventDefault();
        const draggingPlatform = container.querySelector('.dragging');
        if (draggingPlatform === platform) return;
        
        const afterElement = getDragAfterElement(container, e.clientX, e.clientY);
        if (afterElement) {
          container.insertBefore(draggingPlatform, afterElement);
        } else {
          container.appendChild(draggingPlatform);
        }
      });
      
      // 放置
      platform.addEventListener('drop', (e) => {
        e.preventDefault();
        savePlatformsOrder(container);
      });
    });
  });
}

// 获取拖动后应该插入的位置
function getDragAfterElement(container, x, y) {
  const draggableElements = [...container.querySelectorAll('.platform:not(.dragging)')];
  
  return draggableElements.reduce((closest, child) => {
    const box = child.getBoundingClientRect();
    const offsetY = y - box.top - box.height / 2;
    const offsetX = x - box.left - box.width / 2;
    
    // 计算拖动元素中心点到目标元素中心点的距离
    const distance = Math.sqrt(offsetX * offsetX + offsetY * offsetY);
    
    // 如果当前距离比之前记录的最近距离更近，则更新
    if (distance < closest.distance) {
      return { distance: distance, element: child };
    } else {
      return closest;
    }
  }, { distance: Number.POSITIVE_INFINITY }).element;
}

// 保存平台排序
function savePlatformsOrder(container) {
  const platforms = container.querySelectorAll('.platform');
  const order = Array.from(platforms).map(p => p.dataset.platformId);
  
  const containerClass = container.classList[1]; // 获取platforms-type类名
  chrome.storage.sync.set({
    [`platformOrder_${containerClass}`]: order
  });
}

// 加载保存的平台排序
function loadPlatformsOrder() {
  const platformContainers = document.querySelectorAll('.platforms');
  
  platformContainers.forEach(container => {
    const containerClass = container.classList[1];
    chrome.storage.sync.get([`platformOrder_${containerClass}`], (result) => {
      const savedOrder = result[`platformOrder_${containerClass}`];
      if (!savedOrder) return;
      
      const platforms = Array.from(container.querySelectorAll('.platform'));
      const orderedPlatforms = savedOrder
        .map(id => platforms.find(p => p.dataset.platformId === id))
        .filter(Boolean);
        
      // 清空容器
      container.innerHTML = '';
      // 按保存的顺序重新添加平台
      orderedPlatforms.forEach(platform => {
        container.appendChild(platform);
      });
    });
  });
}

// 初始化平台排序
async function initializePlatformOrder() {
  const platformContainers = document.querySelectorAll('.platforms');
  
  platformContainers.forEach(async container => {
    const containerClass = container.classList[1]; // 获取platforms-type类名
    const platforms = container.querySelectorAll('.platform');
    
    // 获取保存的排序
    const result = await chrome.storage.sync.get([`platformOrder_${containerClass}`]);
    const savedOrder = result[`platformOrder_${containerClass}`];
    
    if (savedOrder) {
      // 检查是否有新增平台
      const currentPlatformIds = Array.from(platforms).map(p => p.dataset.platformId);
      
      // 找出新增的平台ID
      const newPlatformIds = currentPlatformIds.filter(id => !savedOrder.includes(id));
      
      // 如果有新增平台，将它们添加到已保存顺序的末尾
      if (newPlatformIds.length > 0) {
        const updatedOrder = [...savedOrder, ...newPlatformIds];
        // 保存更新后的顺序
        await chrome.storage.sync.set({ 
          [`platformOrder_${containerClass}`]: updatedOrder 
        });
        
        // 按新顺序重新排列平台
        updatedOrder.forEach(platformId => {
          const platform = container.querySelector(`[data-platform-id="${platformId}"]`);
          if (platform) {
            container.appendChild(platform);
          }
        });
      }
    } else {
      // 如果没有保存的顺序，保存当前顺序
      const currentOrder = Array.from(platforms).map(p => p.dataset.platformId);
      await chrome.storage.sync.set({ 
        [`platformOrder_${containerClass}`]: currentOrder 
      });
    }
  });
}

// 在文件中添加刷新功能
function clearAll(type = 'dynamic') {
    // 获取刷新按钮并添加旋转动画
    const refreshButton = document.getElementById(type === 'dynamic' ? 'refreshButton' : 'articleRefreshButton');
    refreshButton.classList.add('rotating');
    
    if (type === 'dynamic') {
        // 清除动态文本内容
        const dynamicTexts = document.querySelectorAll('.dynamic-text');
        dynamicTexts.forEach(text => text.value = '');
        
        // 清除动态图片预览
        selectedImages = [];
        const imagePreview = document.getElementById('imagePreview');
        if (imagePreview) imagePreview.innerHTML = '';
    } else {
        // 清除富文本编辑器内容
        if (window.quillEditors) {
            Object.values(window.quillEditors).forEach(editor => {
                editor.setText('');
            });
        }
        
        // 清除文章图片预览
        selectedImages = [];
        const articleImagePreview = document.getElementById('articleImagePreview');
        if (articleImagePreview) articleImagePreview.innerHTML = '';
    }
    
    // 取消选中所有平台
    const platformCheckboxes = document.querySelectorAll('input[name="platform"]');
    platformCheckboxes.forEach(checkbox => checkbox.checked = false);
    
    // 取消全选
    const selectAllCheckbox = document.getElementById('selectAll');
    if (selectAllCheckbox) selectAllCheckbox.checked = false;
    
    // 重置所有进度条
    const progressIndicators = document.querySelectorAll('.progress-indicator');
    progressIndicators.forEach(indicator => {
        indicator.style.width = '0%';
    });
    
    // 1秒后移除旋转动画
    setTimeout(() => {
        refreshButton.classList.remove('rotating');
    }, 1000);
}

// 添加刷新按钮点击事件监听
document.addEventListener('DOMContentLoaded', () => {
  const refreshButton = document.getElementById('refreshButton');
  const articleRefreshButton = document.getElementById('articleRefreshButton');
  
  if (refreshButton) {
      refreshButton.addEventListener('click', () => clearAll('dynamic'));
  }
  
  if (articleRefreshButton) {
      articleRefreshButton.addEventListener('click', () => clearAll('article'));
  }
});