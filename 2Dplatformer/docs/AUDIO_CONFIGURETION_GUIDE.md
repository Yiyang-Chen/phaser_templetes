# 🎵 音频配置指南

## 概述

本项目使用统一的音频管理系统，通过两个配置文件协同工作，必须保证audio_config中的key全都可以在game_config中被找到：
- **`game_config.json`**: 定义音频资源的实际文件路径
- **`audio-config.json`**: 定义音频的播放逻辑和映射关系

## 📋 配置文件关系

### 1. 资源定义 (`game_config.json`)

定义音频文件的实际位置，支持本地和远程资源，但是优先使用remote链接，详见RESOURCE_MANAGEMENT_GUIDE：

```json
{
  "assets": [
    {
      "type": "ASSET_TYPE_AUDIO",
      "id": 201,
      "name": "bgm_baltic_levity",
      "resources": [
        {
          "remote": {
            "key": "bgm_baltic_levity",
            "resource_type": "RESOURCE_TYPE_AUDIO",
            "url": "https://game-api.dev.knoffice.tech/game/api/public/assets/download?asset_id=201&asset_type=ASSET_TYPE_AUDIO"
          }
        }
      ]
    },
    {
      "type": "ASSET_TYPE_AUDIO", 
      "id": 204,
      "name": "sfx_jump",
      "resources": [
        {
          "remote": {
            "key": "sfx_jump",
            "resource_type": "RESOURCE_TYPE_AUDIO",
            "url": "https://game-api.dev.knoffice.tech/game/api/public/assets/download?asset_id=204&asset_type=ASSET_TYPE_AUDIO"
          }
        }
      ]
    }
  ]
}
```

### 2. 音频配置 (`audio-config.json`)

通过资源键引用音频，定义播放逻辑：

```json
{
  "loadStrategy": "preload_all",
  "audioTypes": {
    "bgm": {
      "defaultVolume": 0.7,
      "loop": true,
      "sceneMapping": {
        "MainMenu": "menu_theme",
        "Game": "game_theme"
      }
    },
    "sfx": {
      "defaultVolume": 0.5,
      "loop": false,
      "animationMapping": {
        "main_player": {
          "jump": ["player_jump"],
          "walk": ["player_walk_1", "player_walk_2"]
        }
      }
    }
  },
  "assets": {
    "bgm": {
      "menu_theme": {
        "url": "bgm_baltic_levity",  // 引用 game_config.json 中的 key
        "preload": true,
        "volume": 0.7,
        "loop": true
      }
    },
    "sfx": {
      "player_jump": {
        "url": "sfx_jump",  // 引用 game_config.json 中的 key
        "preload": true
      }
    }
  }
}
```

## 🔄 AudioManager 加载流程

### 初始化阶段

1. **场景初始化**: 在 `Preloader` 场景中初始化 AudioManager
2. **配置加载**: AudioManager 通过 `setConfig()` 接收音频配置
3. **资源解析**: 通过 `GlobalResourceManager` 将资源键解析为实际文件路径
4. **音频预加载**: 根据配置策略预加载音频文件

### 播放流程

```typescript
// 1. BGM 播放 - 通过场景映射自动触发
scene.start('Game') 
→ AudioManager 检测场景变化
→ 查找 sceneMapping["Game"] = "game_theme"
→ 播放 assets.bgm["game_theme"]
→ 解析 url: "bgm_alls_fair_in_love"
→ GlobalResourceManager 返回实际路径
→ 播放音频文件

// 2. SFX 播放 - 通过动画映射自动触发  
player.anims.play('jump')
→ 触发 ANIMATION_PLAY 事件
→ AudioManager 查找 animationMapping["main_player"]["jump"]
→ 随机选择 ["player_jump"] 中的音效
→ 播放对应的音频文件
```

## 📝 配置示例

### 例子 1: 添加新的背景音乐

