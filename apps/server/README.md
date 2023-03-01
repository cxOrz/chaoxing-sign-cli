## 命令解释

- `pnpm build`：转译源码，输出到 build 文件夹；必须先转译才能运行程序；
- `pnpm start`：运行程序，若有签到则手动完成，若无则退出程序；
- `pnpm serve`：启动接口服务；
- `pnpm monitor`：监听模式，检测到签到将自动签上，无需人工干预；

## 基本使用方式

更新仓库代码之后，先构建
```bash
pnpm build
```
构建完成，后续的运行直至下次变更代码，不需要再构建，可以直接运行
```bash
pnpm start
```

【注意】对 src 目录下任何文件做出修改后，需重新构建才可生效！

## 接口服务

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

## 最佳实践

部署在服务器，步骤如下：

1. 安装 Node 环境，推荐使用 LTS 版本
2. 克隆代码 `git clone https://github.com/cxOrz/chaoxing-sign-cli.git`
3. 进入项目目录，安装依赖
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
/var/lang/node16/bin/node build/serve.js
```

</details>

至此，部署完成，可通过域名或服务器 IP 访问接口的默认路径 `/` ，看到欢迎页面。
