# Phaser 自定义加载器开发指南

> **注意**: 本项目的加载器系统位于 `src/game/resourceManager/` 目录中，已从原来的 `loaders/` 重命名为 `resourceManager/` 以更好地反映其职责范围。

## 概述

本文档介绍如何在Phaser中创建完全自定义的加载器，使其能够像原生的 `this.load.image()` 一样触发标准的Phaser事件并完全集成到加载系统中。

## 核心原理

Phaser的LoaderPlugin基于**文件类型系统**，每个 `this.load.*` 方法实际上都是：

1. **创建一个File对象**（继承自 `Phaser.Loader.File`）
2. **将File添加到加载队列**（通过 `this.addFile()`）
3. **File完成时自动触发标准事件**：`filecomplete-{type}-{key}`

## 实现步骤

### 1. 创建自定义文件类型

```typescript
// 示例：配置包加载器
class ConfigPackFile extends Phaser.Loader.File {
    constructor(loader: Phaser.Loader.LoaderPlugin, key: string, url: string) {
        const fileConfig = {
            type: 'configPack',  // 自定义类型名
            cache: loader.scene.cache.json,  // 存储到哪个cache
            extension: 'json',
            responseType: 'text',
            key: key,
            url: url
        };

        super(loader, fileConfig);
    }

    // 处理加载完成的数据
    onProcess(): void {
        try {
            const configData = JSON.parse(this.xhrLoader.responseText);
            
            // 处理配置数据，比如动态加载更多资源
            this.processConfigData(configData);
            
            // 存储到cache
            this.data = configData;
            
            // 标记为完成 - 这会自动触发 filecomplete-configPack-{key} 事件！
            this.onProcessComplete();
        } catch (error) {
            console.error(`配置包处理失败: ${this.key}`, error);
            this.onProcessError();
        }
    }

    private processConfigData(config: any): void {
        // 根据配置动态添加更多资源到加载队列
        if (config.assets) {
            config.assets.forEach((asset: any) => {
                switch (asset.type) {
                    case 'image':
                        this.loader.image(asset.key, asset.url);
                        break;
                    case 'audio':
                        this.loader.audio(asset.key, asset.url);
                        break;
                    case 'atlas':
                        this.loader.atlas(asset.key, asset.image, asset.atlas);
                        break;
                }
            });
        }
    }
}
```

### 2. 注册自定义加载方法

```typescript
// 扩展LoaderPlugin类型定义
declare module 'phaser' {
    namespace Loader {
        interface LoaderPlugin {
            configPack(key: string, url: string): LoaderPlugin;
            levelPack(key: string, url: string, options?: any): LoaderPlugin;
            spriteBundle(key: string, url: string): LoaderPlugin;
        }
    }
}

// 注册自定义加载方法
export function registerCustomLoaders() {
    // 配置包加载器
    Phaser.Loader.LoaderPlugin.prototype.configPack = function(
        key: string, 
        url: string
    ): Phaser.Loader.LoaderPlugin {
        const file = new ConfigPackFile(this, key, url);
        this.addFile(file);  // 关键：添加到加载队列
        return this;
    };

    // 关卡包加载器
    Phaser.Loader.LoaderPlugin.prototype.levelPack = function(
        key: string, 
        url: string, 
        options: any = {}
    ): Phaser.Loader.LoaderPlugin {
        const file = new LevelPackFile(this, key, url, options);
        this.addFile(file);
        return this;
    };

    // 精灵包加载器
    Phaser.Loader.LoaderPlugin.prototype.spriteBundle = function(
        key: string, 
        url: string
    ): Phaser.Loader.LoaderPlugin {
        const file = new SpriteBundleFile(this, key, url);
        this.addFile(file);
        return this;
    };
}
```

### 3. 复杂自定义文件类型示例

