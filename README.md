<h1 align="center">超星学习通签到</h1>
<p align="center">
  <img src="https://img.shields.io/badge/nodejs->=v8.5.4-brightgreen.svg" />
</p>

基于 Nodejs ，实现的一个签到命令行工具。

**功能**： 二维码签到（10秒变换也可用）。

更多功能正在开发 ...

## 环境 💻

可在任意运行 Nodejs > v8.5.4 的平台签到，Windows、MacOS、Linux，安卓可以安装 Termux 并安装 [Nodejs](https://nodejs.org/en/) 。

## 部署 🛠

将仓库克隆到本地

```bash
git clone https://github.com/***REMOVED***/chaoxing-sign-cli.git
```

进入项目文件夹

```bash
cd chaoxing-sign-cli
```

## 运行 ⚙

### 二维码签到

请找一位同学，发来拍的二维码的照片（无所谓几秒一变），用微信扫一扫二维码，或用其他工具识别，得到类似下面的结果：

![识别二维码得到字符串](./src/docs/qr.png)

复制其中的 `enc` 参数，注意不要复制多余内容和空格，例如 1D0A628CK317F44CCC378M5KD92，接着运行以下命令，根据提示进行操作

```bash
npm run code
```

若签到成果将显示 `success签到成功` 。

## 截图

![成功截图](src/docs/success.png)

## 鸣谢

毛概老师。