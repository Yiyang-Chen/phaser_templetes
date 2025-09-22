# 🎮 2D平台游戏模板

一个功能完整的2D平台游戏模板，基于Phaser 3和TypeScript构建，提供统一的资源管理系统、音频管理、关卡配置和代码扩展能力。
For AIAgent, you need to follow the texts listed in `prompt.md` carefully.

## 🌟 核心特性

- **🎯 统一资源管理**: 支持本地/远程资源动态加载，优先使用远程CDN资源
- **🎵 智能音频系统**: 场景自动切换BGM，动画自动触发音效
- **🗺️ 数据驱动关卡**: JSON配置关卡，支持7种游戏对象类型
- **🔧 代码扩展框架**: 抽象基类、管理器模式、事件驱动架构
- **📱 移动端支持**: 触摸控制、响应式UI
- **🌐 URL参数配置**: 支持调试模式、关卡选择、远程配置
- **⚡ 性能优化**: 对象池、资源预加载、智能缓存

## 🚀 快速开始

### 环境要求
- Node.js 16.0.0 或更高版本
- npm 7.0.0 或更高版本

### 安装和运行

```bash
# 1. 安装依赖
npm install

# 2. 开发模式（热重载）
npm run dev
# 访问 http://localhost:8080

# 3. 生产构建
npm run build
# 输出文件在 dist/ 目录
```

### 其他命令

```bash
# 无日志开发模式
npm run dev-nolog

# 无日志生产构建
npm run build-nolog

# 内存不足时的构建
NODE_OPTIONS="--max-old-space-size=4096" npm run build

# 自定义端口
npm run dev -- --port 3000
```

## 📁 项目结构

```
2Dplatformer/
├── src/game/                          # 游戏核心代码
│   ├── scenes/                        # 游戏场景
│   │   ├── Boot.ts                    # 启动场景（URL参数处理）
│   │   ├── Preloader.ts               # 资源预加载
│   │   ├── MainMenu.ts                # 主菜单
│   │   ├── Game.ts                    # 主游戏场景
│   │   ├── Victory.ts                 # 胜利场景
│   │   └── GameOver.ts                # 游戏结束场景
│   ├── sprites/                       # 游戏对象
│   │   ├── Player.ts                  # 玩家角色
│   │   ├── Enemy.ts                   # 敌人
│   │   ├── Collectible.ts             # 收集品
│   │   ├── Goal.ts                    # 目标点
│   │   ├── Obstacle.ts                # 障碍物
│   │   ├── StaticHazard.ts            # 静态危险
│   │   ├── Trigger.ts                 # 触发器
│   │   └── Bullet.ts                  # 子弹
│   ├── managers/                      # 管理器系统
│   │   ├── AnimationManager.ts        # 动画管理
│   │   ├── CollectedItemsManager.ts   # 收集品管理
│   │   ├── FullscreenManager.ts       # 全屏管理
│   │   ├── GameObjectManager.ts       # 游戏对象管理
│   │   └── UIManager.ts               # UI管理
│   ├── audio/                         # 音频系统
│   │   └── AudioManager.ts            # 音频管理器
│   ├── resourceManager/               # 资源管理系统
│   │   ├── GlobalResourceManager.ts   # 全局资源管理器
│   │   ├── LoaderExtensions.ts        # 加载器扩展
│   │   ├── CustomLoader/              # 自定义加载器
│   │   └── CustomLoadFile/            # 自定义文件类型
│   ├── ui/                           # UI组件
│   │   ├── HealthUI.ts               # 生命值显示
│   │   └── MobileControls.ts         # 移动端控制
│   ├── utils/                        # 工具类
│   │   ├── URLParameterManager.ts    # URL参数管理
│   │   ├── DeviceDetector.ts         # 设备检测
│   │   ├── EventBusDebugger.ts       # 事件调试器
│   │   └── UUIDGenerator.ts          # UUID生成器
│   └── events/                       # 事件系统
│       └── EventBus.ts               # 事件总线
├── public/assets/                    # 游戏资源
│   ├── game_config.json              # 🎯 中央资源配置
│   ├── audio/
│   │   └── audio-config.json         # 音频配置
│   ├── tilemap/scenes/
│   │   └── tilemap.json              # 关卡配置
│   └── ...                          # 其他资源文件
└── docs/                            # 文档目录
    ├── HOW_TO_BUILD.md              # 构建指南
    ├── TILEMAP_CONFIGURATION_GUIDE.md # 关卡配置指南
    ├── AUDIO_CONFIGURETION_GUIDE.md  # 音频配置指南
    ├── RESOURCE_MANAGEMENT_GUIDE.md   # 资源管理指南
    ├── CODE_EXTENSION_GUIDE.md       # 代码扩展指南
    ├── URL_PARAMETERS_GUIDE.md       # URL参数指南
    └── PROMPT.md                     # AI提示指南
```

