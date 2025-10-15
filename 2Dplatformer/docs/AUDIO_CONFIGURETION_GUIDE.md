# 音频配置指南

## 概述

AudioManager 是游戏的音频系统核心，负责管理背景音乐（BGM）和音效（SFX）的加载、播放和控制。

### 工作流程

1. **初始化**：游戏启动时，AudioManager 从 `audio-config.json` 加载配置
2. **预加载**：在 Preloader 场景，加载标记为 `preload: true` 的音频
3. **后台加载**：游戏进入 MainMenu 后，后台异步加载其他音频
4. **自动播放**：根据场景自动切换 BGM
5. **动画音效**：精灵播放动画时自动触发对应音效

### 浏览器音频解锁

现代浏览器要求用户交互后才能播放音频。AudioManager 会：
- 自动监听用户首次点击/触摸
- 解锁后自动播放等待中的 BGM
- 对用户完全透明

---

## 配置文件结构

`audio-config.json` 包含两个必需部分：

```json
{
  "audioTypes": { ... },
  "assets": { ... }
}
```

⚠️ **关键规则**：
- 配置文件必须同时包含 `audioTypes` 和 `assets` 两个部分
- 所有音频资源的 `url` 必须在 `game_config.json` 中存在
- 不要添加未在 `game_config.json` 中定义的资源

---

## 第一部分：audioTypes

定义音频类型的全局配置和映射关系。

### BGM 配置

```json
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
  }
}
```

#### 字段说明

| 字段 | 类型 | 说明 |
|------|------|------|
| `defaultVolume` | `number` | 默认音量（0.0 - 1.0） |
| `loop` | `boolean` | 是否默认循环播放 |
| `sceneMapping` | `object` | 场景到 BGM 的映射关系 |

#### 场景映射规则

- **键**：Phaser 场景名称（如 `"MainMenu"`, `"Game"`）
- **值**：对应的 BGM 资源键（必须在 `assets.bgm` 中定义）
- 场景切换时，AudioManager 自动播放对应的 BGM
- 如果场景未映射，不会自动播放 BGM

### SFX 配置

```json
"audioTypes": {
  "sfx": {
    "defaultVolume": 0.5,
    "loop": false,
    "animationMapping": {
      "atlas_key": {
        "animation_name": ["sfx_key_1", "sfx_key_2"]
      }
    }
  }
}
```

#### 字段说明

| 字段 | 类型 | 说明 |
|------|------|------|
| `defaultVolume` | `number` | 默认音量（0.0 - 1.0） |
| `loop` | `boolean` | 是否默认循环播放（通常为 `false`） |
| `animationMapping` | `object` | 动画到音效的映射关系 |

#### 动画映射规则

动画映射使用三级结构：`图集键 -> 动画名 -> 音效数组`

```json
"animationMapping": {
  "main_player": {
    "walk": ["player_walk_1", "player_walk_2"],
    "jump": ["player_jump", "player_jump_high"],
    "hit": ["player_hurt"]
  },
  "frog": {
    "jump": ["frog_jump_1", "frog_jump_2"],
    "attack": ["frog_attack"]
  }
}
```

**工作原理**：
1. 精灵播放动画时，AudioManager 查找 `atlasKey_animationName` 映射
2. 如果找到多个音效，**随机选择一个播放**
3. 如果没有映射，不播放音效（不会报错）
4. 空数组 `[]` 表示该动画不播放音效

**命名规范**：
- **图集键**：图集在 Phaser 中的 key（如 `"main_player"`, `"frog"`）
- **动画名**：动画的 key（如 `"walk"`, `"jump"`, `"attack"`）
- **音效键**：必须在 `assets.sfx` 中定义

**示例**：
```json
"coin_gold": {
  "collect": ["coin_collect"],  // 收集时播放
  "idle": [],                    // 空闲时不播放音效
  "spin": []                     // 旋转时不播放音效
}
```

---

## 第二部分：assets

定义所有音频资源的具体配置。

### BGM 资源

```json
"assets": {
  "bgm": {
    "menu_theme": {
      "url": "bgm_baltic_levity",
      "preload": true,
      "volume": 0.7,
      "loop": true
    },
    "game_theme": {
      "url": "bgm_alls_fair_in_love",
      "preload": false,
      "volume": 0.5,
      "loop": true
    }
  }
}
```

#### 字段说明

