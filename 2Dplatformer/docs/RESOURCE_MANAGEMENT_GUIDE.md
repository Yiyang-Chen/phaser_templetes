# 📦 资源管理系统指南

## 概述

本项目使用统一的资源管理系统，支持本地和远程资源的动态加载。通过 `game_config.json` 配置文件，可以灵活控制资源的加载方式，实现渐进式部署和CDN优化。

## 🏗️ 系统架构

### 核心组件

- **GlobalResourceManager**: 全局资源管理器，单例模式
- **GameConfigLoader**: 游戏配置加载器
- **LevelSceneConfigLoader**: 关卡场景配置加载器（新增）
- **CustomLoaders**: 自定义资源加载器集合
- **game_config.json**: 中央资源配置文件

### 加载流程

```
Boot Scene (preload) → 
处理URL参数 → 
加载 game_config.json (本地/远程) → 
初始化 GlobalResourceManager → 
Boot Scene (create) → 
Preloader Scene → 使用自定义加载器 → 
从全局字典解析实际路径 → 加载资源
```

#### 详细流程说明

1. **Boot Scene - preload()阶段**
   - 处理URL参数（`debug`, `level`, `dev_game_config_token`）
   - 根据`dev_game_config_token`参数决定加载本地或远程配置
   - 使用`GameConfigLoader`加载`game_config.json`
   - Phaser自动管理加载队列，无需手动调用`start()`

2. **Boot Scene - create()阶段**
   - 所有资源（包括game_config）已加载完成
   - `GlobalResourceManager`已初始化完成
   - 启动Preloader场景

3. **Preloader Scene**
   - 使用自定义加载器加载游戏资源
   - 通过`GlobalResourceManager`解析资源键到实际路径
   - 支持本地和远程资源混合加载

#### Boot场景代码示例

```typescript
// Boot.ts - 游戏启动场景
export class Boot extends Scene {
    private urlParams: URLParameterManager;

    constructor() {
        super('Boot');
        this.urlParams = URLParameterManager.getInstance();
    }

    preload() {
        // 加载基础资源
        this.load.image('background', 'assets/bg.png');
        
        // 处理URL参数
        this.handleURLParameters();
        
        // 加载游戏配置（支持远程配置）
        this.loadGameConfig();
        
        // Phaser 自动管理加载队列和进度
    }

    create() {
        // 所有资源（包括game_config）已加载完成
        console.log('[Boot] 游戏配置加载完成，启动Preloader...');
        this.scene.start('Preloader');
    }

    private loadGameConfig(): void {
        const devConfigUrl = this.urlParams.getParameter('dev_game_config_token');
        
        if (devConfigUrl) {
            console.log('[Boot] 检测到dev_game_config_token参数，尝试从远程加载配置');
            this.loadRemoteGameConfig(devConfigUrl);
        } else {
            console.log('[Boot] 使用本地游戏配置文件');
            this.loadLocalGameConfig();
        }
    }

    private loadRemoteGameConfig(url: string): void {
        // 验证URL格式
        try {
            new URL(url);
        } catch (urlError) {
            console.warn('[Boot] 无效的URL格式，使用本地配置:', url);
            this.loadLocalGameConfig();
            return;
        }

        // 使用GameConfigLoader加载远程配置
        this.load.gameConfig('remote-game-config', url);
        
        // 监听加载错误，失败时回退到本地配置
        this.load.once('loaderror', (file: any) => {
            if (file.key === 'remote-game-config') {
                console.warn('[Boot] 远程配置加载失败，回退到本地配置');
                this.loadLocalGameConfig();
            }
        });
    }

    private loadLocalGameConfig(): void {
        this.load.gameConfig('game-config', 'assets/game_config.json');
    }
}
```

## 📁 文件结构

```
src/game/resourceManager/
├── GlobalResourceManager.ts        # 全局资源管理器
├── LoaderExtensions.ts            # 加载器扩展注册
├── CustomLoader/                   # 自定义加载器
│   ├── AudioConfigLoader.ts       # 音频配置加载器
│   ├── CustomTileMapLoader.ts     # Tilemap加载器
│   ├── CustomSpriteAtlasLoader.ts # 精灵图集加载器
│   ├── GameConfigLoader.ts        # 游戏配置加载器
│   └── LevelSceneConfigLoader.ts  # 关卡场景配置加载器（新增）
├── CustomLoadFile/                 # 自定义文件类型
│   ├── AudioConfigFile.ts         # 音频配置文件
│   ├── CustomTilemapFile.ts       # 自定义Tilemap文件
│   └── SpriteAtlasFile.ts         # 精灵图集文件
└── docs/                          # 文档
    ├── CustomLoader.md
    └── README.md

public/assets/
├── game_config.json               # 🎯 中央资源配置
├── tilemap/scenes/tilemap.json    # 使用key引用资源
└── audio/audio-config.json        # 使用key引用资源
```

