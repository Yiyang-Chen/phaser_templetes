# 🎵 音频系统文档

## 概述

本项目使用统一的 `AudioManager` 来管理所有音频功能，包括背景音乐(BGM)和音效(SFX)。系统支持自动音频解锁、场景音乐切换、动画音效绑定等功能。

## 🏗️ 架构设计

### 核心组件

- **AudioManager**: 统一音频管理器，单例模式（`src/game/audio/AudioManager.ts`）
- **GlobalResourceManager**: 全局资源管理器，解析音频资源路径（`src/game/resourceManager/GlobalResourceManager.ts`）
- **AudioConfigLoader**: 音频配置加载器（`src/game/resourceManager/CustomLoader/AudioConfigLoader.ts`）
- **音频配置文件**: `public/assets/audio/audio-config.json` - 使用资源键引用音频文件
- **游戏配置文件**: `public/assets/game_config.json` - 定义音频资源的实际路径
- **音频资源**: 存放在 `public/assets/audio/` 目录下

### 特性

- ✅ **自动音频解锁**: 检测用户交互后自动解锁音频上下文
- ✅ **场景音乐映射**: 自动根据场景切换BGM
- ✅ **动画音效绑定**: 支持动画与音效的自动关联
- ✅ **懒加载支持**: 支持预加载和按需加载策略
- ✅ **音量控制**: 独立的BGM和SFX音量控制
- ✅ **事件驱动**: 基于EventBus的音频事件系统
- ✅ **统一资源管理**: 通过GlobalResourceManager支持本地/远程音频资源

## 📁 文件结构

```
src/game/audio/
├── AudioManager.ts           # 统一音频管理器
└── docs/
    └── AUDIO.md             # 本文档

src/game/resourceManager/     # 🆕 资源管理系统
├── GlobalResourceManager.ts  # 全局资源管理器
├── LoaderExtensions.ts      # 加载器扩展注册
└── CustomLoader/
    └── AudioConfigLoader.ts # 音频配置加载器

public/assets/
├── game_config.json         # 🎯 统一资源配置（定义音频文件路径）
└── audio/
    ├── audio-config.json    # 音频配置文件（使用资源键引用）
    ├── bgm/                 # 背景音乐文件
    │   ├── Alls Fair In Love.mp3
    │   ├── Attic Secrets.mp3
    │   └── Baltic Levity.mp3
    └── sfx/                 # 音效文件
        ├── sfx_bump.mp3
        ├── sfx_coin.mp3
        ├── sfx_disappear.mp3
        ├── sfx_gem.mp3
        ├── sfx_hurt.mp3
        ├── sfx_jump-high.mp3
        ├── sfx_jump.mp3
        ├── sfx_magic.mp3
        ├── sfx_select.mp3
        └── sfx_throw.mp3
```

## ⚙️ 配置文件

### 🆕 资源管理系统

从版本2.0开始，音频系统采用统一的资源管理方式：

#### 1. 游戏配置文件 (`game_config.json`)
定义音频资源的实际路径：

```json
{
  "assets": [
    {
      "type": "audio_bgm",
      "id": 201,
      "name": "bgm_files",
      "resources": [
        {
          "local": {
            "key": "bgm_baltic_levity",
            "resource_type": "audio",
            "full_path": "assets/audio/bgm/Baltic Levity.mp3"
          }
        },
        {
          "remote": {
            "key": "bgm_alls_fair_in_love", 
            "resource_type": "audio",
            "url": "https://cdn.example.com/audio/bgm/Alls Fair In Love.mp3"
          }
        }
      ]
    },
    {
      "type": "audio_sfx",
      "id": 202,
      "name": "sfx_files", 
      "resources": [
        {
          "local": {
            "key": "sfx_jump",
            "resource_type": "audio",
            "full_path": "assets/audio/sfx/sfx_jump.mp3"
          }
        }
      ]
    }
  ]
}
```

#### 2. 音频配置文件 (`audio-config.json`)
使用key引用资源，而不是硬编码路径：

```json
{
  "assets": {
    "bgm": {
      "menu_theme": {
        "url": "bgm_baltic_levity",     // 🆕 使用key引用
        "preload": true,
        "volume": 0.7,
        "loop": true
      },
      "game_theme": {
        "url": "bgm_alls_fair_in_love", // 🆕 使用key引用
        "preload": false,
        "volume": 0.5,
        "loop": true
      }
    },
    "sfx": {
      "player_jump": {
        "url": "sfx_jump",              // 🆕 使用key引用
        "preload": true,
        "volume": 0.8,
        "loop": false
      }
    }
  }
}
```

