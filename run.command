#!/bin/bash

# 切换到脚本所在目录（即项目根目录）
cd "$(dirname "$0")"

# 后台静默启动，不在前台输出日志
nohup python3 start.pyw >/dev/null 2>&1 &