## ⚙️ 配置文件格式

### game_config.json 结构

```json
{
  "assets": [
    {
      "type": "sprite",
      "id": 3,
      "name": "character_purple",
      "resources": [
        {
          "local": {
            "key": "character_purple_image",
            "resource_type": "image",
            "full_path": "assets/player/character_purple.png"
          }
        },
        {
          "remote": {
            "key": "character_purple_json",
            "resource_type": "json",
            "url": "https://game-api.dev.knoffice.tech/game/api/v1/assets/download?asset_type=sprite&asset_id=3&key=atlas_json"
          }
        }
      ]
    }
  ],
  "scenes": [
    {
      "key": "level1",
      "name": "level1",
      "description": "level1 haha",
      "resources": [
        {
          "local": {
            "key": "level1_tilemap",
            "resource_type": "tilemap",
            "full_path": "assets/tilemap/scenes/tilemap.json"
          }
        }
      ]
    }
  ]
}
```

### 资源类型支持

#### 1. 本地资源 (local)
```json
{
  "local": {
    "key": "resource_key",
    "resource_type": "image|json|audio|tilemap",
    "full_path": "assets/path/to/file.ext"
  }
}
```

#### 2. 远程资源 (remote)
```json
{
  "remote": {
    "key": "resource_key", 
    "resource_type": "image|json|audio|tilemap",
    "url": "https://game-api.dev.knoffice.tech/game/api/v1/assets/download?asset_type=...&asset_id=...&key=..."
  }
}
```

**API下载规则**：
- **固定host**: `https://game-api.dev.knoffice.tech`
- **路径**: `/game/api/v1/assets/download`
- **查询参数**：
  - `asset_type`（必填）：不区分大小写，接受 `static_image`、`atlas`、`sprite/sprites`、`ground_asset_package`、`audio` 或 `ASSET_TYPE_*` 枚举字符串
  - `asset_id`（必填）：目标素材或素材包的数字ID
  - `key`（选填）：
    - Atlas 可用 `image` / `atlas_json` / `animation_json`
    - ground_asset_package 需传资源项的名称，并拼接文件类型如`.png`
    - image/audio 类型忽略该参数

## 🌐 API下载规则详解

### 基础URL构成
所有远程资源的下载链接由以下部分组成：
- **固定host**: `https://game-api.dev.knoffice.tech`
- **固定路径**: `/game/api/v1/assets/download`
- **查询参数**: 根据资源类型动态构建

### 查询参数规则

#### asset_type（必填）
资源类型参数，不区分大小写，支持以下值：
- `static_image` - 静态图片资源
- `atlas` - 图集资源（已废弃，建议使用sprite）
- `sprite` 或 `sprites` - 精灵资源（包含图片、图集配置、动画配置）
- `ground_asset_package` - 地形资源包
- `audio` - 音频资源
- `ASSET_TYPE_*` - 枚举字符串格式

#### asset_id（必填）
目标素材或素材包的数字ID，对应`game_config.json`中定义的资源ID。

#### key（选填）
根据资源类型决定是否需要：

**Sprite类型资源**：
- `image` - 获取精灵图片
- `atlas_json` - 获取图集配置JSON
- `animation_json` - 获取动画配置JSON

**Ground Asset Package类型**：
- 需要传入具体的资源项名称，并拼接文件扩展名
- 例如：`terrain_grass_block_center.png`

**Static Image和Audio类型**：
- 忽略此参数，直接返回对应的文件

### 完整URL示例

```bash
# 精灵图片
https://game-api.dev.knoffice.tech/game/api/v1/assets/download?asset_type=sprite&asset_id=3&key=image

# 精灵图集配置
https://game-api.dev.knoffice.tech/game/api/v1/assets/download?asset_type=sprite&asset_id=3&key=atlas_json

# 精灵动画配置
https://game-api.dev.knoffice.tech/game/api/v1/assets/download?asset_type=sprite&asset_id=3&key=animation_json

# 地形资源包中的具体文件
https://game-api.dev.knoffice.tech/game/api/v1/assets/download?asset_type=ground_asset_package&asset_id=1&key=terrain_grass_block_center.png

# 静态图片（无需key参数）
https://game-api.dev.knoffice.tech/game/api/v1/assets/download?asset_type=static_image&asset_id=76

# 音频文件（无需key参数）
https://game-api.dev.knoffice.tech/game/api/v1/assets/download?asset_type=audio&asset_id=201
```

