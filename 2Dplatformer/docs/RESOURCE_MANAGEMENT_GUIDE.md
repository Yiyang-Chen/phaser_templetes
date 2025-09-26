# 📦 资源管理系统指南

## 概述

本项目使用统一的资源管理系统，支持本地和远程资源的动态加载。通过 `game_config.json` 配置文件，可以灵活控制资源的加载方式，实现渐进式部署和CDN优化。所有游戏中被使用到的资源都需要在`game_config.json`中有配置。不要直接修改`game_config.json`,阅读system_prompt中的`phase_3_collect_asset`了解如何使用工具配置`game_config.json`。

## 🏗️ 系统架构

### 核心组件

- **GlobalResourceManager**: 全局资源管理器，单例模式
- **GameConfigLoader**: 游戏配置加载器
- **LevelSceneConfigLoader**: 关卡场景配置加载器
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
   - 处理URL参数（`debug`, `level`, `project_id`, `api_host`）
   - 根据`project_id`和`api_host`参数决定加载本地或远程配置
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
        const projectId = this.urlParams.getParameter('project_id');
        const apiHost = this.urlParams.getParameter('api_host');
        
        if (projectId && apiHost) {
            const remoteConfigUrl = `https://${apiHost}/game/api/public/projects/${projectId}/game_config?env=dev`;
            console.log('[Boot] 检测到project_id和api_host参数，尝试从远程加载配置:', remoteConfigUrl);
            this.loadRemoteGameConfig(remoteConfigUrl);
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
│   └── LevelSceneConfigLoader.ts  # 关卡场景配置加载器
├── CustomLoadFile/                 # 自定义文件类型
│   ├── AudioConfigFile.ts         # 音频配置文件
│   ├── CustomTilemapFile.ts       # 自定义Tilemap文件
│   └── SpriteAtlasFile.ts         # 精灵图集文件
├── utils/                          # 工具类
│   └── AudioLoader.ts             # 音频加载工具
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
      "type": "ASSET_TYPE_ATLAS",
      "id": 3,
      "name": "character_purple",
      "resources": [
        {
          "local": {
            "key": "character_purple_image",
            "resource_type": "RESOURCE_TYPE_IMAGE",
            "public_path": "assets/player/character_purple.png"
          }
        },
        {
          "remote": {
            "key": "character_purple_json",
            "resource_type": "RESOURCE_TYPE_ATLAS_JSON",
            "url": "https://game-api.dev.knoffice.tech/game/api/public/assets/download?asset_id=3&asset_type=ASSET_TYPE_ATLAS&key=RESOURCE_TYPE_ATLAS_JSON"
          }
        },
        {
          "remote": {
            "key": "character_purple_animators",
            "resource_type": "RESOURCE_TYPE_ATLAS_JSON",
            "url": "https://game-api.dev.knoffice.tech/game/api/public/assets/download?asset_id=3&asset_type=ASSET_TYPE_ATLAS&key=RESOURCE_TYPE_ANIMATION_JSON"
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
            "resource_type": "RESOURCE_TYPE_TILEMAP",
            "public_path": "assets/tilemap/scenes/tilemap.json"
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
    "resource_type": "RESOURCE_TYPE_IMAGE|RESOURCE_TYPE_ATLAS_JSON|RESOURCE_TYPE_ANIMATION_JSON|RESOURCE_TYPE_AUDIO|RESOURCE_TYPE_TILEMAP",
    "public_path": "assets/path/to/file.ext"
  }
}
```

#### 2. 远程资源 (remote)
```json
{
  "remote": {
    "key": "resource_key", 
    "resource_type": "RESOURCE_TYPE_IMAGE|RESOURCE_TYPE_ATLAS_JSON|RESOURCE_TYPE_ANIMATION_JSON|RESOURCE_TYPE_AUDIO|RESOURCE_TYPE_TILEMAP",
    "url": "https://game-api.dev.knoffice.tech/game/api/public/assets/download?asset_type=...&asset_id=...&key=..."
  }
}
```

**API下载规则**：
- **固定host**: `https://game-api.dev.knoffice.tech`
- **路径**: `/game/api/public/assets/download`
- **查询参数**：
  - `asset_type`（必填）：使用枚举格式 `ASSET_TYPE_STATIC_IMAGE`、`ASSET_TYPE_ATLAS`、`ASSET_TYPE_GROUND_ASSET_PACKAGE`、`ASSET_TYPE_AUDIO`
  - `asset_id`（必填）：目标素材或素材包的数字ID
  - `key`（选填）：
    - Atlas 可用 `RESOURCE_TYPE_IMAGE` / `RESOURCE_TYPE_ATLAS_JSON` / `RESOURCE_TYPE_ANIMATION_JSON`
    - ground_asset_package 需传资源项的名称，并拼接文件类型如`.png`
    - image/audio 类型忽略该参数

## 🌐 API下载规则详解

### 基础URL构成
所有远程资源的下载链接由以下部分组成：
- **固定host**: `https://game-api.dev.knoffice.tech`
- **固定路径**: `/game/api/public/assets/download`
- **查询参数**: 根据资源类型动态构建

### 查询参数规则

#### asset_type（必填）
资源类型参数，使用枚举格式，支持以下值：
- `ASSET_TYPE_STATIC_IMAGE` - 静态图片资源
- `ASSET_TYPE_ATLAS` - 精灵资源（包含图片、图集配置、动画配置）
- `ASSET_TYPE_GROUND_ASSET_PACKAGE` - 地形资源包
- `ASSET_TYPE_AUDIO` - 音频资源

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
https://game-api.dev.knoffice.tech/game/api/public/assets/download?asset_id=3&asset_type=ASSET_TYPE_ATLAS&key=RESOURCE_TYPE_IMAGE

# 精灵图集配置
https://game-api.dev.knoffice.tech/game/api/public/assets/download?asset_id=3&asset_type=ASSET_TYPE_ATLAS&key=RESOURCE_TYPE_ATLAS_JSON

# 精灵动画配置
https://game-api.dev.knoffice.tech/game/api/public/assets/download?asset_id=3&asset_type=ASSET_TYPE_ATLAS&key=RESOURCE_TYPE_ANIMATION_JSON

# 地形资源包中的具体文件
https://game-api.dev.knoffice.tech/game/api/public/assets/download?asset_id=1&asset_type=ASSET_TYPE_GROUND_ASSET_PACKAGE&key=terrain_grass_block_center.png

# 静态图片（无需key参数）
https://game-api.dev.knoffice.tech/game/api/public/assets/download?asset_id=76&asset_type=ASSET_TYPE_STATIC_IMAGE

# 音频文件（无需key参数）
https://game-api.dev.knoffice.tech/game/api/public/assets/download?asset_id=201&asset_type=ASSET_TYPE_AUDIO
```

## 🔧 使用方式

### 1. 配置资源

⚠️ **重要提醒**: **禁止直接修改 `game_config.json` 文件！**

系统提供了专门的工具来管理不同类型的资源，请使用对应的工具进行资源配置：

#### 支持的资源类型及对应工具：

**1. ASSET_TYPE_STATIC_IMAGE - 静态图片资源**
- 使用工具: `register_static_image_asset`
- 参数: asset_id, config_path, description, tileset_properties, object_type, object_properties, entry_type

**2. ASSET_TYPE_ATLAS - 精灵资源（图集）**
- 使用工具: `register_sprite_asset`
- 参数: asset_id, config_path, description, tileset_properties, object_type, object_properties
- 自动生成: {name}_image, {name}_json, {name}_animators

**3. ASSET_TYPE_GROUND_ASSET_PACKAGE - 地形资源包**
- 使用工具: `register_ground_asset_package`
- 参数: asset_id, config_path, description, tileset_properties, purpose

**4. ASSET_TYPE_AUDIO - 音频资源**
- 使用工具: `register_audio_asset`
- 参数: asset_id, config_path, description, purpose

#### 工具使用示例：

```typescript
// 注册静态图片资源
register_static_image_asset({
  asset_id: 105,
  config_path: "/absolute/path/to/game_config.json",
  description: "Background image for level 1",
  tileset_properties: '[{"key":"collision","type":"bool","value":false}]',
  object_type: "background",
  object_properties: '[{"key":"layer","type":"int","value":0}]',
  entry_type: "object"
});

// 注册精灵图集资源
register_sprite_asset({
  asset_id: 20,
  config_path: "/absolute/path/to/game_config.json", 
  description: "Frog character with animations",
  tileset_properties: '[{"key":"collision","type":"bool","value":true}]',
  object_type: "enemy",
  object_properties: '[{"key":"health","type":"int","value":100}]'
});
```

这些工具会自动：
- 从远程API获取资源详情
- 生成正确的下载URL
- 更新 `game_config.json` 配置
- 处理tilemap集成配置

### 2. 在其他配置文件中引用

使用工具注册资源后，修改其他配置文件使用生成的resource key进行引用：

#### tilemap.json 中使用key引用：
```json
{
  "tilesets": [
    {
      "name": "terrain_grass_block_center",
      "image": "terrain_grass_block_center"  // 工具自动生成的key
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
        "url": "bgm_baltic_levity",  // 工具自动生成的key
        "preload": true,
        "volume": 0.7,
        "loop": true
      }
    }
  }
}
```

⚠️ **注意**: `game_config.json`中这些key是由对应的注册工具自动生成的，请不要手动修改`game_config.json`。修改`tilempa.json`以及`sudio_config.json`文件以匹配`game_config.json`的key

### 3. 程序中获取资源路径

```typescript
import { GlobalResourceManager } from './resourceManager/GlobalResourceManager';

const resourceManager = GlobalResourceManager.getInstance();

// 获取资源实际路径（优先返回远程资源）
const imagePath = resourceManager.getResourcePath('character_purple_image');
// 返回: 优先 "https://game-api.dev.knoffice.tech/game/api/public/assets/download?..." 

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
    "public_path": "assets/player/character.png"
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
            "url": "https://game-api.dev.knoffice.tech/game/api/public/assets/download?asset_id=3&asset_type=ASSET_TYPE_ATLAS&key=RESOURCE_TYPE_IMAGE"
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
            "public_path": "assets/core/player.png"
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
            "url": "https://game-api.dev.knoffice.tech/game/api/public/assets/download?asset_id=201&asset_type=ASSET_TYPE_AUDIO"
          }
        }
      ]
    }
  ]
}
```

## 🔄 迁移指南

### 从硬编码路径迁移

**步骤1**: 使用对应工具注册资源
```typescript
// 注册地形资源包
register_ground_asset_package({
  asset_id: 1,
  config_path: "/path/to/game_config.json",
  description: "Grass terrain tiles",
  tileset_properties: '[{"key":"collision","type":"bool","value":true}]'
});

