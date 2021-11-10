<h1 align="center">⏰超星学习通签到⏰</h1>
<p align="center">
  <img src="https://img.shields.io/badge/nodejs->=v8.5.4-brightgreen.svg" />
</p>

基于 Nodejs ，实现的一个签到命令行工具。为了节约性能，只对开始一小时以内的活动签到。特殊情况：同一时间有多个有效签到活动的话，只签最新的。

**功能**： 普通签到、拍照签到、手势签到、位置签到、二维码签到（10秒变换不影响）。

**注意**： 本程序仅为交流学习使用，借助学习通的平台，通过本项目加深http请求、网络通信、接口编写、交互设计等方面知识的理解，请勿用作商业以及其他用途。

**为确保你的代码最新与仓库保持同步，将在每次签到结束强制拉取代码更新**，如需关闭更新，请查看[issue2](https://github.com/miaochenxi/chaoxing-sign-cli/issues/2#issuecomment-962781427)，更多功能正在开发 ...

## 环境 💻

可在任意运行 [NodeJS](https://nodejs.org/en/) > v8.5.4 的平台签到，Windows、MacOS、Linux ... 

安卓手机上可以用 Termux 来运行NodeJS程序，[查看Termux教程](./src/docs/termux.md) 。

## 部署 🛠

将仓库克隆到本地

```bash
git clone https://github.com/miaochenxi/chaoxing-sign-cli.git
```

进入项目文件夹

```bash
cd chaoxing-sign-cli
```

## 运行 ⚙

### 二维码签到

运行以下命令

```bash
npm run code
```

在这之前你需要做些准备，请找一位同学，发来拍的二维码的照片（无所谓几秒一变），用微信扫一扫二维码，或用其他工具识别，得到类似下面的结果：

![识别二维码得到字符串](./src/docs/qr.png)

复制其中的 `enc` 参数，注意不要复制多余内容和空格，例如 1D0A628CK317F44CCC378M5KD92，复制完成后运行时用得到。

### 位置签到

运行以下命令

```bash
npm run loc
```

根据提示输入**经纬度**和**详细地址**，经纬度可在这里自己获取 [百度拾取坐标系统](https://api.map.baidu.com/lbsapi/getpoint/index.html)，点击某位置，经纬度将出现在网页右上方，复制等需要的时候使用。详细地址样例：中国河南省郑州市中原区沟赵乡红松路郑州轻工业大学(科学校区)。当然你也可以随便写，不过，老师看着奇怪点你名就没办法了╮(╯▽╰)╭

### 拍照签到

运行以下命令

```bash
npm run cam
```

你需要事先准备一张照片，可以是在教室中的自拍，也可以是在教室中拍环境，都可以，你根据自己的需要来准备这样一张用来提交的照片。打开超星云盘：https://pan-yz.chaoxing.com ，在根目录上传一张你准备的照片，命名为 `0.jpg` 或 `0.png` 。之后就可以执行命令，进行签到。

### 普通签到&手势签到

没有任何需要准备的，运行以下命令即可

```bash
npm run gen
```

## 截图

![成功截图](src/docs/success.png)

## 鸣谢

超星学习通yyds。
