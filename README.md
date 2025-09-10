# Game Templates Collection

这是一个游戏模板集合，包含了多个基于 Phaser.js 的游戏开发模板。

## 模板列表

### 1. 2Dplatformer
- **来源**: [wang-sy/2DPlatformGame](https://github.com/wang-sy/2DPlatformGame)
- **描述**: 一个完整的 2D 平台游戏模板，包含玩家控制、敌人、收集品、音效等功能
- **特性**:
  - 完整的游戏循环（主菜单、游戏场景、胜利/失败界面）
  - 玩家移动和跳跃控制
  - 敌人 AI 和碰撞检测
  - 音效和背景音乐系统
  - 移动端控制支持
  - 瓦片地图系统

### 2. BaseTemplete
- **来源**: [phaserjs/template-vite-ts](https://github.com/phaserjs/template-vite-ts)
- **描述**: Phaser.js 官方的基础 TypeScript 模板
- **特性**:
  - 基于 Vite 的构建系统
  - TypeScript 支持
  - 基础的 Phaser.js 场景结构
  - 开发和生产环境配置

## 使用方法

### 克隆仓库
```bash
git clone <你的仓库URL>
cd templetes
```

### 初始化子模块
```bash
git submodule update --init --recursive
```

### 更新子模块
```bash
git submodule update --remote
```

### 使用特定模板
1. 进入对应的模板目录
2. 安装依赖：`npm install`
3. 启动开发服务器：`npm run dev`

## 开发指南

每个模板都包含详细的文档：
- `2Dplatformer/docs/` - 包含架构分析、扩展指南、瓦片地图配置等
- `BaseTemplete/docs/` - 包含基础使用说明

## 许可证

请查看各个模板目录中的 LICENSE 文件了解具体的许可证信息。

## 贡献

欢迎提交 Issue 和 Pull Request 来改进这些模板！