## 🎯 核心系统详解

### 1. 🌐 统一资源管理系统

项目使用统一的资源管理系统，支持本地和远程资源的动态加载：

#### 核心特性
- **远程资源优先**: 自动优先使用CDN资源，本地资源作为备用
- **统一配置**: 所有资源在 `game_config.json` 中统一管理
- **智能解析**: 通过资源键自动解析实际路径
- **灵活部署**: 支持开发/生产环境无缝切换

#### 资源类型支持
- `ASSET_TYPE_STATIC_IMAGE` - 静态图片
- `ASSET_TYPE_ATLAS` - 精灵图集（含动画）
- `ASSET_TYPE_GROUND_ASSET_PACKAGE` - 地形资源包
- `ASSET_TYPE_AUDIO` - 音频文件

#### 配置示例
```json
{
  "assets": [
    {
      "type": "ASSET_TYPE_ATLAS",
      "id": 3,
      "name": "character_purple",
      "resources": [
        {
          "remote": {
            "key": "character_purple_image",
            "resource_type": "RESOURCE_TYPE_IMAGE",
            "url": "https://game-api.dev.knoffice.tech/game/api/public/assets/download?asset_id=3&asset_type=ASSET_TYPE_ATLAS&key=RESOURCE_TYPE_IMAGE"
          }
        }
      ]
    }
  ]
}
```

**⚠️ 重要提醒**: 不要直接修改 `game_config.json`！请使用提供的资源注册工具：
- `register_static_image_asset` - 注册静态图片
- `register_sprite_asset` - 注册精灵图集
- `register_ground_asset_package` - 注册地形包
- `register_audio_asset` - 注册音频文件

### 2. 🎵 智能音频系统

音频系统通过两个配置文件协同工作：

#### 配置文件关系
- **`game_config.json`**: 定义音频文件的实际路径（本地/远程）
- **`audio-config.json`**: 定义播放逻辑和映射关系

#### 自动播放机制
```json
{
  "audioTypes": {
    "bgm": {
      "sceneMapping": {
        "MainMenu": "menu_theme",
        "Game": "game_theme"
      }
    },
    "sfx": {
      "animationMapping": {
        "main_player": {
          "jump": ["player_jump"],
          "walk": ["player_walk_1", "player_walk_2"]
        }
      }
    }
  }
}
```

#### 播放流程
1. **BGM播放**: 场景切换时自动根据 `sceneMapping` 播放对应音乐
2. **SFX播放**: 动画播放时自动根据 `animationMapping` 触发音效
3. **资源解析**: 通过 `GlobalResourceManager` 解析音频文件路径

### 3. 🗺️ 数据驱动关卡系统

关卡通过JSON配置，支持7种游戏对象类型，按需拓展：

#### 支持的对象类型
1. **Player** (`type: "player"`) - 玩家角色
2. **Enemy** (`type: "enemy"`) - 敌人
3. **Collectible** (`type: "collectible"`) - 收集品
4. **Goal** (`type: "goal"`) - 目标点
5. **Hazard** (`type: "hazard"`) - 静态危险
6. **Obstacle** (`type: "obstacle"`) - 障碍物
7. **Trigger** (`type: "trigger"`) - 触发器

#### 配置示例
```json
{
  "type": "player",
  "name": "character_purple",
  "x": 384,
  "y": 960,
  "properties": [
    {"name": "max_health", "type": "int", "value": 3},
    {"name": "can_double_jump", "type": "bool", "value": true},
    {"name": "move_speed", "type": "int", "value": 200}
  ]
}
```