## 🔧 使用方式

### 1. 配置资源

在 `game_config.json` 中添加新资源：

```json
{
  "type": "static_image",
  "id": 105,
  "name": "new_sprite",
  "resources": [
    {
      "local": {
        "key": "new_sprite_key",
        "resource_type": "image",
        "full_path": "assets/sprites/new_sprite.png"
      }
    }
  ]
}
```

### 2. 在其他配置文件中引用

#### tilemap.json 中使用key引用：
```json
{
  "tilesets": [
    {
      "name": "terrain_grass_block_center",
      "image": "terrain_grass_block_center"  // 使用key而不是路径
    }
  ]
}
```

#### audio-config.json 中使用key引用：
```json
{
  "assets": {
    "bgm": {
      "menu_theme": {
        "url": "bgm_baltic_levity",  // 使用key而不是路径
        "preload": true,
        "volume": 0.7,
        "loop": true
      }
    }
  }
}
```

### 3. 程序中获取资源路径

```typescript
import { GlobalResourceManager } from './resourceManager/GlobalResourceManager';

const resourceManager = GlobalResourceManager.getInstance();

// 获取资源实际路径（优先返回远程资源）
const imagePath = resourceManager.getResourcePath('character_purple_image');
// 返回: 优先 "https://game-api.dev.knoffice.tech/game/api/v1/assets/download?..." 

// 获取资源配置
const resource = resourceManager.getResource('character_purple_image');
// 返回完整的ResourceConfig对象

// 根据ID获取asset配置
const asset = resourceManager.getAsset(3);

// 根据key获取scene配置  
const scene = resourceManager.getScene(1);  // 使用数字key
```

### 4. 使用关卡场景配置加载器

```typescript
// 在 Preloader.ts 中
import { getDefaultLevelNumber } from '../resourceManager/CustomLoader/LevelSceneConfigLoader';

export class Preloader extends Scene {
    preload() {
        // 根据URL参数或默认关卡加载场景资源
        const urlParams = URLParameterManager.getInstance();
        const levelNumber = urlParams.hasLevel() ? 
            urlParams.getLevel() : getDefaultLevelNumber();
        
        // 使用关卡场景配置加载器
        this.load.levelSceneConfig('level-scene', levelNumber);
        
        // 其他资源加载...
    }
}
```

## 🚀 部署策略

### 开发环境
所有资源使用 `local` 配置，从本地路径加载：

```json
{
  "local": {
    "key": "character_image",
    "resource_type": "image", 
    "full_path": "assets/player/character.png"
  }
}
```

### 生产环境
关键资源使用 `remote` 配置，从CDN加载：

```json
{
  "remote": {
    "key": "character_image",
    "resource_type": "image",
    "url": "https://game-api.dev.knoffice.tech/game/api/v1/assets/download?asset_type=sprite&asset_id=3&key=image"
  }
}
```

### 🆕 远程资源优先策略

系统现在实现了智能的远程资源优先加载策略：

#### 1. 资源优先级规则
- **远程资源优先**: 如果资源同时有 `remote` 和 `local` 配置，优先使用远程版本
- **本地资源备用**: 只有在没有远程配置时才使用本地资源
- **统一Key映射**: 对于 tilemap 资源，自动将配置中的任意key映射为统一的 `'tilemap'` key

#### 2. 加载顺序优化
```typescript
// LevelSceneConfigLoader 的加载策略
const remoteResources = sceneConfig.resources.filter(resource => resource.remote);
const localResources = sceneConfig.resources.filter(resource => resource.local);

// 第一轮：优先加载所有远程资源
remoteResources.forEach(resource => {
    // 加载远程资源
});

// 第二轮：只加载没有远程配置的本地资源
localResources.forEach(resource => {
    if (!resource.remote && resource.local) {  // 避免重复加载
        // 加载本地资源
    }
});
```

#### 3. Tilemap Key 统一映射
```typescript
// 配置文件中的原始key: "level1_tilemap"
// 加载时自动映射为: "tilemap"
// 确保与 Game.ts 中的使用一致: this.make.tilemap({ key: 'tilemap' })
```

### 混合部署
核心资源本地加载，可选资源远程加载：

```json
{
  "assets": [
    {
      "name": "core_assets",
      "resources": [
        {
          "local": {
            "key": "player_sprite",
            "full_path": "assets/core/player.png"
          }
        }
      ]
    },
    {
      "name": "optional_assets", 
      "resources": [
        {
          "remote": {
            "key": "background_music",
            "url": "https://game-api.dev.knoffice.tech/game/api/v1/assets/download?asset_type=audio&asset_id=201"
          }
        }
      ]
    }
  ]
}
```