// 注册音频资源
register_audio_asset({
  asset_id: 201,
  config_path: "/path/to/game_config.json",
  description: "Background music for menu"
});
```

**步骤2**: 更新其他配置文件
```json
// tilemap.json - 使用生成的key
{
  "image": "grass_tile"  // ✅ 工具生成的key
}

// audio-config.json - 使用生成的key
{
  "url": "background_music"  // ✅ 工具生成的key  
}
```

⚠️ **重要**: 不要手动编辑 `game_config.json`，必须使用提供的工具进行资源管理。

## 🛠️ 资源管理工具详解

### 工具使用规则

1. **绝对路径**: 所有工具的 `config_path` 参数必须使用绝对路径
2. **资源描述**: `description` 参数是必填的，用于说明资源用途
3. **Tilemap集成**: 除音频外，所有工具都支持tilemap相关配置
4. **自动URL生成**: 工具会自动生成正确的远程下载URL
5. **配置验证**: 工具会验证asset_id的有效性和资源的存在性

### 工具参数详解

#### 通用参数
- `asset_id`: 资源在系统中的唯一ID（必填）
- `config_path`: game_config.json的绝对路径（必填）
- `description`: 资源用途描述（必填）

#### Tilemap相关参数（适用于视觉资源）
- `tileset_properties`: JSON数组，定义tileset属性，格式：`[{"key":"属性名","type":"数据类型","value":"属性值"}]`
- `object_type`: 对象层中的类型名称（用于sprite和static image）
- `object_properties`: JSON数组，定义对象属性，格式同tileset_properties
- `entry_type`: "tile"或"object"，指示在tilemap中的引用方式（仅static image）

#### 可选参数
- `purpose`: 资源用途的额外说明

### 错误处理

工具会进行以下验证：
- asset_id必须为正数
- config_path必须是绝对路径且文件存在
- description不能为空
- tileset_properties和object_properties必须是有效的JSON数组
- 远程资源必须可访问

## 🛠️ 自定义加载器

### AudioLoader 工具类

AudioLoader 是音频加载工具类，提供以下核心功能：

#### 主要特性
- **多格式支持**: 自动为音频URL添加格式参数（.mp3、.ogg、.wav），让Phaser选择最佳格式
- **URL缓存**: 避免重复加载相同URL的音频资源
- **别名系统**: 支持多个key指向同一个音频资源，节省内存
- **延迟别名处理**: 处理音频加载完成后的别名创建

#### API 使用

```typescript
import { AudioLoader } from '../utils/AudioLoader';

