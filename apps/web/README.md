# chaoxing-sign-ui

## 命令

- `pnpm install` ，安装依赖，如果时间太长请尝试挂代理或使用淘宝源。
- `pnpm serve` ，启动开发服务器，不要忘记把接口服务也运行起来。
- `pnpm build` ，构建项目，输出到 dist 文件夹。

## 配置

`src/config/api.ts` ：该文件中配置 `baseUrl` 变量为接口地址，默认 `http://localhost:5000` 。若接口部署在服务器，不要忘记将接口地址改为服务器IP或绑定的域名。

`src/pages/DashBoard/Helper.ts` ：若使用腾讯云的通用文字识别服务，二维码识别成功率极高，支持PNG、JPG、JPEG、PDF等格式，图片大小不能超过7M。查看此源码文件中的 parseEnc 函数，可注释掉默认函数，使用推荐函数，同时需要在CLI项目中的 `env.json` 中配置 `secretId` 和 `secretKey`。

## 最佳实践

使用 [腾讯云开发-静态网站托管](https://console.cloud.tencent.com/tcb/hosting)，将构建的网页部署进去。

步骤：
1. 确认已进行过必要的配置，例如接口地址、文字识别服务。
2. 在 web 目录下运行 `pnpm build`，将构建网页并输出到 web/dist 目录下。
3. 将 dist 目录内的所有内容（不包括dist文件夹），在静态网站托管页面上传。
4. 通过云开发的默认域名即可访问。

![](https://cxorz.blob.core.windows.net/static-files/tcb-hosting.png)
