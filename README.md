# Tachibana Sherry Generator
橘雪莉表情包生成器

一个简单易用的表情包生成工具，支持自定义文字、字体、颜色和背景图片。

## 功能特性

- 🎨 自定义文字内容和样式
- 🖼️ 支持多种背景图片格式
- 🎯 智能文字自动换行和大小调整
- 💾 一键保存生成的表情包
- 🖥️ 实时预览效果
- 🔧 支持热键操作（F9发送表情包）

## 快速开始

### 方法一：使用预编译版本（推荐）

1. 下载最新版本的 `TachibanaSherryGenerator.exe`
2. 确保同目录下有 `Font` 文件夹，包含字体文件
3. 双击运行即可使用

### 方法二：从源码运行

1. 确保安装 Python 3.8+
2. 安装依赖：
   ```bash
   pip install pillow pynput pywin32 psutil pyperclip
   ```
3. 运行程序：
   ```bash
   python main.py
   ```

### 方法三：自行编译

1. 运行构建脚本：
   ```bash
   build.bat
   ```
2. 编译完成后，EXE文件位于 `build/exe.win-*/TachibanaSherryGenerator.exe`

## 项目结构

```
Tachibana-Sherry-Generator/
├── main.py                 # 程序入口
├── setup.py               # 打包配置
├── pyproject.toml         # 项目配置
├── build.bat              # 构建脚本
├── utils/
│   ├── memeapp.py         # 图形界面
│   └── generator.py       # 图片生成核心
├── images/                # 表情包图片资源
├── background_images/     # 背景图片文件夹
├── Font/                  # 字体文件文件夹
└── output_images/         # 输出图片文件夹
```

## 使用说明

1. **输入文字**：在文本框中输入想要显示的文字
2. **样式设置**：调整文字颜色、大小、描边效果
3. **选择资源**：选择背景图片和字体文件
4. **实时预览**：界面右侧会实时显示生成效果
5. **保存图片**：点击保存按钮将图片保存到output_images文件夹

## 技术栈

- **GUI框架**: tkinter
- **图像处理**: Pillow (PIL)
- **打包工具**: cx_Freeze
- **系统交互**: pywin32, pynput

## 编译信息

- 版本: 1.2
- 编译环境: Python 3.10, Windows amd64
- 打包工具: cx_Freeze 8.5.0
- 文件大小: ~23.5KB

## 注意事项

- 首次运行可能需要安装VC++运行库
- 确保Font文件夹中有可用的字体文件
- 背景图片建议使用900x900像素的图片
- 程序会自动创建必要的文件夹结构

## 许可证

MIT License

---

*作者第一次使用github！文件管理可能会有点乱。还请谅解啦！*