// 加载多格式音频
AudioLoader.loadMultiFormat(loader, audioKey, actualPath);

// 获取实际的音频key（处理别名）
const actualKey = AudioLoader.getActualKey(aliasKey);

// 处理加载完成后的待处理别名
AudioLoader.processPendingAliases(originalKey, scene);

// 清理缓存（测试用）
AudioLoader.clearCache();
```

#### 在自定义加载器中使用

```typescript
// 在AudioConfigFile中的使用示例
private async notifyAudioManagerForPreload(config: AudioConfig): Promise<void> {
    const audioManager = AudioManager.getInstance();
    
    try {
        // 通过AudioManager调用AudioLoader
        await audioManager.preloadFromConfig(config, this.audioType, this.loader.scene);
    } catch (error) {
        console.error('❌ AudioConfig: AudioManager预加载失败:', error);
    }
}
```

### 创建新的资源类型加载器

```typescript
// src/game/resourceManager/CustomLoader/MyCustomLoader.ts
import { Loader } from 'phaser';
import { GlobalResourceManager } from '../GlobalResourceManager';
import { AudioLoader } from '../utils/AudioLoader';

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
                    // 根据资源类型选择合适的加载方式
                    const resource = resourceManager.getResource(resourceKey);
                    const resourceType = resource?.local?.resource_type || resource?.remote?.resource_type;
                    
                    if (resourceType === 'RESOURCE_TYPE_AUDIO') {
                        // 使用AudioLoader处理音频
                        AudioLoader.loadMultiFormat(this, resourceKey, actualPath);
                    } else {
                        // 其他资源类型
                        this.image(resourceKey, actualPath);
                    }
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

### 2. 音频资源最佳实践
- **使用AudioLoader**: 所有音频加载都应通过AudioLoader工具类
- **URL格式**: 确保音频URL支持格式参数（`&format=.mp3`）
- **缓存策略**: 利用AudioLoader的URL缓存避免重复加载
- **别名管理**: 对于相同音频的多个引用，使用别名系统节省内存

```typescript
// ✅ 推荐：使用AudioLoader
AudioLoader.loadMultiFormat(loader, 'bgm_theme', actualPath);

// ❌ 不推荐：直接使用Phaser加载器
loader.audio('bgm_theme', actualPath);
```

## 🔍 调试和故障排除

### 常见问题

#### 1. 资源加载失败
```
❌ AudioManager: 无法解析音频资源路径: bgm_theme
```

**解决方案**：
- 检查 `audio_config.json` 中是否定义了对应的key
- 检查 `game_config.json` 中是否定义了 `audio_config.json` 需要的key
- 确认key名称拼写正确
- 验证资源路径是否存在，url是否正确

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
---

通过统一的资源管理系统，项目实现了灵活的资源部署策略，支持从开发到生产的无缝切换，为游戏的扩展和优化提供了强大的基础。
