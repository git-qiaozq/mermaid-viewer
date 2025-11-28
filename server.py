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
from urllib.parse import urlparse

# 配置
PORT = 8080
HOST = "localhost"
STATIC_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "static")


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

    def log_message(self, format, *args):
        """自定义日志格式"""
        print(f"[{self.log_date_time_string()}] {args[0]}")


def main():
    """主函数"""
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
    with socketserver.TCPServer((HOST, PORT), MermaidViewerHandler) as httpd:
        url = f"http://{HOST}:{PORT}"
        print("=" * 50)
        print("  Mermaid Viewer - 本地图表展示工具")
        print("=" * 50)
        print(f"  服务器地址: {url}")
        print(f"  静态文件目录: {STATIC_DIR}")
        print("  按 Ctrl+C 停止服务器")
        print("=" * 50)

        # 尝试自动打开浏览器
        try:
            webbrowser.open(url)
        except Exception:
            pass

        # 启动服务器
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n服务器已停止")
            sys.exit(0)


if __name__ == "__main__":
    main()

