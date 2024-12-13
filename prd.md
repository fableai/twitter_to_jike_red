动态发布一键同步多平台

1. 用户在推特创建动态时,获取动态内容文本图片内容，同步到即刻、小红书、flomo；
2. 在推特动态输入框按钮下发增加 复选框选项 选择同步平台（即刻、小红书、flomo）；直接发布开关； 一键同步按钮
3. 直接发布开关：控制发布方式，关闭同步内容但不发布、开启同步内容并模拟点击发布按钮发布）
4. 点击 一键 同步后 获取内容同步至选择的平台
5. 同步处理函数和获取位置、发布异常处理逻辑可参考 #@chrome_extention.js

其他有用信息：
- syncToJike即刻发布动态网址：https://web.okjike.com/
- syncToTwitter推特发布动态网址：https://x.com/home

- 推特发布动态输入框位置参考：//*[@id="react-root"]/div/div/div[2]/main/div/div/div/div[1]/div/div[3]/div/div[2]/div[1]/div/div/div/div[2]
- 即刻发布动态输入框位置参考：//*[@id="__next"]/div/div/div[2]/div/div[1]/div[1]/textarea