### 主配置文件 (`audio-config.json`) - 完整结构

```json
{
  "loadStrategy": "preload_all",
  "audioTypes": {
    "bgm": {
      "defaultVolume": 0.7,
      "loop": true,
      "sceneMapping": {
        "MainMenu": "menu_theme",
        "Game": "game_theme",
        "Victory": "victory_theme",
        "GameOver": "gameover_theme"
      }
    },
    "sfx": {
      "defaultVolume": 0.5,
      "loop": false,
      "animationMapping": {
        "main_player": {
          "walk": ["player_walk_1", "player_walk_2"],
          "jump": ["player_jump", "player_jump_high"],
          "attack": ["player_attack"],
          "hit": ["player_hurt"]
        }
      }
    }
  },
  "assets": {
    "bgm": {
      "menu_theme": {
        "url": "bgm_baltic_levity",
        "preload": true,
        "volume": 0.6,
        "loop": true
      },
      "game_theme": {
        "url": "bgm_alls_fair_in_love",
        "preload": false,
        "volume": 0.5,
        "loop": true
      }
    },
    "sfx": {
      "player_jump": {
        "url": "sfx_jump",
        "preload": true,
        "volume": 0.8
      }
    }
  }
}
```

**🔗 资源键引用说明**：
- `url` 字段现在使用 **ResourceManager 中定义的资源键**，而不是直接的文件路径
- AudioManager 会自动通过 `GlobalResourceManager.getResourcePath()` 解析实际的文件路径
- 支持本地文件和远程CDN资源的统一管理
- 资源键在 `game_config.json` 中定义，如 `bgm_baltic_levity` → `assets/audio/bgm/Baltic Levity.mp3`

### 配置项说明

| 字段 | 类型 | 说明 |
|------|------|------|
| `loadStrategy` | string | 加载策略: `preload_all`, `lazy_load`, `scene_based` |
| `audioTypes.bgm.sceneMapping` | object | 场景到BGM的映射关系 |
| `audioTypes.sfx.animationMapping` | object | 动画到音效的映射关系 |
| `assets.bgm/sfx` | object | 具体的音频资源配置 |

## 🚀 使用方法

### 1. 初始化

在 `Preloader` 场景中初始化AudioManager：

```typescript
import { AudioManager } from '../audio/AudioManager';

export class Preloader extends Scene {
    private audioManager: AudioManager;
    
    constructor() {
        super('Preloader');
        this.audioManager = AudioManager.getInstance();
    }
    
    init() {
        // 在资源加载之前初始化AudioManager
        this.audioManager.initialize(this, this.game);
    }
    
    preload() {
        // 使用自定义音频配置加载器
        this.load.audioConfig('audio-config', '/assets/audio/audio-config.json');
    }
    
    create() {
        // 处理已加载的音频资源
        this.audioManager.processLoadedAudio();
    }
}
```

#### 初始化顺序说明

**最佳实践**：
1. **init()阶段**: 初始化管理器实例，设置基础配置
2. **preload()阶段**: 加载音频配置和资源文件
3. **create()阶段**: 处理已加载的资源，创建音频对象

这样的顺序确保了：
- 管理器在资源加载前就已准备好
- 可以监听加载过程中的事件
- 避免重复初始化和资源竞争

### 2. 播放BGM

```typescript
// 手动播放BGM
AudioManager.getInstance().playBGM('menu_theme');

// 场景切换时自动播放（通过配置文件映射）
// 当场景切换到 'MainMenu' 时，会自动播放 'menu_theme'
```

### 3. 播放音效

```typescript
// 播放单个音效
AudioManager.getInstance().playSFX('player_jump');

// 播放动画音效（自动根据配置选择）
AudioManager.getInstance().playAnimationSound('main_player', 'jump');
```

### 4. 音量控制

```typescript
// 设置BGM音量
AudioManager.getInstance().setBGMVolume(0.5);

// 设置SFX音量
AudioManager.getInstance().setSFXVolume(0.8);
```

### 5. 事件监听

```typescript
import { eventBus, GameEvent } from '../events/EventBus';

// 监听音频事件
eventBus.on(GameEvent.BGM_PLAY, (data) => {
    console.log('BGM开始播放:', data.bgmKey);
});

eventBus.on(GameEvent.SFX_PLAY, (data) => {
    console.log('音效播放:', data.sfxKey);
});
```

## 🎮 游戏集成

### 场景音乐

AudioManager会自动监听场景变化，根据配置文件中的 `sceneMapping` 自动播放对应的BGM：

