# Docker Guide

## 拉取镜像

下载docker镜像，国内站点会比较慢

```dockerfile
docker pull ghcr.io/cxorz/chaoxing-sign-cli:latest
```

（待更新国内站点）

## 一般部署方式

```dockerfile
docker run --name chaoxing -d -p 80:80 -p 5000:5000 chaoxing-sign-cli
```

你可以直接通过这个方式创建一个容器，然后使用服务器的IP访问，但直接暴露你服务器的公网IP并不安全（局域网服务器除外），且IP地址不方便记忆，你可以使用一个域名来指向他。

且容器默认使用`localhost`地址来访问API，因此你的容器的服务端很可能出现`无法登录`的严重问题。解决方法见下面

## .

如果你应用如下的解决方案，请不要使用上面的部署指令。一般使用：

```dockerfile
docker run --name chaoxing -d --network 你的网桥 chaoxing-sign-cli
```

也就是说不需要进行端口映射，但你必须把这个容器加入网桥，Docker提供了一个默认的网桥`Bridge`

为了方便，最好同时指定这个容器的IP，否则服务器重启或容器重启后可能导致IP发生变化

```dockerfile
docker run --name chaoxing -d --network 你的网桥 --ip 你的容器IP chaoxing-sign-cli
```

还有一些复杂的指令例如`--restart`你可以按需使用

### 解决方案I

我们首先关注你的服务器的拓扑结构，以我的服务器为例的话。他的访问顺序是`【服务器->Docker化的NGINX->chaoxing容器的NGINX】`来完成整个访问流程，当你访问他的UI界面时，登录使用的地址是`localhost`，因此你必须修改他的后台。

```dockerfile
# 进入你的容器
docker exec -it chaoxing /bin/bash
# 以下指令在容器内执行
>vi /app/apps/web/src/config/api.ts
# 然后修改
const baseUrl = 'https://chaoxing.yourDomain.com:5000';
# 这个baseUrl在之前是另一个文件中的，现在已经更改到web/src
```

此时你登录会通过你的域名的5000端口进行，你的域名应当指向这个服务器的IP地址，同时服务器`开启5000`端口的访问，并在`nginx`内对`5000`端口进行反代理。

一个nginx文件示例(这里只展示Server块)：

```nginx
server {
	listen 80;
	listen 443 ssl;
	server_name yourDomain.com;
	location / {
		proxy_pass http://你的超星容器的IP;
		proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Real-IP $remote_addr;
	}
	ssl_certificate	/your/domain/ssl;
	ssl_certificate_key	/your/domain/ssl_key;
}
server {
	listen 5000;
	server_name yourDomain.com;
	location / {
		proxy_pass http://你的超星容器IP:5000;
		proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Real-IP $remote_addr;
	}
	ssl_certificate	/your/domain/ssl;
	ssl_certificate_key	/your/domain/ssl_key;
}
```

### 解决方案II

这样非常的不优雅，而且使用域名也会暴露你的服务器IP，如果你想套CDN的话，使用5000端口的服务方法显然是不被接受的。如何只通过一个域名访问呢？

我们首先来看原来的拓扑图：

`[这里理论上应该有图片]`

一个非常自然的想法就是通过反代理部分文件路径的方式来完成5000端口的访问，这是调整后的拓扑图：

`[这里理论上也应该有图片]`

就是说，将`baseUrl`的地址改为从`yourDomain.com:5000`改成`yourDomain.com/allinone`，但是这样的话他真实的访问地址是`https://yourDomain.com/allinone/login...`，你必须把`allinone`剔除掉才能保证访问正常，这个可以很简答的通过Nginx设置实现。这是示例：

```nginx
server {
    listen 443 ssl; # 这里拒绝了80端口访问，按照你的需求设置
    server_name chaoxing.yourDomain.com;
    #access_log /var/log/nginx/chaoxing_acss; 这个是自定义日志地址，按照你的需要来设置
    #error_log /var/log/nginx/chaoxing_err;   我是拿来排障用的
    location / {
        proxy_pass http://你的超星容器IP;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Real-IP $remote_addr;
    }
    location /allinone/ {
        rewrite ^/allinone/(.*)$ /$1 break; # 这个是去除网址中的allinone路径
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_pass http://你的超星容器IP:5000;
    }
    ssl_certificate         /ssl/yourDomain.com/cert.pem;
    ssl_certificate_key     /ssl/yourDomain.com/cert.key;
}

```

### 重新构建

上面两种方案你只需要采用一种，然后就可以走到这一步：

你配置完成NGINX、修改完`baseURL`后还必须重新在容器中执行构建指令才能应用你的设置：

```dockerfile
# 在容器里
pnpm build
```

等待构建完成后访问前端进行测试即可。