**步骤 1**: 在 `game_config.json` 中定义资源
```json
{
  "type": "ASSET_TYPE_AUDIO",
  "id": 220,
  "name": "bgm_boss_battle",
  "resources": [
    {
      "remote": {
        "key": "bgm_boss_battle",
        "resource_type": "RESOURCE_TYPE_AUDIO", 
        "url": "https://game-api.dev.knoffice.tech/game/api/public/assets/download?asset_id=220&asset_type=ASSET_TYPE_AUDIO"
      }
    }
  ]
}
```

**步骤 2**: 在 `audio-config.json` 中配置使用
```json
{
  "audioTypes": {
    "bgm": {
      "sceneMapping": {
        "BossLevel": "boss_theme"  // 场景映射
      }
    }
  },
  "assets": {
    "bgm": {
      "boss_theme": {
        "url": "bgm_boss_battle",  // 引用资源键
        "preload": false,
        "volume": 0.8,
        "loop": true
      }
    }
  }
}
```

**结果**: 当切换到 `BossLevel` 场景时，自动播放 boss 战斗音乐

### 例子 2: 为敌人添加音效

**步骤 1**: 在 `game_config.json` 中定义音效资源
```json
{
  "type": "ASSET_TYPE_AUDIO",
  "id": 230,
  "name": "sfx_enemy_roar",
  "resources": [
    {
      "remote": {
        "key": "sfx_enemy_roar",
        "resource_type": "RESOURCE_TYPE_AUDIO",
        "url": "https://game-api.dev.knoffice.tech/game/api/public/assets/download?asset_id=230&asset_type=ASSET_TYPE_AUDIO"
      }
    }
  ]
}
```

**步骤 2**: 在 `audio-config.json` 中配置动画映射
```json
{
  "audioTypes": {
    "sfx": {
      "animationMapping": {
        "dragon_enemy": {
          "attack": ["enemy_roar"],
          "die": ["enemy_death"]
        }
      }
    }
  },
  "assets": {
    "sfx": {
      "enemy_roar": {
        "url": "sfx_enemy_roar",
        "preload": true,
        "volume": 0.9
      }
    }
  }
}
```

**步骤 3**: 在敌人代码中触发
```typescript
// 在 Dragon 敌人类中
this.anims.play('attack');  // 自动播放 enemy_roar 音效

// 或手动触发
AudioManager.getInstance().playAnimationSound('dragon_enemy', 'attack');
```

## 🎛️ 主要配置选项

| 配置项 | 说明 | 示例值 |
|--------|------|--------|
| `loadStrategy` | 加载策略 | `"preload_all"`, `"lazy_load"` |
| `sceneMapping` | 场景到BGM的映射 | `{"Game": "game_theme"}` |
| `animationMapping` | 动画到音效的映射 | `{"player": {"jump": ["sfx1"]}}` |
| `preload` | 是否预加载 | `true`, `false` |
| `volume` | 音量 (0-1) | `0.7` |
| `loop` | 是否循环 | `true`, `false` |

## 🔧 常用 API

```typescript
const audioManager = AudioManager.getInstance();

// 手动播放
audioManager.playBGM('menu_theme');
audioManager.playSFX('player_jump');
audioManager.playAnimationSound('main_player', 'jump');

// 音量控制
audioManager.setBGMVolume(0.5);
audioManager.setSFXVolume(0.8);

// 状态查询
audioManager.getCurrentBGM();
audioManager.isReady();
```

## ⚠️ 注意事项

1. **资源键一致性**: `audio-config.json` 中的 `url` 必须与 `game_config.json` 中的 `key` 完全匹配
2. **用户交互**: 现代浏览器需要用户交互后才能播放音频，AudioManager 会自动处理
3. **文件格式**: 推荐使用 MP3 格式以获得最佳兼容性
4. **预加载策略**: 合理配置 `preload` 以平衡加载时间和内存使用

---

💡 **提示**: 配置文件修改后需要重新加载页面才能生效。开发时可以通过浏览器控制台查看 AudioManager 的详细日志。