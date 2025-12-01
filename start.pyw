#!/usr/bin/env python3
"""
Mermaid Viewer 无窗口启动脚本
在 Windows 上双击此文件启动服务器，不会显示控制台窗口
"""

import sys
import os

# 设置工作目录为脚本所在目录
os.chdir(os.path.dirname(os.path.abspath(__file__)))

# 在无控制台模式下，重定向标准输出和错误输出到空设备
# 避免 print() 等操作因为没有控制台而报错
if sys.platform == 'win32':
    # Windows 下重定向到 NUL
    sys.stdout = open(os.devnull, 'w', encoding='utf-8')
    sys.stderr = open(os.devnull, 'w', encoding='utf-8')
else:
    # Linux/Mac 下重定向到 /dev/null
    sys.stdout = open('/dev/null', 'w', encoding='utf-8')
    sys.stderr = open('/dev/null', 'w', encoding='utf-8')

# 导入并运行服务器
from server import main
main()

