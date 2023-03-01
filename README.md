<h1 align="center">🌿超星学习通签到🌿</h1>

![NodeJS](https://img.shields.io/badge/node.js-6DA55F?style=for-the-badge&logo=node.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)
![Licence](https://img.shields.io/github/license/cxOrz/chaoxing-sign-cli?style=for-the-badge)

基于 Nodejs 实现的一个命令行签到工具，在此基础上使用 React.js + Material UI + Koa 扩展成为 Web 项目。

**功能**： 普通签到、拍照签到、手势签到、位置签到、签到码签到、二维码签到（10秒变换不影响），多用户凭据储存，IM 协议自动签到。

## 环境 💻

可在任意运行 [NodeJS](https://nodejs.org/en/) > v18.14 的平台签到，Windows、MacOS、Linux ... 

安卓手机上可以用 Termux 来运行NodeJS程序，[查看Termux教程](./apps/server/src/docs/termux.md) 。

苹果手机请查看 [高级](https://github.com/cxOrz/chaoxing-sign-cli#%E9%AB%98%E7%BA%A7-) 部分，通过这种方式来使用，当然这种方式也适用于其他。

## 部署 🛠

将仓库克隆到本地

```bash
git clone https://github.com/cxOrz/chaoxing-sign-cli.git
```

进入项目文件夹，并安装依赖

```bash
cd chaoxing-sign-cli
pnpm install
```

## 运行 ⚙

### 命令解释

根目录下：
- `pnpm build`：转译源码，输出到 build 文件夹；必须先转译才能运行程序；
- `pnpm serve`：启动接口、前端服务；
- `pnpm dev:serve`：以开发模式启动接口、启动前端服务并自动在浏览器打开页面；

apps/server 目录下：
- `pnpm start`：运行程序，若有签到则手动完成，若无则退出程序；
- `pnpm serve`：启动接口；
- `pnpm monitor`：监听模式，检测到签到将自动签上，无需人工干预；

### 基本使用方式

更新仓库代码之后，先构建
```bash
pnpm build
```
构建完成，后续的运行直至下次变更代码，不需要再构建，可以直接运行
```bash
pnpm start
```

【注意】对 apps/server/src 目录下任何文件做出修改后，需重新构建才可生效！

## 使用须知 📄

为了节约资源，只对2小时以内的活动签到。若同时有多个有效签到活动，只签最新发布的。将结束的课程移入其他文件夹，减少根目录的课程能够提高活动检测速度。

### 二维码签到

在运行之前需要做些准备，请找一位挚友，拍一张二维码的照片（无所谓几秒一变），识别二维码，得到一个字符串，复制其中的 `enc` 参数值，例如 `1D0A628CK317F44CCC378M5KD92`，询问时填入。若使用 UI 仓库的项目(查看`高级`)，可以直接选择图片并自动解析得到enc参数。

### 位置签到

根据运行时的提示输入**经纬度**和**详细地址**，经纬度在这里获取 [百度拾取坐标系统](https://api.map.baidu.com/lbsapi/getpoint/index.html)，点击某位置，经纬度将出现在网页右上方，复制该值，询问时填入。详细地址样例：河南省郑州市中原区华中师范大学附属郑州万科城小学，该地址将显示在教师端。

### 拍照签到

需要事先准备一张用来提交的照片。浏览器访问超星云盘：https://pan-yz.chaoxing.com ，在根目录上传一张你准备的照片，命名为 `0.jpg` 或 `0.png` 。若使用 UI 仓库的项目(查看`高级`)，不需要上传云盘，可以直接选择图片提交签到。

### 普通签到&手势签到&签到码签到

没有需要准备的，直接运行即可。

### 监听模式

每次需要时启用2-4小时较为合适，请勿挂着不关。

## 高级 🎲

以上内容介绍了最基本的用法，接下来介绍一些稍高级一些的使用方法。

### 前端界面

访问 [这里](https://github.com/cxOrz/chaoxing-sign-ui) 查看前端代码如何部署，使用前端页面需要部署好接口才能正常工作。

### 接口服务

运行 `pnpm serve` 将启动接口服务，接下来描述每个接口的参数以及调用方式：

<details>
<summary>展开接口详情</summary>

|路径|请求方式|参数|内容类型|返回内容|
|-|-|-|-|-|
|/|GET|无|无|\< String \>|
|/login|POST|phone, password|JSON|\< String \>|
|/activity|POST|uf, _d, vc3, uid|JSON|JSON|
|/uvtoken|POST|uf, _d, vc3, uid|JSON|\< String \>|
|/qrcode|POST|uf, _d, vc3, name, activeId, uid, fid, enc|JSON|待填|
|/location|POST|uf, _d, vc3, name, activeId, uid, fid, address, lat, lon|JSON|待填|
|/general|POST|uf, _d, vc3, name, activeId, uid, fid|JSON|待填|
|/photo|POST|uf, _d, vc3, name, activeId, uid, fid, objectId|JSON|待填|
|/upload|POST|uf, _d, vc3, uid, file, ?_token|multipart/form-data|待填|
|/qrocr|POST|file|multipart/form-data|\< String \>|
|/monitor/status|POST|phone|JSON|JSON|
|/monitor/start|POST|phone, uf, _d, vc3, uid, lv, fid|JSON|JSON|
|/monitor/stop|POST|phone|JSON|JSON|

</details>

### 最佳实践

在这里介绍部署接口的最佳方式，前端部署的最佳实践请到它对应的仓库查看。

部署在服务器，步骤如下：

1. 安装 Node 环境，推荐使用 LTS 版本
2. 克隆代码 `git clone https://github.com/cxOrz/chaoxing-sign-cli.git`
3. 进入项目根目录，安装依赖
4. 配置项目的 env.json 文件（可选）
5. 转译源码 `pnpm build`
6. 最后，使用 GNU Screen 或者 PM2 运行接口服务

还有一些事情必需知道：

- 如果要通过UI点击按钮启动监听功能，则要在运行接口服务之前，先运行多次 `pnpm monitor` 来配置每一个使用监听的用户的信息（一个用户一份配置，不配置无法使用UI启动监听），看到 "监听中"，即可终止程序，该用户信息已经写入本地。配置完成后，就可以运行 `pnpm serve` 来启动接口了。
- 如果使用腾讯文字识别来解析二维码，请在 `src/env.json` 文件中配置 secretId 和 secretKey，然后重新构建代码。

<details>
<summary>使用云函数注意事项</summary>

1. 此项目可以运行在 AWS Lambda 和 腾讯云函数上运行（均不支持监听）。如有需求运行在 Serverless 容器，请修改 `src/env.json` 中的 `SERVERLESS` 为 `true`，然后重新构建代码。
2. 如使用腾讯云函数，请仔细按云函数文档操作，对代码稍作调整，安装依赖、转译源码，并配置云函数启动文件 scf_bootstrap 内容为如下命令
``` bash
#!/bin/bash
/var/lang/node16/bin/node apps/server/build/serve.js
```

</details>

至此，部署完成，可通过域名或服务器 IP 访问接口的默认路径 `/` ，看到欢迎页面。

### 展示

演示地址：https://prod.d6afmntd8nh5y.amplifyapp.com （部署在香港，较慢，功能阉割版仅供演示）

![](https://cxorz.blob.core.windows.net/static-files/ui-start.png)
![](https://cxorz.blob.core.windows.net/static-files/ui-qrcode-sign.png)

## 贡献

本项目按照个人意愿进行开发，一些功能以及设计带有个人主观的想法。发起 pr 之前务必先发起issue进行讨论，之后新建一个分支(以提供的功能命名），并在此分支完成你的代码即可提交 pr。请务必保持代码整洁和 commit 规范。

## 免责声明

本项目仅作为交流学习使用，通过本项目加深网络通信、接口编写、交互设计等方面知识的理解，请勿用作商业用途，任何人或组织使用项目中代码进行的任何违法行为与本人无关。