## 🔄 迁移指南

### 从硬编码路径迁移

#### 1. 原有方式（已废弃）
```json
// tilemap.json
{
  "image": "assets/tilemap/tiles/grass.png"  // ❌ 硬编码路径
}

// audio-config.json  
{
  "url": "assets/audio/bgm/music.mp3"       // ❌ 硬编码路径
}
```

#### 2. 新方式（推荐）
```json
// game_config.json - 定义资源
{
  "assets": [
    {
      "resources": [
        {
          "local": {
            "key": "grass_tile",
            "full_path": "assets/tilemap/tiles/grass.png"
          }
        },
        {
          "local": {
            "key": "background_music",
            "full_path": "assets/audio/bgm/music.mp3"
          }
        }
      ]
    }
  ]
}

// tilemap.json - 使用key引用
{
  "image": "grass_tile"  // ✅ 使用key引用
}

// audio-config.json - 使用key引用
{
  "url": "background_music"  // ✅ 使用key引用  
}
```

## 🛠️ 自定义加载器

### 创建新的资源类型加载器

```typescript
// src/game/resourceManager/CustomLoader/MyCustomLoader.ts
import { Loader } from 'phaser';
import { GlobalResourceManager } from '../GlobalResourceManager';

export function registerMyCustomLoader(): void {
    Loader.LoaderPlugin.prototype.myCustom = function(key: string, configPath: string) {
        // 加载配置文件
        this.json(key, configPath);
        
        // 监听加载完成
        this.once('filecomplete-json-' + key, (fileKey: string, type: string, data: any) => {
            const resourceManager = GlobalResourceManager.getInstance();
            
            // 处理配置中的资源引用
            data.resources?.forEach((resourceKey: string) => {
                const actualPath = resourceManager.getResourcePath(resourceKey);
                if (actualPath) {
                    // 添加到加载队列
                    this.image(resourceKey, actualPath);
                }
            });
        });

        return this;
    };
}

// 在 LoaderExtensions.ts 中注册
import { registerMyCustomLoader } from './CustomLoader/MyCustomLoader';

export function extendLoader() {
    registerMyCustomLoader();
    // ... 其他加载器
}
```

## 🎯 最佳实践

### 1. 资源命名规范
- 使用描述性的key名称：`character_purple_image` 而不是 `img1`
- 保持一致的命名模式：`{object}_{type}_{variant}`
- 避免特殊字符和空格

### 2. 配置组织
- 按功能分组资源：`ui_assets`, `game_assets`, `audio_assets`
- 使用有意义的ID：按功能区间分配（1-100: UI, 101-200: 游戏对象）
- 保持配置文件的可读性

### 3. 性能优化
- 预加载关键资源，懒加载可选资源
- 合理使用本地/远程混合策略
- 监控资源加载性能和失败率

### 4. 版本管理
- 在远程URL中包含版本号或hash
- 使用CDN的缓存控制策略
- 保持本地fallback资源

## 🔍 调试和故障排除

### 常见问题

#### 1. 资源加载失败
```
❌ AudioManager: 无法解析音频资源路径: bgm_theme
```

**解决方案**：
- 检查 `game_config.json` 中是否定义了对应的key
- 确认key名称拼写正确
- 验证资源路径是否存在

#### 2. 路径解析错误
```
❌ CustomTilemap: 无法找到资源key对应的路径: grass_tile
```

**解决方案**：
- 确保 `GlobalResourceManager` 已正确初始化
- 检查Boot场景是否正确加载了 `game_config.json`
- 验证资源配置格式是否正确

#### 3. 加载顺序问题
```
❌ GlobalResourceManager: 未找到资源key: player_sprite
```

**解决方案**：
- 确保在Boot场景中加载 `game_config.json`
- 在Preloader场景中使用资源前，确保配置已加载完成
- 检查加载器的注册顺序

### 调试工具

启用调试日志查看资源加载过程：

```typescript
// 在浏览器控制台中
localStorage.setItem('debug_resources', 'true');

// 重新加载页面查看详细日志
```

## 📈 未来扩展

### 计划功能
- [ ] 资源版本管理和缓存策略
- [ ] 资源加载进度和错误统计
- [ ] 动态资源热更新
- [ ] 资源压缩和优化
- [ ] 多语言资源支持

### 扩展点
- 添加新的资源类型支持
- 实现自定义缓存策略
- 集成资源监控和分析
- 支持资源的条件加载

---

通过统一的资源管理系统，项目实现了灵活的资源部署策略，支持从开发到生产的无缝切换，为游戏的扩展和优化提供了强大的基础。
