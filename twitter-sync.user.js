// ==UserScript==
// @name         Twitter Cross-Platform Sync
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Sync Twitter posts to Jike, Xiaohongshu, and Flomo
// @author       Devin
// @match        https://x.com/*
// @match        https://twitter.com/*
// @grant        GM_xmlhttpRequest
// @grant        GM_addStyle
// @run-at       document-end
// ==/UserScript==

(function() {
    'use strict';

    GM_addStyle(`
        .sync-container {
            display: flex;
            flex-direction: column;
            gap: 0.75rem;
            padding: 1rem;
            border-top: 1px solid hsl(214.3 31.8% 91.4%);
            background-color: hsl(0 0% 100%);
        }

        .platform-select {
            display: flex;
            gap: 1rem;
            align-items: center;
        }

        .sync-checkbox {
            width: 1rem;
            height: 1rem;
            border-radius: 0.25rem;
            border: 1px solid hsl(215.4 16.3% 46.9%);
            background-color: hsl(0 0% 100%);
            cursor: pointer;
        }

        .sync-checkbox:checked {
            background-color: hsl(222.2 47.4% 11.2%);
            border-color: hsl(222.2 47.4% 11.2%);
        }

        .sync-toggle {
            position: relative;
            display: inline-flex;
            align-items: center;
            cursor: pointer;
        }

        .sync-toggle input {
            opacity: 0;
            width: 0;
            height: 0;
        }

        .toggle-slider {
            position: relative;
            display: inline-block;
            width: 2.5rem;
            height: 1.5rem;
            background-color: hsl(215.4 16.3% 46.9%);
            border-radius: 1rem;
            transition: background-color 150ms;
        }

        .toggle-slider:before {
            content: "";
            position: absolute;
            height: 1.25rem;
            width: 1.25rem;
            left: 0.125rem;
            bottom: 0.125rem;
            background-color: white;
            border-radius: 50%;
            transition: transform 150ms;
        }

        .sync-toggle input:checked + .toggle-slider {
            background-color: hsl(222.2 47.4% 11.2%);
        }

        .sync-toggle input:checked + .toggle-slider:before {
            transform: translateX(1rem);
        }

        .sync-button {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            border-radius: 0.5rem;
            font-weight: 500;
            transition-property: color, background-color, border-color;
            transition-duration: 150ms;
            padding: 0.5rem 1rem;
            background-color: hsl(222.2 47.4% 11.2%);
            color: hsl(210 40% 98%);
            cursor: pointer;
            border: none;
        }

        .sync-button:hover {
            background-color: hsl(222.2 47.4% 8.2%);
        }

        .sync-button:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }

        @media (prefers-color-scheme: dark) {
            .sync-container {
                background-color: hsl(222.2 84% 4.9%);
                border-color: hsl(217.2 32.6% 17.5%);
            }

            .sync-checkbox {
                background-color: hsl(222.2 84% 4.9%);
                border-color: hsl(217.2 32.6% 17.5%);
            }

            .sync-button {
                background-color: hsl(210 40% 98%);
                color: hsl(222.2 47.4% 11.2%);
            }

            .sync-button:hover {
                background-color: hsl(210 40% 96%);
            }
        }
    `);

    const PLATFORM_CONFIGS = {
        jike: {
            url: 'https://web.okjike.com',
            selector: '//*[@id="__next"]/div/div/div[2]/div/div[1]/div[1]/textarea'
        },
        xiaohongshu: {
            url: 'https://creator.xiaohongshu.com/publish/publish?source=official',
            selector: '//*[@id="web"]/div/div/div/div[2]/div[1]/div/input'
        },
        flomo: {
            url: 'https://v.flomoapp.com/mine',
            selector: '//*[@id="fl_editor"]/div[1]/div'
        }
    };

    async function waitForElement(selector, maxWaitTime = 30000) {
        const startTime = Date.now();
        while (Date.now() - startTime < maxWaitTime) {
            const element = document.evaluate(selector, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
            if (element) return element;
            await new Promise(resolve => setTimeout(resolve, 500));
        }
        throw new Error(`等待元素超时: ${selector}`);
    }

    async function syncToPlatform(content, images, platform) {
        const config = PLATFORM_CONFIGS[platform];
        if (!config) throw new Error(`不支持的平台: ${platform}`);

        const maxRetries = 3;
        let retries = 0;

        while (retries < maxRetries) {
            try {
                const win = window.open(config.url, '_blank');
                if (!win) throw new Error('无法打开新窗口，请检查是否被浏览器阻止');

                await new Promise(resolve => setTimeout(resolve, 5000));

                const script = `
                    (async function() {
                        try {
                            const editor = await waitForElement('${config.selector}');
                            editor.value = ${JSON.stringify(content)};
                            editor.dispatchEvent(new Event('input', { bubbles: true }));

                            ${images && images.length > 0 ? `
                            const images = ${JSON.stringify(images)};
                            for (const imageUrl of images) {
                                const response = await fetch(imageUrl);
                                const blob = await response.blob();
                                const file = new File([blob], 'image.png', { type: 'image/png' });

                                const clipboardData = new DataTransfer();
                                clipboardData.items.add(file);

                                const pasteEvent = new ClipboardEvent('paste', {
                                    bubbles: true,
                                    cancelable: true,
                                    clipboardData: clipboardData
                                });

                                editor.dispatchEvent(pasteEvent);
                            }
                            ` : ''}
                            return true;
                        } catch (error) {
                            console.error('同步失败:', error);
                            return false;
                        }
                    })();
                `;

                await new Promise((resolve, reject) => {
                    GM_xmlhttpRequest({
                        method: 'GET',
                        url: config.url,
                        onload: async function(response) {
                            try {
                                win.eval(`
                                    ${waitForElement.toString()}
                                    ${script}
                                `);
                                resolve();
                            } catch (error) {
                                reject(error);
                            }
                        },
                        onerror: reject
                    });
                });

                console.log(`内容已同步到${platform}`);
                return;
            } catch (error) {
                console.error(`同步到${platform}失败 (尝试 ${retries + 1}/${maxRetries}):`, error);
                retries++;
                if (retries >= maxRetries) {
                    throw new Error(`同步到${platform}失败，请稍后重试`);
                }
                await new Promise(resolve => setTimeout(resolve, 3000));
            }
        }
    }

    // 主同步逻辑
    async function handleSync() {
        try {
            // 获取推特输入框内容
            const tweetBox = document.querySelector('[data-testid="tweetTextarea_0"]');
            if (!tweetBox) throw new Error('未找到推特输入框');
            const content = tweetBox.textContent;

            // 获取选中的图片
            const imageContainer = document.querySelector('[data-testid="attachments"]');
            const images = imageContainer ?
                Array.from(imageContainer.querySelectorAll('img')).map(img => img.src) :
                [];

            // 获取选中的平台
            const selectedPlatforms = Array.from(document.querySelectorAll('.sync-checkbox:checked'))
                .map(cb => cb.value);

            if (selectedPlatforms.length === 0) {
                throw new Error('请选择至少一个同步平台');
            }

            // 同步到选中的平台
            for (const platform of selectedPlatforms) {
                try {
                    await syncToPlatform(content, images, platform);
                } catch (error) {
                    console.error(`同步到 ${platform} 失败:`, error);
                    // 继续同步其他平台
                }
            }

            // 如果开启了直接发布，点击推特发布按钮
            const directPublish = document.getElementById('directPublish');
            if (directPublish && directPublish.checked) {
                const tweetButton = document.querySelector('[data-testid="tweetButton"]');
                if (tweetButton) {
                    tweetButton.click();
                }
            }

            console.log('同步完成');
        } catch (error) {
            console.error('同步过程出错:', error);
            alert(error.message);
        }
    }

    function injectSyncUI() {
        const tweetBox = document.querySelector('[data-testid="tweetTextarea_0"]');
        if (!tweetBox) return;

        const container = document.createElement('div');
        container.className = 'sync-container';
        container.innerHTML = `
            <div class="platform-select">
                <label><input type="checkbox" class="sync-checkbox" value="jike"> 即刻</label>
                <label><input type="checkbox" class="sync-checkbox" value="xiaohongshu"> 小红书</label>
                <label><input type="checkbox" class="sync-checkbox" value="flomo"> Flomo</label>
            </div>
            <div class="publish-control">
                <label class="sync-toggle">
                    <input type="checkbox" id="directPublish">
                    <span class="toggle-slider"></span>
                    <span style="margin-left: 0.5rem;">直接发布</span>
                </label>
            </div>
            <button class="sync-button">一键同步</button>
        `;

        const tweetBoxContainer = tweetBox.closest('[data-testid="tweetTextarea_0_container"]');
        if (tweetBoxContainer) {
            tweetBoxContainer.parentElement.insertBefore(container, tweetBoxContainer.nextSibling);
        }
    }

    const observer = new MutationObserver(() => {
        if (window.location.pathname === '/compose/tweet' ||
            window.location.pathname === '/home') {
            const existingContainer = document.querySelector('.sync-container');
            if (!existingContainer) {
                injectSyncUI();
                addEventListeners();
            }
        }
    });

    observer.observe(document.body, { childList: true, subtree: true });

    if (window.location.pathname === '/compose/tweet' ||
        window.location.pathname === '/home') {
        injectSyncUI();
        addEventListeners();
    }

    console.log('Twitter Cross-Platform Sync script loaded');
})();