```typescript
// 关卡包文件类型
class LevelPackFile extends Phaser.Loader.File {
    private options: any;

    constructor(loader: Phaser.Loader.LoaderPlugin, key: string, url: string, options: any) {
        const fileConfig = {
            type: 'levelPack',
            cache: loader.scene.cache.json,
            extension: 'json',
            responseType: 'text',
            key: key,
            url: url
        };

        super(loader, fileConfig);
        this.options = options;
    }

    onProcess(): void {
        console.log(`🔄 LevelPack: 开始处理关卡包 ${this.key}`);
        
        try {
            const levelConfig = JSON.parse(this.xhrLoader.responseText);
            
            // 处理关卡配置
            this.processLevelConfig(levelConfig);
            
            this.data = levelConfig;
            
            console.log(`✅ LevelPack: 关卡包处理完成 ${this.key}`);
            this.onProcessComplete();
            
        } catch (error) {
            console.error(`❌ LevelPack: 关卡包处理失败 ${this.key}`, error);
            this.onProcessError();
        }
    }

    private processLevelConfig(config: any): void {
        // 加载关卡tilemap
        if (config.tilemap) {
            this.loader.tilemapTiledJSON(`${this.key}_tilemap`, config.tilemap);
        }
        
        // 加载背景
        if (config.background) {
            this.loader.image(`${this.key}_bg`, config.background);
        }
        
        // 加载音乐
        if (config.bgm) {
            this.loader.audio(`${this.key}_bgm`, config.bgm);
        }
        
        // 加载精灵资源
        if (config.sprites) {
            config.sprites.forEach((sprite: any) => {
                if (sprite.type === 'atlas') {
                    this.loader.atlas(sprite.key, sprite.image, sprite.atlas);
                } else {
                    this.loader.image(sprite.key, sprite.url);
                }
            });
        }

        // 加载音效
        if (config.sounds) {
            config.sounds.forEach((sound: any) => {
                this.loader.audio(sound.key, sound.url);
            });
        }
    }
}

// 精灵包文件类型
class SpriteBundleFile extends Phaser.Loader.File {
    constructor(loader: Phaser.Loader.LoaderPlugin, key: string, url: string) {
        const fileConfig = {
            type: 'spriteBundle',
            cache: loader.scene.cache.json,
            extension: 'json',
            responseType: 'text',
            key: key,
            url: url
        };

        super(loader, fileConfig);
    }

    onProcess(): void {
        try {
            const bundleConfig = JSON.parse(this.xhrLoader.responseText);
            
            // 批量加载精灵资源
            if (bundleConfig.atlases) {
                bundleConfig.atlases.forEach((atlas: any) => {
                    this.loader.atlas(atlas.key, atlas.image, atlas.data);
                    
                    // 如果有动画配置，也一起加载
                    if (atlas.animations) {
                        this.loader.json(`${atlas.key}_animations`, atlas.animations);
                    }
                });
            }

            if (bundleConfig.images) {
                bundleConfig.images.forEach((image: any) => {
                    this.loader.image(image.key, image.url);
                });
            }
            
            this.data = bundleConfig;
            this.onProcessComplete();
            
        } catch (error) {
            console.error(`精灵包处理失败: ${this.key}`, error);
            this.onProcessError();
        }
    }
}
```

## 使用示例

### 在Scene中使用自定义加载器

```typescript
export class CustomPreloader extends Scene {
    init() {
        // 监听自定义事件 - 完全像原生事件一样！
        this.load.on('filecomplete-configPack-gameConfig', (key: string, type: string, data: any) => {
            console.log(`🎉 配置包加载完成: ${key}`);
            console.log('配置数据:', data);
        });

        this.load.on('filecomplete-levelPack-level1', (key: string, type: string, data: any) => {
            console.log(`🎉 关卡包加载完成: ${key}`);
            console.log('关卡数据:', data);
        });

        this.load.on('filecomplete-spriteBundle-characters', (key: string, type: string, data: any) => {
            console.log(`🎉 精灵包加载完成: ${key}`);
        });

        // 标准进度事件也会包含自定义资源
        this.load.on('progress', (progress: number) => {
            console.log(`📊 总进度: ${Math.round(progress * 100)}%`);
        });

        // 所有资源完成事件
        this.load.on('complete', () => {
            console.log('🎉 所有资源加载完成！');
        });
    }

    preload() {
        // 使用自定义加载器 - 语法完全一致！
        this.load
            .image('logo', 'assets/logo.png')
            .configPack('gameConfig', 'assets/config/game-config.json')
            .levelPack('level1', 'assets/levels/level1-pack.json')
            .spriteBundle('characters', 'assets/sprites/character-bundle.json')
            .audio('bgm', 'assets/audio/bgm.mp3');

        console.log('📦 所有资源（包括自定义）已添加到队列');
    }

    create() {
        // 这里被调用时，所有资源（包括自定义和动态加载的）都已完成！
        console.log('🎯 所有资源加载完成，包括自定义资源！');
        
        // 访问自定义资源
        const gameConfig = this.cache.json.get('gameConfig');
        const level1Data = this.cache.json.get('level1');
        const spriteBundle = this.cache.json.get('characters');
        
        console.log('游戏配置:', gameConfig);
        console.log('关卡1数据:', level1Data);
        console.log('精灵包数据:', spriteBundle);
    }
}
```

### 配置文件示例

