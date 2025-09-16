# 自定义加载器模块

本目录包含了Phaser游戏引擎的自定义加载器实现，采用模块化设计，便于维护和扩展。

## 📁 文件结构

```
resourceManager/
├── CustomLoadFile/              # 自定义文件类型
│   ├── CustomTilemapFile.ts    # 自定义Tilemap文件类型
│   └── SpriteAtlasFile.ts      # 精灵图集文件类型
├── CustomLoader/               # 自定义加载器
│   ├── CustomTileMapLoader.ts  # Tilemap加载器注册
│   └── CustomSpriteAtlasLoader.ts # 精灵图集加载器注册
├── docs/                       # 文档
│   ├── CustomLoader.md         # 自定义加载器开发指南
│   └── README.md              # 本文件
└── LoaderExtensions.ts         # 主入口文件
```

## 🎯 设计理念

### CustomLoadFile/ - 文件类型层
- 包含所有继承自 `Phaser.Loader.File` 的自定义文件类型
- 负责具体的文件加载、解析和处理逻辑
- 每个文件类型都是独立的，可以单独测试和维护

### CustomLoader/ - 加载器层
- 包含扩展 `Phaser.Loader.LoaderPlugin` 的注册函数
- 负责将自定义文件类型注册到Phaser的加载系统
- 提供对外的API接口

## 🚀 使用方式

### 1. 在main.ts中初始化
```typescript
import { extendLoader } from './game/resourceManager/LoaderExtensions';

const StartGame = (parent: string) => {
    // 注册所有自定义加载器
    extendLoader();
    
    // ... 其他初始化代码
    const game = new Game(config);
    return game;
}
```

### 2. 在Scene中使用
```typescript
export class Preloader extends Scene {
    init() {
        // 监听自定义加载器事件
        this.load.on('filecomplete-customTilemap-tilemap', (key: string) => {
            console.log(`🗺️ 自定义tilemap加载完成 - ${key}`);
        });

        this.load.on('filecomplete-spriteAtlas', (key: string) => {
            console.log(`🎭 精灵图集加载完成 - ${key}`);
        });
    }

    preload() {
        // 使用自定义加载器
        this.load
            .image('logo', 'assets/logo.png')
            .customTilemap('tilemap', 'assets/tilemap/scenes/tilemap.json')  // 🎯 自定义tilemap
            .spriteAtlas('player', 'assets/player/character_purple.png')    // 🎯 精灵图集
            .spriteAtlas('enemy', 'assets/enemy/frog.png');
    }
}
```

## 📋 当前可用的自定义加载器

### customTilemap
- **功能**：自定义加载tilemap及其相关资源
- **事件**：`filecomplete-customTilemap-{key}`
- **自动处理**：
  - 解析tilemap JSON
  - 自动发现并加载tilesets
  - 区分普通图片和图集
  - 加载动画配置文件

**使用示例**：
```typescript
this.load.customTilemap('level1', 'assets/tilemap/scenes/level1.json');
```

### spriteAtlas
- **功能**：智能加载精灵图集及相关文件
- **事件**：`filecomplete-spriteAtlas-{key}`
- **自动处理**：
  - 加载 .png 图片文件
  - 加载 .json 图集配置
  - 加载 _animators.json 动画配置

**使用示例**：
```typescript
this.load.spriteAtlas('player', 'assets/player/character_purple.png');
// 自动加载：
// - character_purple.png (图片)
// - character_purple.json (图集配置)
// - character_purple_animators.json (动画配置)
```

## 🔧 扩展指南

### 添加新的文件类型

1. 在 `CustomLoadFile/` 中创建新的文件类型：
```typescript
// CustomLoadFile/MyCustomFile.ts
export class MyCustomFile extends Phaser.Loader.File {
    constructor(loader: Phaser.Loader.LoaderPlugin, key: string, url: string) {
        const fileConfig = {
            type: 'myCustom',
            cache: loader.scene.cache.json,
            extension: 'json',
            responseType: 'text' as XMLHttpRequestResponseType,
            key: key,
            url: url
        };
        super(loader, fileConfig);
    }

    onProcess(): void {
        // 处理逻辑
        this.onProcessComplete();
    }
}
```

2. 在 `CustomLoader/` 中创建注册函数：
```typescript
// CustomLoader/MyCustomLoader.ts
import { MyCustomFile } from '../CustomLoadFile/MyCustomFile';

export function registerMyCustomLoader() {
    Phaser.Loader.LoaderPlugin.prototype.myCustom = function(key: string, url: string) {
        const file = new MyCustomFile(this, key, url);
        this.addFile(file);
        return this;
    };
}
```

3. 在 `LoaderExtensions.ts` 中注册：
```typescript
import { registerMyCustomLoader } from './CustomLoader/MyCustomLoader';

export function extendLoader() {
    registerMyCustomLoader();
    // ... 其他注册
}
```


## 📚 相关文档

- [自定义加载器开发指南](./CustomLoader.md) - 详细的开发指南和示例
- [Phaser LoaderPlugin文档](https://photonstorm.github.io/phaser3-docs/Phaser.Loader.LoaderPlugin.html)
- [Phaser File类文档](https://photonstorm.github.io/phaser3-docs/Phaser.Loader.File.html)

## ✨ 优势

- **模块化**：文件类型和加载器分离，职责清晰
- **可扩展**：易于添加新的自定义加载器
- **类型安全**：完整的TypeScript支持
- **事件集成**：完全集成到Phaser的事件系统
- **易于测试**：每个模块都可以独立测试
