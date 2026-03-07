# 软件测评#3——Cloudreve

你是否受够了某度网盘的**限速**、**体验差**？那么这期视频教大家如何通过自建云盘摆脱这些烦恼！

---

# 内网穿透教程

## 起步

首先，打开[官网](https://cloudreve.org)或[GitHub仓库](https://github.com/cloudreve/Cloudreve)的最新版本。

下载所属于你的操作系统版本，放在你喜欢的地方。

## 内网穿透方法

### 1.如何打开Cloudreve?

在地址栏输入cmd回车，输入“cloudreve”回车，等待一会儿打开浏览器窗口，输入“localhost:5212”（IP+英文冒号+端口号）。注册账号并登录，你就获得了一个管理员账户。

### 2.如何内网穿透？

#### 2.1如何添加隧道？

打开[chmlfrp面板](https://panel.chmlfrp.net)并登录，如果你没实名认证请先实名。然后点击【**隧道管理 - 隧道列表**】，点击**添加隧道**，选择你心仪的节点（如使用chmlfrp免费域名，请选择**境外节点**！！！），点击继续；端口类型选择**HTTP**，内网端口填5212。如果你没有域名，域名类型选择**免费域名**，选择你喜欢的域名后缀，填写你的域名前缀，点击确定即可！

#### 2.2如何进行内网穿透？

点击**软件下载**，下载到你喜欢的位置，再点击**配置文件**，选择对应的节点及隧道名称，点击**生成**，将左侧的配置文件代码复制到本地的**frpc.ini**即可！

#### 2.3如何启动内网穿透？

在地址栏输入cmd，输入“frpc”回车，等待至出现“感谢您使用chmlfrp”时代表已经成功！

## 完成

接下来，访问你的域名，注册第一个账户（第一个默认管理员账户）并登录，开始你的自定义网盘之旅！

# 云服务器教程

> 这里给的示例是[雨云](https://rainyun.com)，其他方法见[Cloudreve官方文档](https://docs.cloudreve.org)
> 
> 以下内容由AI生成，请注意辨别！

根据你的反馈，Cloudreve V4 版本的默认行为是**第一个注册的用户即为超级管理员**，部署后没有随机初始密码。以下教程基于 V4 版本进行修订，聚焦于**雨云云服务器**的部署。

---

## 📋 准备工作

- **雨云服务器**：一台已购买的云服务器（建议 2核2G 以上，系统选择 **Debian 12/Ubuntu 22.04**）。  
  - 若使用国内机房（如宿迁、十堰），需域名已备案；否则建议选择香港或美国机房。  
- **域名（可选）**：如需通过域名访问并启用 HTTPS，请提前将域名解析到服务器公网 IP。  

---

## 🚀 第一步：部署 Cloudreve V4

根据你的操作习惯，任选以下一种方式完成部署。

### 方式一：使用雨云预安装 APP（最简单）

1. **创建服务器时选择预安装 APP**：在雨云控制台购买云服务器时，在“预安装APP”选项中，选择 **【网盘系统】Cloudreve**。  

2. **等待创建完成**：服务器启动后，Cloudreve 已自动运行在 `http://<你的服务器IP>:5212`。  

3. **注册成为管理员**：浏览器访问该地址，你将看到 Cloudreve 的注册页面。**第一个注册的账号将自动获得超级管理员权限**，请妥善保管账号密码。  
   
   > 注：预安装版本通常为最新稳定版，默认即采用“首个用户为管理员”策略。

### 方式二：通过 Docker 部署（推荐）

1. **连接服务器**（SSH）。  

2. **安装 Docker**（如已安装可跳过）：  
   
   ```bash
   curl -fsSL https://get.docker.com -o get-docker.sh && sudo sh get-docker.sh
   sudo systemctl start docker && sudo systemctl enable docker
   ```

3. **运行 Cloudreve 容器**（使用官方镜像，默认为 V4 及以上版本）：  
   
   ```bash
   docker run -d \
     --name cloudreve \
     --restart=always \
     -p 5212:5212 \
     -p 6888:6888 \
     -p 6888:6888/udp \
     -v ~/cloudreve/data:/cloudreve/data \
     cloudreve/cloudreve:latest
   ```

4. **完成部署**：容器启动后，访问 `http://<你的服务器IP>:5212`，即可看到注册页面。**第一个注册的用户成为超级管理员**。

### 方式三：手动下载二进制文件部署

1. **连接服务器**。  

2. **下载最新版 Cloudreve**（以 Linux amd64 为例）：  
   
   ```bash
   mkdir -p /www/wwwroot/cloudreve && cd /www/wwwroot/cloudreve
   wget https://github.com/cloudreve/Cloudreve/releases/latest/download/cloudreve_linux_amd64.tar.gz
   tar -zxvf cloudreve_*.tar.gz
   chmod +x ./cloudreve
   ```

3. **首次运行**（生成配置文件并初始化数据库）：  
   
   ```bash
   ./cloudreve
   ```
   
   **注意**：V4 版本在首次运行**不会**输出默认管理员密码，而是直接进入监听状态。使用 `Ctrl + C` 停止程序，以便后续配置守护进程。  

4. **配置 systemd 服务**（后台运行）：  
   
   - 创建服务文件：`vim /usr/lib/systemd/system/cloudreve.service`  
   
   - 写入以下内容：  
     
     ```
     [Unit]
     Description=Cloudreve
     After=network.target
     
     [Service]
     WorkingDirectory=/www/wwwroot/cloudreve
     ExecStart=/www/wwwroot/cloudreve/cloudreve
     Restart=always
     RestartSec=5s
     
     [Install]
     WantedBy=multi-user.target
     ```
   
   - 启动服务：`systemctl daemon-reload && systemctl start cloudreve && systemctl enable cloudreve`  

5. **访问注册**：现在访问 `http://<你的服务器IP>:5212`，第一个注册的账号即为管理员。

---

## 🔓 第二步：放行端口并访问

- **放行端口**：在雨云控制台的服务器防火墙/安全组中，放行 **TCP 5212** 端口（Web 访问）。如需离线下载功能，还需放行 **TCP/UDP 6888** 端口。  
- **浏览器访问**：`http://<你的服务器IP>:5212`，完成第一个账号的注册，该账号即拥有所有管理权限。

---

## 🌐 第三步：配置域名访问与 HTTPS（推荐）

### 1. 安装 Nginx（以宝塔面板为例）

```bash
wget -O install.sh https://download.bt.cn/install/install-ubuntu_6.0.sh && bash install.sh ed8484bec
```

安装完成后登录面板，在软件商店安装 Nginx。

### 2. 设置反向代理

- **添加网站**：填写你的域名（如 `pan.yourdomain.com`），创建纯静态站点。  

- **设置反向代理**：进入网站设置 → 反向代理 → 添加反向代理。  
  
  - **目标 URL**：`http://127.0.0.1:5212`  
  - **发送域名**：填写你的域名  

- **修改配置文件**：在反向代理配置中，确保包含以下头部信息（可在网站配置文件中添加）：  
  
  ```nginx
  location / {
      proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
      proxy_set_header Host $http_host;
      proxy_redirect off;
      proxy_pass http://127.0.0.1:5212;
  }
  ```
  
  ### 3. 启用 HTTPS
  
  在网站设置中申请 Let's Encrypt 证书，并开启强制 HTTPS。

---

## ⚙️ 第四步：进阶配置——挂载雨云对象存储（ROS）

将文件存储到对象存储可节省服务器硬盘空间。

1. **创建存储桶**：在雨云控制台购买并创建对象存储桶，开启**公共读取**，记录 **Endpoint**、**AccessKey**、**SecretKey**。  
2. **登录 Cloudreve 管理面板**：使用第一步注册的账号登录，点击右上角头像进入管理面板。  
3. **添加存储策略**：  
   - 进入 **存储策略** → **添加存储策略** → 选择 **AWS S3**（兼容雨云 ROS）。  
   - 填写：  
     - **Bucket 名称**：你的存储桶名  
     - **Endpoint**：API 端点（如 `https://xxx.ros.rainyun.com`）  
     - **AccessKey/SecretKey**：雨云密钥  
     - **空间类型**：公共读取  
   - 点击“跳过”完成。  
4. **应用策略**：在 **用户组** 中，将默认组的存储策略修改为刚创建的策略，此后新上传文件将直接存入雨云对象存储。

---

## ❓ 常见问题

### Q1：如何确认 Cloudreve 是 V4 版本？

- 访问 `http://<你的IP>:5212`，如果页面底部显示 “Powered by Cloudreve v4.x.x” 或注册页面存在，即为 V4 版本。  
- 或者执行 `./cloudreve --version`（手动部署）查看。

### Q2：如果忘记了管理员密码怎么办？

- 由于管理员就是第一个注册的用户，只能通过数据库重置密码。Cloudreve 提供了命令行工具：  
  
  ```bash
  # 进入 Cloudreve 安装目录
  ./cloudreve --database-script ResetAdminPassword
  ```
  
  执行后根据提示输入新密码，该命令会将第一个管理员（用户ID=1）的密码重置。

### Q3：第一个注册的用户就是管理员，那普通用户如何注册？

- 管理员可以在后台 **用户管理** 中开启“允许用户注册”，或者通过邀请链接添加用户。普通用户注册后默认为普通会员，需由管理员提升权限。

---

## ✅ 完成

至此，你已经在雨云服务器上基于 Cloudreve V4 搭建了私有网盘。享受文件存储、分享和离线下载的乐趣吧！记得定期备份 `~/cloudreve/data`（Docker）或 Cloudreve 安装目录（手动部署）中的数据库和配置文件。
