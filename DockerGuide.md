# Docker Guide

## 拉取镜像

下载docker镜像，国内站点会比较慢

```dockerfile
docker pull ghcr.io/cxorz/chaoxing-sign-cli:latest
```

（待更新国内站点）

## 本机部署

```dockerfile
docker run --name chaoxing -d -p 80:80 -p 5000:5000 chaoxing-sign-cli
```

你可以直接通过这个方式创建一个容器，然后使用服务器的IP访问，但直接暴露你服务器的公网IP并不安全（局域网服务器除外），且IP地址不方便记忆，你可以使用一个域名来指向他。

且容器默认使用`localhost`地址来访问API，因此你的容器的服务端很可能出现本地(内网)登录没问题，外网访问无法登录的奇妙问题。如果你希望你的服务能在外网被访问而不是只在内网访问的话，建议使用下面的方案。

## Docker化部署

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

我们首先关注你的服务器的拓扑结构，以我的服务器为例的话。他的访问顺序是`【服务器→Docker化的NGINX→chaoxing容器的NGINX】`来完成整个访问流程，当你访问他的UI界面时，登录使用的地址是`localhost`，因此你必须修改他的后台。

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

![](https://raw.githubusercontent.com/QLozin/Image/master/newimg/old.png)

一个非常自然的想法就是通过反代理部分文件路径的方式来完成5000端口的访问，这是调整后的拓扑图：

![](https://raw.githubusercontent.com/QLozin/Image/master/newimg/new.png)

> 实际上还有一种办法，就是使用一个域名（或者子域名、字路径）指向5000端口，然后`baseUrl`使用这个域名即可。但这依然需要开放两个端口，对我来说我并不喜欢（而且5000端口已经被占用了）

就是说，将`baseUrl`的地址改为从`yourDomain.com:5000`改成`yourDomain.com/allinone`，但是这样的话他真实的访问地址是`https://yourDomain.com/allinone/login...`，你必须把`allinone`剔除掉才能保证访问正常，这个可以很简单的通过Nginx设置实现。这是示例：

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

## 收尾

上面两种方案你只需要采用一种即可，在这之后你也许得注意下面的内容：

- 刷新NGINX：在nginx容器中使用`nginx -t`检查你的配置是否有误，如果看到两个`OK!`就行，之后运行`nginx -s reload`，你的反代理程序就应用上去了。更多nginx的排障内容请移步到官方文档。

- 重新构建

	你配置完成NGINX、修改完`baseURL`后还必须重新在容器中执行构建指令才能应用你的设置：

	```dockerfile
	# 在容器里
	pnpm build
	```

	等待构建完成后访问前端进行测试即可。
	
## 排障
如果你在宿舍使用路由器或者虚拟机之类的方法部署了该容器，目前一个已知的故障[#172](https://github.com/cxOrz/chaoxing-sign-cli/issues/172)，是每次断网（但不重启机器）后会导致容器工作异常。
一般只需要重启容器即可
```docker
docker restart chaoxing
```
虽然不甚麻烦，但往往出门在外总是忘记重置的。建议使用一个脚本定期重启。
首先你需要创建一个脚本文件，随便放在什么地方，现在假设你的账户名称为`ubuntu`，需要指出，非常不建议使用`root`账户本身进行操作。
```ubuntu
mkdir ~/sh
mkdir ~/sh/log	#创建日志文件
cd ~/sh
nano restart_chaoxing.sh
```
然后写入如下内容：
```sh
#!/bin/sh
log_file="/home/ubuntu/sh/log/sh.log"	# 自定义你的日志存放路径
# 容器名称或ID
container_name_or_id="你的超星容器ID或名字"  #如何查阅容器ID请查询docker文档

echo "$(date)::Start To Restart container chaoxing">>$log_file	# 每次执行脚本都会输出一个文字到日志，如果你不需要日志请删除

# 核心代码-重启容器
docker restart $container_name_or_id

# 将执行信息重定向
command >> $log_file 2>&1

# 打印执行信息，如果你没有日志文件请删除
echo "$(date)::Command executed" >> $log_file
```
增加文件权限：
```ubuntu
chmod +x ~/restart_chaoxing.sh
```
然后将内容写入自动任务：
```ubuntu
crontab -e
```
然后写入
```txt
# 分 时 周 月 年，这里表示每天的7:01执行路径为/...restart_chaoxing.sh的脚本
01 7 * * * /home/ubuntu/sh/restart_chaoxing.sh
```
此外，你还需要注意，你的系统时间是不是北京时间，像我的服务器默认是世界协调时（UTC+0），导致我早上7点的脚本在下午15点执行了！
执行该命令检查：
```ubuntu
timedatectl
```
主要观察`Time zone`和`Local time`，跟我类似即可。
```txt
Local time: Sun 2023-05-07 16:37:04 CST
Universal time: Sun 2023-05-07 08:37:04 UTC
RTC time: Sun 2023-05-07 08:37:04
Time zone: Asia/Shanghai (CST, +0800)
```
如果不是，请执行：
```ubuntu
>sudo timedatectl set-timezone Asia/Shanghai
>sudo nano /etc/systemd/timesyncd.conf
```
修改`#NTP=`为`NTP=ntp1.aliyun.com`
然后执行`sudo systemctl restart systemd-timesyncd.service`
再执行`timedatectl`检查结果即可。
建议你第二天直接去试试，看看能不能打开你的网站并且开启监听，或者直接看容器的`STATUS`的持续运行时间，如果卡死或者完全打不开就是没重启成功。
你可以通过有`root`权限的账户查看执行日志。
```ubuntu
grep "CRON.*ubuntu" /var/log/syslog
```
这查看`ubuntu`账户的所有自动任务。
以及去你自己自定义的日志地址查看执行情况。
需要注意的是，给你提供的脚本日志功能相当弱鸡，建议自己写一个鲁棒性强的，比如用python重写一个。

