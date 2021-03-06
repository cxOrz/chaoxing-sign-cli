<h1 align="center">⏰超星学习通签到⏰</h1>
<p align="center">
  <img src="https://img.shields.io/badge/nodejs->= v12.16-brightgreen.svg" />
</p>

基于 Nodejs 实现的一个签到命令行工具。

**功能**： 普通签到、拍照签到、手势签到、位置签到、签到码签到、二维码签到（10秒变换不影响），多用户凭据储存，IM 协议自动签到。

**为确保你的代码最新与仓库保持同步，将在每次签到结束强制拉取代码更新**，如需关闭更新，请查看[issue2](https://github.com/cxOrz/chaoxing-sign-cli/issues/2#issuecomment-962781427)，手动终止检查更新可在每次检查时连按 `Ctrl`+`C` 确认终止，更多功能正在开发 ...

## 环境 💻

可在任意运行 [NodeJS](https://nodejs.org/en/) > v12.16 的平台签到，Windows、MacOS、Linux ... 

安卓手机上可以用 Termux 来运行NodeJS程序，[查看Termux教程](./src/docs/termux.md) 。

苹果手机请查看 [高级](https://github.com/cxOrz/chaoxing-sign-cli#%E9%AB%98%E7%BA%A7-) 部分，通过这种方式来使用，当然这种方式也适用于其他。

## 部署 🛠

将仓库克隆到本地

```bash
git clone https://github.com/cxOrz/chaoxing-sign-cli.git
```

进入项目文件夹，安装依赖

```bash
cd chaoxing-sign-cli && npm install
```

## 运行 ⚙
### 命令解释
- `npm start`：运行程序，若有签到则进行手动签到，若无则退出程序；
- `npm run serve`：启动接口服务；
- `npm run monitor`：监听模式，检测到签到将自动签上，无需人工干预；


一般情况下执行以下命令即可满足基础使用

```bash
npm start
```

![](https://636c-cloudbase-1a4211-1252446325.tcb.qcloud.la/chaoxing-sign-cli/how-to-start.gif?)

## 使用须知 📄

为了节约性能，只对开始2小时以内的活动签到。同时有多个有效签到活动的话，只签最新的。将结束的课程移入其他文件夹，减少根目录的课程能够提高活动检测速度。

### 二维码签到

在运行之前需要做些准备，请找一位挚友，发来拍的二维码的照片（无所谓几秒一变），用微信扫一扫二维码，或用其他工具识别，得到类似下面的结果：

![识别二维码得到字符串](./src/docs/qr.png)

复制其中的 `enc` 参数，注意不要复制多余内容和空格，例如 1D0A628CK317F44CCC378M5KD92，复制该值，询问时填入。若使用 UI 仓库的项目(查看`高级`)，则可直接选择图片提交。

### 位置签到

根据运行时的提示输入**经纬度**和**详细地址**，经纬度可在这里自己获取 [百度拾取坐标系统](https://api.map.baidu.com/lbsapi/getpoint/index.html)，点击某位置，经纬度将出现在网页右上方，复制该值，询问时填入。详细地址样例：中国河南省郑州市中原区沟赵乡红松路郑州轻工业大学(科学校区)，该地址将显示在教师端。

### 拍照签到

需要事先准备一张用来提交的照片。浏览器访问超星云盘：https://pan-yz.chaoxing.com ，在根目录上传一张你准备的照片，命名为 `0.jpg` 或 `0.png` 。若使用 UI 仓库的项目(查看`高级`)，则可直接选择图片提交。

### 普通签到&手势签到&签到码签到

没有任何需要准备的，直接运行即可。

## 高级 🎲

以上内容介绍了最基本的用法，接下来介绍一些稍高级一些的使用方法。

### 运行接口服务

首先运行 `npm install` 或者 `yarn`，安装依赖。

运行 `npm run serve` 将启动接口服务，可通过调用 API 来实现以上功能。接下来描述每个接口的参数以及调用方式：

|路径|请求方式|参数|内容类型|返回内容|
|-|-|-|-|-|
|/|GET|无|无|\< String \>|
|/login|POST|phone, password|JSON|\< String \>|
|/activity|POST|uf, _d, vc3, uid|JSON|JSON|
|/uvtoken|POST|uf, _d, vc3, uid|JSON|\< String \>|
|/qrcode|POST|uf, _d, vc3, name, aid, uid, fid, enc|JSON|待填|
|/location|POST|uf, _d, vc3, name, aid, uid, fid, address, lat, lon|JSON|待填|
|/general|POST|uf, _d, vc3, name, aid, uid, fid|JSON|待填|
|/photo|POST|uf, _d, vc3, name, aid, uid, fid, objectId|JSON|待填|
|/upload|POST|uf, _d, vc3, uid, file, ?_token|multipart/form-data|待填|
|/qrocr|POST|file|multipart/form-data|\< String \>|

### 图形化界面

基于 React.js + Material UI 开发前端页面，其中修改了很多 MUI 附带样式，也自己手写了一些，整体设计灵感-->拟态。

访问 [这里](https://github.com/cxOrz/chaoxing-sign-ui) 查看图形化页面如何部署，使用图形化页面需要先部署接口才能正常工作。

### 最佳实践

在这里介绍部署接口的最佳方式，图形化页面的最佳实践请到其仓库查看。

使用 [腾讯云开发-云函数](https://console.cloud.tencent.com/tcb/scf) 部署接口服务，步骤如下：

1. 在云函数页面，使用默认 HelloWorld 模板新建云函数，并选择最新的 Nodejs 版本。
2. 下载 [tcb-serverless.zip](https://github.com/cxOrz/chaoxing-sign-cli/releases) 文件，如需配置使用 [腾讯云OCR](https://console.cloud.tencent.com/ocr/overview) 以精准解析二维码，请解压并在 `env.json` 配置腾讯云的 secretId 和 secretKey，并重新压缩。注意，请直接选中所有文件夹和文件进行压缩（确保打开压缩包显示一堆文件夹和文件，而不是一个总文件夹）。如果使用默认的二维码解析方法，可以不用修改压缩包文件，直接使用即可。
3. 点击创建好的云函数，进入**函数代码**页面，在提交方法中选择本地上传ZIP包，上传压缩包。
4. 保存，安装依赖，至此部署完成。

部署完成后，还有一些必要的设置需要调整：

- 选择创建的云函数，进入函数配置页面，将**超时时间**设为 `20` 秒，在 10-30 秒的范围内较合理。
- 在云开发CloudBase-环境-访问服务中，开启HTTP访问服务。新建触发路径，选择一个域名，触发路径可写为 `/chaoxing`，在关联资源选择云函数和刚刚创建的函数，确认并等待完成。完成后即可通过触发路径，访问接口服务。

至此，云函数部署完成，可通过该函数的触发路径，访问接口服务。

### 展示

演示地址：https://prod.d6afmntd8nh5y.amplifyapp.com （部署在香港，较慢，仅供演示）

![](https://636c-cloudbase-1a4211-1252446325.tcb.qcloud.la/chaoxing-sign-ui/1.png)
![](https://636c-cloudbase-1a4211-1252446325.tcb.qcloud.la/chaoxing-sign-ui/2.png)

## 贡献

本项目按照个人意愿进行开发，一些功能以及设计带有个人主观的想法。发起 pr 之前务必先发起issue进行讨论，之后新建一个分支(以提供的功能命名），并在此分支完成你的代码即可提交 pr。请务必保持代码整洁和 commit 规范。

## 免责声明

本项目仅作为交流学习使用，通过本项目加深网络通信、接口编写、交互设计等方面知识的理解，请勿用作商业用途，任何人或组织使用项目中代码进行的任何违法行为与本人无关。