| 字段 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `url` | `string` | ✅ | 资源键，必须在 `game_config.json` 中定义 |
| `preload` | `boolean` | ✅ | 是否在 Preloader 场景预加载 |
| `volume` | `number` | ❌ | 音量（0.0 - 1.0），默认使用 `audioTypes.bgm.defaultVolume` |
| `loop` | `boolean` | ❌ | 是否循环播放，默认使用 `audioTypes.bgm.loop` |

#### preload 字段详解

- **`true`**：在游戏加载阶段预加载，**阻塞加载进度条**
  - 适用于：主菜单 BGM、关键音效
  - 确保进入游戏时立即可用
  
- **`false`**：进入游戏后后台异步加载
  - 适用于：游戏内 BGM、非关键音效
  - 不阻塞游戏启动
  - 如果音效未加载完成，会被跳过（不会报错）

**最佳实践**：
- 只预加载主菜单 BGM（1个）
- 其他音频全部后台加载
- 平衡加载速度和用户体验

### SFX 资源

```json
"assets": {
  "sfx": {
    "player_jump": {
      "url": "sfx_jump",
      "preload": false
    },
    "player_hurt": {
      "url": "sfx_hurt",
      "preload": false
    }
  }
}
```

#### 字段说明

| 字段 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `url` | `string` | ✅ | 资源键，必须在 `game_config.json` 中定义 |
| `preload` | `boolean` | ✅ | 是否在 Preloader 场景预加载 |

SFX 通常不需要指定 `volume` 和 `loop`，使用 `audioTypes.sfx` 中的默认值。

---

## 资源复用

多个音频可以指向同一个 URL，AudioManager 会自动优化：

```json
"player_walk_1": { "url": "sfx_bump", "preload": false },
"player_land": { "url": "sfx_bump", "preload": false }
```

**自动优化**：
- 只下载一次 `sfx_bump`
- 创建别名 `player_land` -> `player_walk_1`
- 节省带宽和内存

---

## 完整示例

```json
{
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
          "walk": ["player_walk_1", "player_walk_2"],
          "jump": ["player_jump"],
          "hit": ["player_hurt"]
        }
      }
    }
  },
  "assets": {
    "bgm": {
      "menu_theme": {
        "url": "bgm_menu_music",
        "preload": true,
        "volume": 0.7,
        "loop": true
      },
      "game_theme": {
        "url": "bgm_game_music",
        "preload": false,
        "volume": 0.6,
        "loop": true
      }
    },
    "sfx": {
      "player_walk_1": {
        "url": "sfx_step1",
        "preload": false
      },
      "player_walk_2": {
        "url": "sfx_step2",
        "preload": false
      },
      "player_jump": {
        "url": "sfx_jump",
        "preload": false
      },
      "player_hurt": {
        "url": "sfx_hurt",
        "preload": false
      }
    }
  }
}
```

---

## 常见问题

### 音频不播放？

1. **检查 `url` 是否在 `game_config.json` 中定义**
2. **检查 `preload` 设置**：后台加载的音频需要等待下载完成
3. **检查浏览器控制台**：查看是否有加载错误
4. **检查音量设置**：确保 `volume` 不为 0

### 动画没有音效？

1. **检查动画映射**：`atlasKey_animationName` 格式是否正确
2. **检查音效键**：确保在 `assets.sfx` 中定义
3. **检查空数组**：`[]` 表示不播放音效

### BGM 没有自动切换？

1. **检查场景映射**：场景名称是否正确
2. **检查 BGM 键**：确保在 `assets.bgm` 中定义
3. **检查场景切换**：确保使用 Phaser 的场景切换 API

### 加载太慢？

1. **减少预加载音频**：只预加载主菜单 BGM
2. **使用资源复用**：多个音效指向同一个 URL
3. **压缩音频文件**：使用合适的比特率和格式

---

## 最佳实践

### 1. preload 策略
- ✅ 主菜单 BGM：`preload: true`
- ✅ 其他所有音频：`preload: false`

### 2. 音量设置
- BGM：0.5 - 0.7
- SFX：0.4 - 0.6
- 避免音量过大导致失真

### 3. 动画映射
- 提供多个变体音效（如 `walk_1`, `walk_2`）增加随机性
- 空数组 `[]` 明确标记不播放音效
- 保持命名一致性（`atlas_key` + `_` + `animation_name`）

### 4. 资源管理
- 定期清理未使用的音频键
- 检查所有 `url` 在 `game_config.json` 中存在
- 复用相似音效减少资源数量

### 5. 测试清单
- [ ] 所有场景的 BGM 正常切换
- [ ] 动画音效触发正确
- [ ] 预加载不阻塞太久
- [ ] 后台加载最终完成
- [ ] 浏览器音频解锁正常工作