#### 资源引用系统
关卡配置使用资源键而非硬编码路径：
```json
{
  "tilesets": [
    {
      "name": "character_purple",
      "image": "character_purple_image"  // 资源键，非路径
    }
  ]
}
```

### 4. 🔧 代码扩展框架

项目提供完整的扩展框架，支持快速添加新功能：

#### 核心设计模式
- **单例模式**: 管理器类的全局状态管理
- **观察者模式**: EventBus实现组件间解耦通信
- **工厂模式**: 从tilemap数据创建游戏对象
- **组合模式**: 通过组件构建复杂行为

#### 抽象基类
```typescript
// BaseSprite - 通用游戏对象基类
export abstract class BaseSprite extends Phaser.Physics.Arcade.Sprite {
    protected uuid: string;
    protected properties: Map<string, any> = new Map();
    
    protected abstract setupPhysics(): void;
    // ... 通用功能
}

// BaseEnemy - 敌人基类
export abstract class BaseEnemy extends BaseSprite {
    protected health: number = 1;
    protected damage: number = 1;
    
    public abstract update(time: number, delta: number): void;
    // ... 敌人通用功能
}
```

### 5. 🌐 URL参数配置

支持通过URL参数进行游戏配置：

#### 支持的参数
- `debug=true` - 启用调试模式
- `level=1` - 直接跳转到指定关卡
- `project_id=160&api_host=game-api.dev.knoffice.tech` - 使用远程配置

#### 使用示例
```bash
# 调试模式 + 指定关卡
https://yourgame.com/?debug=true&level=2

# 远程配置 + 调试模式
https://yourgame.com/?project_id=160&api_host=game-api.dev.knoffice.tech&debug=true
```

## 🎮 游戏机制

### 玩家能力系统
- **基础移动**: 左右移动、跳跃
- **高级能力**: 二段跳、墙跳、滑墙、蓄力跳
- **战斗系统**: 射击、生命值管理
- **能力配置**: 通过tilemap属性控制

### 敌人AI系统
支持多种移动模式：
- `static` - 静止不动
- `patrol` - 来回巡逻
- `jump` - 原地跳跃
- `move_and_jump` - 青蛙式跳跃移动
- `follow` - 追踪玩家
- `follow_jump` - 跳跃追踪

### 触发器系统
支持动态交互：
- **移动触发器**: 控制对象移动
- **缩放触发器**: 改变对象大小
- **链式反应**: 通过延迟创建序列效果
- **UUID引用**: 精确控制目标对象

## 🛠️ 开发指南

### 添加新敌人类型

1. **创建敌人类**
```typescript
export class FlyingEnemy extends BaseEnemy {
    constructor(scene: Scene, tiledObject: Phaser.Types.Tilemaps.TiledObject) {
        super(scene, tiledObject);
        this.setGravityY(0); // 飞行敌人无重力
    }
    
    public update(time: number, delta: number): void {
        // 实现飞行逻辑
    }
    
    protected createDeathEffect(): void {
        // 死亡特效
    }
}
```

2. **注册到工厂**
```typescript
// 在 Game.ts 的 createObjectsFromTilemap() 中添加
case 'flying_enemy':
    const flyingEnemy = new FlyingEnemy(this, tiledObject);
    // 设置碰撞等
    break;
```

3. **配置资源**
```bash
# 使用资源注册工具
register_sprite_asset({
  asset_id: 25,
  config_path: "/path/to/game_config.json",
  description: "Flying enemy sprite"
});
```

## 🔧 故障排除

### 常见问题

#### 资源加载失败
```
❌ AudioManager: 无法解析音频资源路径: bgm_theme
```
**解决方案**:
- 检查 `audio-config.json` 中的资源键
- 确认 `game_config.json` 中有对应的资源定义
- 验证资源路径或URL的正确性

#### 角色显示为完整精灵图
```
❌ 角色显示为大图片而非动画帧
```
**解决方案**:
- 在tileset中添加 `"atlas": true` 属性
- 确保精灵图集的JSON文件存在
- 验证动画配置文件正确

#### 触发器不工作
```
❌ 触发器无法激活目标对象
```
**解决方案**:
- 检查target_uuid是否存在
- 确认触发器区域覆盖玩家路径
- 验证事件类型正确（"move"或"scale"）

