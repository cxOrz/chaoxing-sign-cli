<h1 align="center">🌿超星学习通签到🌿</h1>

![NodeJS](https://img.shields.io/badge/node.js-6DA55F?style=for-the-badge&logo=node.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)
![Docker](https://img.shields.io/badge/docker-%230db7ed.svg?style=for-the-badge&logo=docker&logoColor=white)
![Licence](https://img.shields.io/github/license/cxOrz/chaoxing-sign-cli?style=for-the-badge)

基于 Nodejs 实现的一个命令行签到工具，在此基础上使用 React.js + Material UI + Koa 扩展成为 Web 项目。

**功能**： 普通签到、拍照签到、手势签到、位置签到、签到码签到、二维码签到，多用户凭据储存，IM 协议自动签到。

## 环境 💻

可在任意运行 [NodeJS](https://nodejs.org/en/) > v18.14 的平台签到，Windows、MacOS、Linux ... 

安卓手机上可以用 Termux 来运行NodeJS程序，[查看Termux教程](./apps/server/src/docs/termux.md) 。

苹果手机请查看 [高级](#高级-) 部分，通过这种方式来使用，当然这种方式也适用于其他。

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
- `pnpm dev`：运行Web开发服务器、后端接口；
- `pnpm build`：构建前端页面、转译后端代码；
- `pnpm start`：运行手动签到；
- `pnpm serve`：启动后端接口；
- `pnpm monitor`：启动监听模式，检测到签到将自动签上，无需人工干预；

apps/server 目录下：
- `pnpm build`：转译代码；
- `pnpm start`：运行手动签到功能，若有签到则手动完成，若无则退出程序；
- `pnpm serve`：启动接口；
- `pnpm monitor`：启动监听模式，检测到签到将自动签上，无需人工干预；

apps/web 目录下：
- `pnpm dev`：运行 Web 开发服务器；
- `pnpm build`：构建静态页面；

### 基本使用方式

进入 `apps/server` 目录下，执行以下步骤：

构建代码
```bash
pnpm build
```
构建完成，后续的运行直至下次变更代码，不需要再构建，可以直接运行
```bash
pnpm start
```

## 使用须知 📄

为了节约资源，只对2小时以内的活动签到。若同时有多个有效签到活动，只签最新发布的。将结束的课程移入其他文件夹，减少根目录的课程能够提高活动检测速度。

### 二维码签到

在运行之前需要做些准备，请找一位挚友，拍一张二维码的照片，识别二维码，得到一个字符串，复制其中的 `enc` 参数值，例如 `1D0A628CK317F44CCC378M5KD92`，询问时填入。若使用 UI 仓库的项目(查看`高级`)，可以直接选择图片并自动解析得到enc参数。如果遇到10s变换的二维码，参考 [#157](https://github.com/cxOrz/chaoxing-sign-cli/issues/157)

### 位置签到

根据运行时的提示输入**经纬度**和**详细地址**，经纬度在这里获取 [百度拾取坐标系统](https://api.map.baidu.com/lbsapi/getpoint/index.html)，点击某位置，经纬度将出现在网页右上方，复制该值，询问时填入。详细地址样例：河南省郑州市中原区华中师范大学附属郑州万科城小学，该地址将显示在教师端。

### 拍照签到

需要事先准备一张用来提交的照片。浏览器访问超星云盘：https://pan-yz.chaoxing.com ，在根目录上传一张你准备的照片，命名为 `0.jpg` 或 `0.png` 。若使用 UI 仓库的项目(查看`高级`)，不需要上传云盘，可以直接选择图片提交签到。

### 普通签到&手势签到&签到码签到

没有需要准备的，直接运行即可。

### 监听模式

支持开启QQ机器人、邮件推送、pushplus推送；

**QQ 机器人**：根据 [go-cqhttp](https://docs.go-cqhttp.org/guide/quick_start.html) 文档，配置正向 WebSocket、QQ号、密码，并运行 go-cqhttp 程序，即可运行监听模式并启用该选项。

如需发送二维码让机器人识别并签到，请配置 `env.json` 的 `SecretId` 和 `SecretKey`，将使用腾讯云OCR进行识别和处理。

监听模式每次需要时启用 2 - 4 小时较为合适，最好不要挂着不关。

## 高级 🎲

除了简单的 `pnpm start` 来手动签到，也可以部署到服务器使用网页版本，别忘了这也是个 Web 项目。

- 前端界面，查看 [前端](/apps/web) 的详细说明。
- 后端服务，查看 [服务端](/apps/server) 的详细说明。

### 一键运行

方案一：根目录下执行 `pnpm dev` 将运行前后端服务，并在浏览器弹出项目首页，注意这是开发模式！

方案二：用提供的 Docker 镜像，运行后可通过 IP 访问。

```bash
docker pull ghcr.io/cxorz/chaoxing-sign-cli:latest
docker run -d -p 80:80 -p 5000:5000 chaoxing-sign-cli
```

> 出现问题？先仔细阅读相关说明，若仍无法解决请发 issue

### 展示

演示地址：https://prod.d6afmntd8nh5y.amplifyapp.com （海外服务器较慢，功能阉割仅供演示UI）

![](https://cxorz.blob.core.windows.net/static-files/ui-start.png)
![](https://cxorz.blob.core.windows.net/static-files/ui-config.webp)

## 贡献须知

本项目按照个人意愿进行开发，一些功能以及设计带有个人主观的想法。发起 pr 之前务必先发起issue进行讨论，之后新建一个分支(以提供的功能命名），并在此分支完成你的代码即可提交 pr。

必要条件：
- 运行 `turbo run lint` 无错误出现，可以有警告
- 测试所有功能全部正常，保证修改不会导致任何原有功能出错
- 代码设计合理、健壮、简洁

## 免责声明

本项目仅作为交流学习使用，通过本项目加深网络通信、接口编写、交互设计等方面知识的理解，请勿用作商业用途，任何人或组织使用项目中代码进行的任何违法行为与本人无关。
