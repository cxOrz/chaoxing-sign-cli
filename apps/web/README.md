# chaoxing-sign-ui

基于 React.js, 使用 Material UI 组件库构建。作为 [chaoxing-sign-cli](https://github.com/cxOrz/chaoxing-sign-cli) 的客户端，欢迎对本仓库代码进行二次开发。

> 注意：本页面只针对此前端项目进行介绍，如需搭配服务端使用，请移步 [这里](https://github.com/cxOrz/chaoxing-sign-cli#%E8%BF%90%E8%A1%8C%E6%8E%A5%E5%8F%A3%E6%9C%8D%E5%8A%A1) 。

## 描述

流程：克隆项目 -> 安装依赖 -> 构建项目 -> 部署

命令描述：

- `yarn install` ，安装依赖，如果时间太长请尝试挂代理或使用淘宝源。
- `yarn dev` ，启动开发服务器，不要忘记把接口服务(另一个仓库)也运行起来。
- `yarn build` ，构建项目，输出到 dist 文件夹。

## 配置

`src/config/api.ts` ：该文件中配置 `baseUrl` 变量为接口地址，默认 `http://localhost:5000` 。若接口部署在服务器，不要忘记将接口地址改为服务器IP或绑定的域名。

`src/pages/DashBoard/Helper.ts` ：若使用腾讯云的通用文字识别服务，二维码识别成功率极高，支持PNG、JPG、JPEG、PDF等格式，图片大小不能超过7M。查看此源码文件中的 parseEnc 函数，可注释掉默认函数，使用推荐函数，同时需要在CLI项目中的 `env.json` 中配置 `secretId` 和 `secretKey`。

## 最佳实践

使用 [腾讯云开发-静态网站托管](https://console.cloud.tencent.com/tcb/hosting)，将构建的网页部署进去。

步骤：
1. 确认已进行过必要的配置，例如接口地址、文字识别服务。
2. 在本地的项目目录下运行 `yarn build` 或 `npm run build` ，将构建网页并输出到 dist 目录下。
3. 将 dist 目录内的所有内容（不包括dist文件夹），在静态网站托管页面上传。
4. 通过云开发的默认域名即可访问。

![](https://cxorz.blob.core.windows.net/static-files/tcb-hosting.png)

## 贡献

本项目按照个人意愿进行开发，一些功能以及设计带有个人主观的想法。发起 pr 之前务必先发起issue进行讨论，之后新建一个分支(以提供的功能命名），并在此分支完成你的代码即可提交 pr。请务必保持代码整洁和 commit 规范。

## 展示

演示地址：https://prod.d6afmntd8nh5y.amplifyapp.com （部署在香港，较慢，仅供演示）

![](https://cxorz.blob.core.windows.net/static-files/ui-start.png)
![](https://cxorz.blob.core.windows.net/static-files/ui-qrcode-sign.png)

## 免责声明

本项目仅作为交流学习使用，通过本项目加深网络通信、接口编写、交互设计等方面知识的理解，请勿用作商业用途，任何人或组织使用项目中代码进行的任何违法行为与本人无关。
