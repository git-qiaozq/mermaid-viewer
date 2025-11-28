#!/usr/bin/env python3
"""
Mermaid Viewer - 本地 Mermaid 图表和 Markdown 文档展示工具
使用 Python 内置 http.server 模块，无需安装第三方依赖
"""

import http.server
import socketserver
import os
import sys
import webbrowser
import threading
import json
import time

# 配置
PORT = 8080
HOST = "localhost"
STATIC_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "static")

# 全局服务器实例和关闭标志
server_instance = None
shutdown_flag = False


class MermaidViewerHandler(http.server.SimpleHTTPRequestHandler):
    """自定义 HTTP 请求处理器"""

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=STATIC_DIR, **kwargs)

    def end_headers(self):
        """添加必要的响应头"""
        # 允许跨域请求（本地开发用）
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        # 缓存控制
        self.send_header("Cache-Control", "no-cache, no-store, must-revalidate")
        super().end_headers()

    def guess_type(self, path):
        """确保正确的 MIME 类型"""
        mime_types = {
            ".js": "application/javascript",
            ".css": "text/css",
            ".html": "text/html",
            ".json": "application/json",
            ".svg": "image/svg+xml",
            ".png": "image/png",
            ".ico": "image/x-icon",
        }
        ext = os.path.splitext(path)[1].lower()
        return mime_types.get(ext, super().guess_type(path))

    def do_GET(self):
        """处理 GET 请求"""
        # 默认返回 index.html
        if self.path == "/" or self.path == "":
            self.path = "/index.html"
        return super().do_GET()

    def do_POST(self):
        """处理 POST 请求"""
        if self.path == "/api/shutdown":
            self.handle_shutdown()
        else:
            self.send_error(404, "Not Found")

    def do_OPTIONS(self):
        """处理 OPTIONS 请求（CORS 预检）"""
        self.send_response(200)
        self.end_headers()

    def handle_shutdown(self):
        """处理关闭服务器请求"""
        global server_instance, shutdown_flag
        
        # 安全检查：只允许来自 localhost 的请求
        client_ip = self.client_address[0]
        allowed_ips = ["127.0.0.1", "::1", "localhost"]
        
        if client_ip not in allowed_ips:
            self.send_error(403, "Forbidden: Only localhost can shutdown the server")
            return
        
        # 发送成功响应
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        response = json.dumps({"success": True, "message": "服务器正在关闭..."})
        self.wfile.write(response.encode("utf-8"))
        
        # 设置关闭标志
        shutdown_flag = True
        
        # 在新线程中关闭服务器（避免阻塞响应）
        def shutdown():
            time.sleep(0.5)  # 等待响应发送完成
            print("\n" + "=" * 50)
            print("  收到关闭请求，服务器正在停止...")
            print("=" * 50)
            if server_instance:
                server_instance.shutdown()
        
        threading.Thread(target=shutdown, daemon=True).start()

    def log_message(self, format, *args):
        """自定义日志格式"""
        print(f"[{self.log_date_time_string()}] {args[0]}")


class ThreadedTCPServer(socketserver.ThreadingMixIn, socketserver.TCPServer):
    """支持多线程的 TCP 服务器"""
    allow_reuse_address = True
    daemon_threads = True


def main():
    """主函数"""
    global server_instance, shutdown_flag
    
    # 检查 static 目录是否存在
    if not os.path.exists(STATIC_DIR):
        print(f"错误: 找不到 static 目录: {STATIC_DIR}")
        sys.exit(1)

    # 检查 index.html 是否存在
    index_path = os.path.join(STATIC_DIR, "index.html")
    if not os.path.exists(index_path):
        print(f"错误: 找不到 index.html: {index_path}")
        sys.exit(1)

    # 创建服务器
    try:
        server_instance = ThreadedTCPServer((HOST, PORT), MermaidViewerHandler)
    except OSError as e:
        if "Address already in use" in str(e) or "只允许使用一次" in str(e):
            print(f"错误: 端口 {PORT} 已被占用，请先关闭占用该端口的程序")
            print(f"提示: 可以尝试运行 'lsof -i :{PORT}' 或 'netstat -tlnp | grep {PORT}' 查看占用情况")
        else:
            print(f"错误: 无法启动服务器 - {e}")
        sys.exit(1)
    
    url = f"http://{HOST}:{PORT}"
    print("=" * 50)
    print("  Mermaid Viewer - 本地图表展示工具")
    print("=" * 50)
    print(f"  服务器地址: {url}")
    print(f"  静态文件目录: {STATIC_DIR}")
    print("  关闭方式: 点击界面右上角退出按钮 或 按 Ctrl+C")
    print("=" * 50)

    # 尝试自动打开浏览器
    try:
        webbrowser.open(url)
    except Exception:
        pass

    # 启动服务器
    try:
        server_instance.serve_forever()
    except KeyboardInterrupt:
        print("\n收到键盘中断信号...")
    finally:
        print("正在清理资源...")
        server_instance.server_close()
        print("服务器已停止，再见！")
        # 强制退出，确保所有线程都停止
        os._exit(0)


if __name__ == "__main__":
    main()