#### game-config.json
```json
{
  "version": "1.0.0",
  "settings": {
    "volume": 0.8,
    "difficulty": "normal"
  },
  "assets": [
    {
      "type": "static_image",
      "id": 100,
      "name": "ui_button",
      "resources": [
        {
          "remote": {
            "key": "ui_button",
            "resource_type": "image",
            "url": "https://game-api.dev.knoffice.tech/game/api/public/assets/download?asset_type=static_image&asset_id=100"
          }
        }
      ]
    },
    {
      "type": "sprite",
      "id": 101,
      "name": "ui_elements",
      "resources": [
        {
          "remote": {
            "key": "ui_elements_image",
            "resource_type": "image",
            "url": "https://game-api.dev.knoffice.tech/game/api/public/assets/download?asset_type=sprite&asset_id=101&key=image"
          }
        },
        {
          "remote": {
            "key": "ui_elements_json",
            "resource_type": "json",
            "url": "https://game-api.dev.knoffice.tech/game/api/public/assets/download?asset_type=sprite&asset_id=101&key=atlas_json"
          }
        }
      ]
    },
    {
      "type": "audio",
      "id": 102,
      "name": "click_sound",
      "resources": [
        {
          "remote": {
            "key": "click_sound",
            "resource_type": "audio",
            "url": "https://game-api.dev.knoffice.tech/game/api/public/assets/download?asset_type=audio&asset_id=102"
          }
        }
      ]
    }
  ]
}
```

**API下载规则说明**：
- **固定host**: `https://game-api.dev.knoffice.tech`
- **路径**: `/game/api/public/assets/download`
- **参数**:
  - `asset_type`: `static_image`、`sprite`、`audio`、`ground_asset_package` 等
  - `asset_id`: 资源的数字ID
  - `key`: 对于sprite类型可选 `image`、`atlas_json`、`animation_json`

#### level1-pack.json
```json
{
  "name": "草原关卡",
  "tilemap": "https://game-api.dev.knoffice.tech/game/api/public/assets/download?asset_type=tilemap&asset_id=1",
  "background": "https://game-api.dev.knoffice.tech/game/api/public/assets/download?asset_type=static_image&asset_id=200",
  "bgm": "https://game-api.dev.knoffice.tech/game/api/public/assets/download?asset_type=audio&asset_id=201",
  "sprites": [
    {
      "type": "atlas",
      "key": "player",
      "image": "https://game-api.dev.knoffice.tech/game/api/public/assets/download?asset_type=sprite&asset_id=3&key=image",
      "atlas": "https://game-api.dev.knoffice.tech/game/api/public/assets/download?asset_type=sprite&asset_id=3&key=atlas_json"
    },
    {
      "type": "atlas", 
      "key": "enemies",
      "image": "https://game-api.dev.knoffice.tech/game/api/public/assets/download?asset_type=sprite&asset_id=20&key=image",
      "atlas": "https://game-api.dev.knoffice.tech/game/api/public/assets/download?asset_type=sprite&asset_id=20&key=atlas_json"
    }
  ],
  "sounds": [
    {
      "key": "jump",
      "url": "https://game-api.dev.knoffice.tech/game/api/public/assets/download?asset_type=audio&asset_id=206"
    },
    {
      "key": "collect",
      "url": "https://game-api.dev.knoffice.tech/game/api/public/assets/download?asset_type=audio&asset_id=211"
    }
  ]
}
```

## 初始化

在游戏启动时注册自定义加载器：

```typescript
// main.ts
import { extendLoader } from './game/resourceManager/LoaderExtensions';

const StartGame = (parent: string) => {
    // 注册所有自定义加载器
    extendLoader();
    
    // 其他初始化代码...
    const game = new Game(config);
    return game;
}
```

## 关键要点

### ✅ 优势
- **完全集成**：自定义加载器完全集成到Phaser的事件系统
- **标准事件**：触发 `filecomplete-{type}-{key}` 等标准事件
- **进度跟踪**：被包含在加载进度计算中
- **阻塞机制**：会阻止 `create()` 直到完成
- **链式调用**：支持 `this.load.custom1().custom2()` 语法
- **动态加载**：可以在处理过程中动态添加更多资源

### 🔑 关键步骤
1. **继承 `Phaser.Loader.File`** - 获得完整的事件支持
2. **使用 `this.addFile(file)`** - 将自定义文件添加到Phaser的加载队列
3. **调用 `this.onProcessComplete()`** - 触发标准的 `filecomplete-{type}-{key}` 事件
4. **错误处理**：使用 `this.onProcessError()` 处理加载失败

### ⚠️ 注意事项
- 确保在 `onProcess()` 中正确处理异常
- 动态添加的资源也会被Phaser正确等待
- 自定义文件类型名要唯一，避免与原生类型冲突
- 选择合适的cache类型存储数据

## 扩展可能性

通过这种机制，你可以创建各种自定义加载器：

- **关卡包加载器**：一次性加载整个关卡的所有资源
- **主题包加载器**：加载UI主题相关的所有资源
- **本地化包加载器**：根据语言加载对应的文本和音频
- **模组加载器**：动态加载游戏模组
- **压缩包加载器**：解压并加载压缩资源包
- **远程配置加载器**：从服务器加载配置并动态加载资源

这种方式让你能够创建强大而灵活的资源管理系统，同时保持与Phaser原生系统的完美兼容性。