### 调试工具

#### 启用调试模式
```bash
# URL参数启用
https://yourgame.com/?debug=true
```

#### 查看触发器区域
在 `src/game/sprites/Trigger.ts` 中取消注释：
```typescript
if (import.meta.env.DEV && !this.sprite) {
    this.createDebugVisualization();
}
```

## 📚 详细文档

项目提供完整的文档系统，涵盖各个方面：

| 文档 | 内容 | 适用场景 |
|------|------|----------|
| [HOW_TO_BUILD.md](./docs/HOW_TO_BUILD.md) | 构建和部署指南 | 项目设置、生产部署 |
| [TILEMAP_CONFIGURATION_GUIDE.md](./docs/TILEMAP_CONFIGURATION_GUIDE.md) | 关卡配置详解 | 关卡设计、对象配置 |
| [AUDIO_CONFIGURETION_GUIDE.md](./docs/AUDIO_CONFIGURETION_GUIDE.md) | 音频系统配置 | 音效管理、BGM配置 |
| [RESOURCE_MANAGEMENT_GUIDE.md](./docs/RESOURCE_MANAGEMENT_GUIDE.md) | 资源管理系统 | 资源配置、CDN部署 |
| [CODE_EXTENSION_GUIDE.md](./docs/CODE_EXTENSION_GUIDE.md) | 代码扩展指南 | 功能开发、架构理解 |
| [URL_PARAMETERS_GUIDE.md](./docs/URL_PARAMETERS_GUIDE.md) | URL参数配置 | 调试、测试配置 |
| [PROMPT.md](./docs/PROMPT.md) | AI开发指南 | AI辅助开发 |

### 快速导航

| 我想要... | 阅读这个文档 |
|-----------|-------------|
| 运行游戏 | [HOW_TO_BUILD.md](./docs/HOW_TO_BUILD.md) |
| 修改关卡 | [TILEMAP_CONFIGURATION_GUIDE.md](./docs/TILEMAP_CONFIGURATION_GUIDE.md) |
| 添加音效 | [AUDIO_CONFIGURETION_GUIDE.md](./docs/AUDIO_CONFIGURETION_GUIDE.md) |
| 管理资源 | [RESOURCE_MANAGEMENT_GUIDE.md](./docs/RESOURCE_MANAGEMENT_GUIDE.md) |
| 扩展功能 | [CODE_EXTENSION_GUIDE.md](./docs/CODE_EXTENSION_GUIDE.md) |
| 调试游戏 | [URL_PARAMETERS_GUIDE.md](./docs/URL_PARAMETERS_GUIDE.md) |

## 🚀 部署策略

### 开发环境
```json
{
  "local": {
    "key": "player_sprite",
    "public_path": "assets/player/character.png"
  }
}
```

### 生产环境
```json
{
  "remote": {
    "key": "player_sprite",
    "url": "https://game-api.dev.knoffice.tech/game/api/public/assets/download?asset_id=3&asset_type=ASSET_TYPE_ATLAS"
  }
}
```

### 混合部署
- 核心资源本地加载（快速启动）
- 可选资源远程加载（节省空间）
- 智能回退机制（网络异常时使用本地资源）

## 🎯 最佳实践

### 资源管理
- 使用资源注册工具，不要手动编辑配置文件
- 优先使用远程资源，本地资源作为备用
- 合理配置预加载策略

### 关卡设计
- 确保玩家起始位置安全
- 物理碰撞与视觉效果匹配
- 使用UUID系统管理对象引用
- 为精灵图集添加 `atlas: true` 属性

### 代码扩展
- 继承抽象基类减少重复代码
- 使用事件系统实现组件解耦
- 通过属性配置实现数据驱动
- 遵循单例模式管理全局状态

### 性能优化
- 限制同屏敌人数量（< 10个）
- 合理使用对象池
- 避免触发器重叠
- 优化资源加载策略

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📧 支持

如果遇到问题或需要帮助：
1. 查看相关文档
2. 检查常见问题解决方案
3. 在项目仓库中提交 Issue

---

**🎮 开始你的游戏开发之旅吧！**