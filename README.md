# NovelView

一个面向 DeepSeek Harness 的本地电子书阅读插件。NovelView 使用类似普通
DSH 对话的版式展示章节内容，并支持在设置页导入本地电子书。

> 当前处于早期开发阶段，首个里程碑支持 TXT 和 Markdown，EPUB 支持正在
> 规划中。

## 功能

- 在设置页导入 TXT 和 Markdown 电子书
- 自动识别 Markdown 标题和常见中文“第 X 章”标题
- 使用对话式阅读页展示章节
- 保存当前书籍和章节进度
- 调整字号与阅读宽度
- 默认使用与 DSH 会话一致的 14px 正文字号和 748px 正文宽度
- 正文使用 DSH 的“字号 + 10px”行高和 16px 段落间距
- 通过 DSH 官方主题服务实时适配浅色和深色模式
- 所有书籍和阅读进度保存在本机，不经过模型，不消耗 Token

## 安装

环境要求：

- Node.js 24.9 或更高版本
- pnpm 11
- DeepSeek Harness 0.2.x

安装依赖并构建：

```sh
pnpm install
pnpm build
```

生成可安装包：

```sh
npm pack
```

在 DeepSeek Harness 中：

1. 打开“插件”。
2. 点击“添加插件”。
3. 填写生成的压缩包路径，或本仓库的绝对路径。
4. 安装并启用 NovelView。
5. 安装或更新 Client 插件后，必须完全退出并重新启动 DeepSeek
   Harness。仅新建会话或刷新页面不能保证新插件 bundle 已加载。
6. 从左侧栏打开“NovelView”。

仓库内提供了一份用于测试导入和分章的
[原创示例电子书](examples/sample-book.txt)。

## 使用

1. 进入设置中的“NovelView”。
2. 点击“导入电子书”。
3. 选择 TXT 或 Markdown 文件。
4. 返回左侧栏并打开“NovelView”。
5. 使用上一章、下一章或顶部书籍选择器继续阅读。

## 隐私

NovelView 不会把书籍内容发送给模型或外部服务。导入的电子书保存在当前 DSH
客户端的本地存储中。

## 当前限制

- 目前只支持 TXT 和 Markdown，暂不支持 EPUB、MOBI、PDF 或 DRM 文件。
- 阅读界面目前是独立的 DSH 主面板，尚未作为真实会话事件节点写入 Session。
- 尚未提供书库导入、导出和跨设备同步。

## 开发状态

- [x] 本地书库和阅读进度
- [x] TXT、Markdown 导入
- [x] 中文与 Markdown 章节识别
- [x] 对话式阅读界面
- [x] 深色、浅色和跟随系统主题适配
- [ ] EPUB 导入与内容清洗
- [ ] 更细的翻页和段落进度
- [ ] 接入 DSH 原生 Conversation Node

## 许可证

MIT