```typescript
// 配置文件中的映射
"sceneMapping": {
    "MainMenu": "menu_theme",
    "Game": "game_theme",
    "Victory": "victory_theme"
}

// 当场景切换时，AudioManager会自动处理
this.scene.start('Game'); // 自动播放 game_theme
```

### 动画音效

在精灵动画播放时自动触发音效：

```typescript
// 在Player类中
this.anims.play('walk');
// AudioManager会自动根据配置播放对应的走路音效
```

### 用户交互解锁

AudioManager会自动监听用户交互（点击、触摸、按键）来解锁音频上下文，无需手动处理。

## 🔧 开发指南

### 添加新的BGM

#### 步骤1: 添加资源到ResourceManager
在 `game_config.json` 中定义音频资源：

```json
{
  "assets": [
    {
      "type": "audio_bgm",
      "id": 203,
      "name": "new_bgm_files",
      "resources": [
        {
          "local": {
            "key": "bgm_new_theme",
            "resource_type": "audio",
            "full_path": "assets/audio/bgm/new_theme.mp3"
          }
        }
      ]
    }
  ]
}
```

#### 步骤2: 在音频配置中引用资源键
在 `audio-config.json` 中添加配置：

```json
{
  "assets": {
    "bgm": {
      "new_theme": {
        "url": "bgm_new_theme",
        "preload": true,
        "volume": 0.7,
        "loop": true
      }
    }
  }
}
```

#### 步骤3: 配置场景映射
在场景映射中关联：

```json
{
  "audioTypes": {
    "bgm": {
      "sceneMapping": {
        "NewScene": "new_theme"
      }
    }
  }
}
```

### 添加新的音效

#### 步骤1: 添加资源到ResourceManager
在 `game_config.json` 中定义音效资源：

```json
{
  "assets": [
    {
      "type": "audio_sfx",
      "id": 204,
      "name": "new_sfx_files",
      "resources": [
        {
          "local": {
            "key": "sfx_new_sound",
            "resource_type": "audio",
            "full_path": "assets/audio/sfx/new_sound.mp3"
          }
        }
      ]
    }
  ]
}
```

#### 步骤2: 在音频配置中引用资源键
在 `audio-config.json` 中添加配置：

```json
{
  "assets": {
    "sfx": {
      "new_sound": {
        "url": "sfx_new_sound",
        "preload": true,
        "volume": 0.6
      }
    }
  }
}
```

#### 步骤3: 可选 - 绑定到动画
在动画映射中关联：

```json
{
  "audioTypes": {
    "sfx": {
      "animationMapping": {
        "player_sprite": {
          "new_animation": ["new_sound"]
        }
      }
    }
  }
}
```

### 性能优化建议

1. **合理使用预加载**: 只预加载必要的音频文件
2. **音频格式**: 推荐使用MP3格式，平衡文件大小和兼容性
3. **文件大小**: BGM控制在2-5MB以内，SFX控制在100KB以内
4. **加载策略**: 根据项目需求选择合适的加载策略

### 调试技巧

1. **控制台日志**: AudioManager提供详细的控制台日志
2. **事件监听**: 使用EventBus监听音频事件进行调试
3. **音频状态**: 可以通过AudioManager的公共方法查询当前状态

## 🐛 常见问题

### Q: 音频无法播放？
A: 检查浏览器控制台是否有AudioContext错误，确保用户有交互操作。

### Q: 场景切换时音乐没有自动切换？
A: 检查 `audio-config.json` 中的 `sceneMapping` 配置是否正确。

### Q: 音效播放延迟？
A: 确保音效文件已预加载，或考虑使用 `preload_all` 策略。

### Q: 如何禁用某个场景的BGM？
A: 在 `sceneMapping` 中不配置该场景，或设置为空字符串。

## 📝 更新日志

### v2.0.0 (当前版本)
- ✅ 重构为统一的AudioManager
- ✅ 添加自动音频解锁机制
- ✅ 支持场景音乐自动切换
- ✅ 支持动画音效自动绑定
- ✅ 移除旧的BGMPlayer和SoundEffectPlayer
- ✅ 清理旧的配置文件(bgm-config.json, sound_effect/config.json)
- ✅ 重组音频目录结构(sound_effect → sfx)
- ✅ 集成GlobalResourceManager，支持资源键引用
- ✅ 支持本地和远程音频资源的统一管理

### v1.0.0 (已废弃)
- ❌ 分离的BGMPlayer和SoundEffectPlayer
- ❌ 手动音频解锁
- ❌ 复杂的音频管理逻辑

---

💡 **提示**: 如果需要更复杂的音频功能，可以扩展AudioManager类或通过EventBus添加自定义音频事件。
