# 2D Platformer Game Template

一个基于 Phaser 3 和 TypeScript 构建的全功能 2D 平台跳跃游戏模板，具备统一资源管理系统和现代化架构设计。

## ✨ 核心特性

### 🎮 游戏机制
- **完整的2D平台跳跃机制** - 流畅的角色控制和物理系统
- **智能敌人AI** - 多种敌人类型和行为模式
- **收集系统** - 金币、道具和计分机制
- **关卡设计** - 基于Tiled的瓦片地图支持

### 🎵 音频系统
- **背景音乐管理** - 支持场景切换和循环播放
- **音效系统** - 丰富的游戏音效反馈
- **动态音频加载** - 按需加载音频资源

### 📱 多平台支持
- **移动端控制** - 触屏虚拟按键支持
- **响应式UI** - 适配不同屏幕尺寸
- **全屏模式** - 沉浸式游戏体验

### 🔧 统一资源管理系统
- **本地/远程资源** - 支持本地打包和云端资源加载
- **动态配置** - 通过 `game_config.json` 统一管理所有资源
- **开发者工具** - URL参数支持远程配置文件
- **资源键系统** - 统一的资源引用和路径解析

## 🚀 快速开始

### 1. 安装依赖
```bash
npm install
```

### 2. 启动开发服务器
```bash
npm run dev
```

### 3. 构建生产版本
```bash
npm run build
```

### 4. 开发者选项
```bash
# 使用远程配置文件进行开发
http://localhost:5173/?project_id=160&api_host=game-api.dev.knoffice.tech

# 启用调试模式
http://localhost:5173/?debug=true

# 指定关卡
http://localhost:5173/?level=2
```

## 📁 项目结构

```
2Dplatformer/
├── src/game/                    # 核心游戏逻辑
│   ├── scenes/                  # 游戏场景
│   ├── sprites/                 # 游戏对象类
│   ├── managers/                # 系统管理器
│   ├── resourceManager/         # 资源管理系统
│   ├── audio/                   # 音频系统
│   └── utils/                   # 工具类
├── public/assets/               # 游戏资源
│   ├── game_config.json         # 统一资源配置
│   ├── tilemap/                 # 瓦片地图
│   ├── audio/                   # 音频文件
│   └── ...                      # 其他资源
├── docs/                        # 完整文档
│   ├── README.md                # 文档导航
│   ├── RESOURCE_MANAGEMENT_GUIDE.md  # 资源管理指南
│   ├── TILEMAP_CONFIGURATION_GUIDE.md # 关卡设计指南
│   └── CODE_EXTENSION_GUIDE.md  # 代码扩展指南
└── dist/                        # 构建输出
```

## 📚 文档导航

| 我想要... | 阅读这个文档 |
|----------|-------------|
| 🏃‍♂️ 快速运行游戏 | [HOW_TO_BUILD.md](./docs/HOW_TO_BUILD.md) |
| 🗺️ 设计关卡 | [TILEMAP_CONFIGURATION_GUIDE.md](./docs/TILEMAP_CONFIGURATION_GUIDE.md) |
| 🔧 配置资源加载 | [RESOURCE_MANAGEMENT_GUIDE.md](./docs/RESOURCE_MANAGEMENT_GUIDE.md) |
| 🎵 设置音频系统 | [AUDIO.md](./src/game/audio/docs/AUDIO.md) |
| 💻 扩展代码功能 | [CODE_EXTENSION_GUIDE.md](./docs/CODE_EXTENSION_GUIDE.md) |
| 🌐 使用URL参数 | [URL_PARAMETERS_GUIDE.md](./docs/URL_PARAMETERS_GUIDE.md) |

## 🎯 核心系统

### 统一资源管理
- **配置驱动**: 所有资源通过 `game_config.json` 统一配置
- **本地/远程**: 支持本地资源和云端资源混合加载
- **动态解析**: 运行时动态解析资源路径
- **开发友好**: 支持远程配置文件进行开发测试

### 音频系统
- **场景音乐**: 自动根据场景切换背景音乐
- **音效管理**: 统一的音效播放和管理
- **资源优化**: 按需加载和缓存管理

### 关卡系统
- **数据驱动**: JSON配置驱动的关卡设计
- **可视化编辑**: 支持Tiled地图编辑器
- **灵活扩展**: 易于添加新的游戏对象和机制

<!-- Test sync trigger - $(date) - Retest after fixes -->
# 测试同步功能 - Thu Sep 11 11:30:55 CST 2025
# 2Dplatformer 测试同步功能 - Thu Sep 11 11:36:28 CST 2025
# 验证同步功能 - Thu Sep 11 11:39:32 CST 2025
# 测试路径修复 - Thu Sep 11 11:41:04 CST 2025
# 测试重构后的工作流 - Thu Sep 11 11:42:18 CST 2025
