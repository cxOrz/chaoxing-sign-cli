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

## 最佳实践

部署在服务器，步骤如下：

1. 安装 Node 环境，推荐使用 LTS 版本
2. 克隆代码 `git clone https://github.com/cxOrz/chaoxing-sign-cli.git`
3. 进入项目目录，安装依赖
4. 配置项目的 env.json 文件（可选）
5. 转译源码 `pnpm build`
6. 最后，使用 GNU Screen 或者 PM2 运行接口服务

还有一些事情必需知道：

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
