# 属性命名标准 (Property Naming Standards)

## 目的
本文档定义了在tilemap配置中使用的标准属性名，确保AI生成的配置与代码实现保持一致。

## 🚨 重要提醒
**AI在生成tilemap配置时，必须严格使用以下标准属性名。属性名大小写敏感，必须完全匹配。**

## 通用属性 (Universal Properties)

所有游戏对象都支持的属性：

| 标准属性名 | 类型 | 说明 | 示例值 |
|-----------|------|------|--------|
| `uuid` | string | 唯一标识符 | "enemy-001" |

## 瓦片集属性 (Tileset Properties)

用于瓦片集中瓦片的属性配置：

| 标准属性名 | 类型 | 说明 | 默认值 |
|-----------|------|------|--------|
| `collides` | bool | 瓦片是否有碰撞 | false |
| `atlas` | bool | 是否为精灵图集 | false |

### 瓦片集属性说明

- `collides`: 设置为 `true` 的瓦片会与玩家和其他物体产生碰撞
- `atlas`: 设置为 `true` 表示该瓦片使用精灵图集，需要对应的 .json 文件定义动画帧

## 敌人属性 (Enemy Properties)

### 🎯 核心属性 (必须使用的标准名称)

| 标准属性名 | 类型 | 说明 | 可选值/范围 | 默认值 |
|-----------|------|------|-------------|--------|
| `damage` | int | 伤害值 | 1-10 | 1 |
| `move_method` | string | 移动模式 | 见下表 | "static" |
| `move_speed` | int | 移动速度 | 50-300 | 100 |
| `jump_power` | int | 跳跃力度 | 200-800 | 400 |
| `patrol_distance` | int | 巡逻距离 | 100-500 | 200 |
| `detection_range` | int | 检测范围 | 100-500 | 300 |
| `jump_interval` | int | 跳跃间隔(毫秒) | 1000-5000 | 2000 |
| `atlas` | bool | 是否使用图集 | true/false | false |
| `death_particle_color` | string | 死亡粒子颜色 | 十六进制颜色 | "#ff0000" |

### 🚫 常见错误属性名 (AI容易犯的错误)

| ❌ 错误名称 | ✅ 正确名称 | 说明 |
|------------|------------|------|
| `move_mode` | `move_method` | 命名错误 |
| `moveMethod` | `move_method` | 使用下划线而非驼峰 |
| `speed` | `move_speed` | 需要完整前缀 |
| `health` | `damage` | 敌人使用damage属性 |
| `patrol_range` | `patrol_distance` | 使用distance而非range |
| `jump_strength` | `jump_power` | 使用power而非strength |
| `isAtlas` | `atlas` | 布尔值不使用is前缀 |
| `particle_color` | `death_particle_color` | 需要完整描述 |

### 移动模式值 (move_method Values)

| 值 | 说明 | 适用场景 |
|---|------|----------|
| `"static"` | 静止不动 | 守卫型敌人 |
| `"patrol"` | 左右巡逻 | 平台巡逻兵 |
| `"jump"` | 原地跳跃 | 弹跳敌人 |
| `"move_and_jump"` | 跳跃移动 | 青蛙类敌人 |
| `"patrol_jump"` | 巡逻+跳跃 | 复合行为敌人 |
| `"follow"` | 跟随玩家 | 追击型敌人 |
| `"follow_jump"` | 跟随+跳跃 | 智能追击敌人 |

## 玩家属性 (Player Properties)

| 标准属性名 | 类型 | 说明 | 默认值 |
|-----------|------|------|--------|
| `max_health` | int | 最大生命值 | 3 |
| `can_move` | bool | 可以移动 | true |
| `can_jump` | bool | 可以跳跃 | true |
| `can_double_jump` | bool | 可以二段跳 | true |
| `can_wall_jump` | bool | 可以墙跳 | true |
| `can_wall_slide` | bool | 可以墙滑 | true |
| `can_shoot` | bool | 可以射击 | true |
| `move_speed` | int | 移动速度 | 200 |
| `jump_speed` | int | 跳跃速度 | 500 |
| `max_jumps` | int | 最大跳跃次数 | 2 |

## 收集品属性 (Collectible Properties)

| 标准属性名 | 类型 | 说明 | 默认值 |
|-----------|------|------|--------|
| `score` | int | 分数值 | 100 |
| `type` | string | 收集品类型 | "coin" |
| `must_collect` | bool | 必须收集 | false |
| `rotate` | bool | 旋转动画 | true |
| `particle_color` | string | 粒子颜色 | "#FFD700" |

## 障碍物属性 (Obstacle Properties)

| 标准属性名 | 类型 | 说明 | 默认值 |
|-----------|------|------|--------|
| `destructible` | bool | 可破坏 | false |
| `health` | int | 生命值 | 3 |
| `movable` | bool | 可推动 | false |

## 静态危险物属性 (StaticHazard Properties)

| 标准属性名 | 类型 | 说明 | 默认值 |
|-----------|------|------|--------|
| `damage` | int | 伤害值 | 1 |

## 目标物属性 (Goal Properties)

目标物（Goal）用于标记关卡完成点，无需特殊属性配置。当玩家接触目标物时：
- 自动检查是否收集了所有 `must_collect` 为 `true` 的收集品
- 满足条件时触发胜利场景

## 触发器属性 (Trigger Properties)

### 移动触发器
| 标准属性名 | 类型 | 说明 |
|-----------|------|------|
| `event_type` | string | "move" |
| `target_uuid` | string | 目标对象UUID |
| `velocity_x` | float | X方向速度 |
| `velocity_y` | float | Y方向速度 |
| `duration` | int | 持续时间(毫秒) |
| `repeat` | bool | 是否重复 |
| `delay` | int | 延迟时间(毫秒) |
| `return_to_origin` | bool | 返回原点 |

### 缩放触发器
| 标准属性名 | 类型 | 说明 |
|-----------|------|------|
| `event_type` | string | "scale" |
| `target_uuid` | string | 目标对象UUID |
| `scale_x` | float | X轴缩放 |
| `scale_y` | float | Y轴缩放 |

### 触发器视觉属性
| 标准属性名 | 类型 | 说明 | 默认值 |
|-----------|------|------|--------|
| `texture` / `texture_key` | string | 默认纹理键名 | 无 |
| `active_texture` / `texture_active` | string | 激活状态纹理 | 无 |
| `inactive_texture` / `texture_inactive` | string | 非激活状态纹理 | 无 |
| `use_sprite` | bool | 使用动画精灵还是静态图像 | false |
| `visual_scale` | float | 视觉缩放比例 | 1.0 |

### 视觉属性说明
- 触发器默认不可见，添加纹理属性可使其可视化
- `texture` / `texture_key`: 触发器的基础纹理
- `active_texture`: 触发器激活时显示的纹理
- `inactive_texture`: 触发器未激活时显示的纹理  
- `use_sprite`: `true` 使用动画精灵，`false` 使用静态图像
- `visual_scale`: 控制视觉表示的大小，不影响碰撞区域

## 🎨 颜色值标准

所有颜色属性必须使用十六进制格式：

| 格式 | 示例 | 说明 |
|------|------|------|
| `#RRGGBB` | `#FF0000` | 红色 |
| `#RRGGBB` | `#00FF00` | 绿色 |
| `#RRGGBB` | `#0000FF` | 蓝色 |
| `#RRGGBB` | `#FFD700` | 金色 |

## 📝 配置示例

### 正确的瓦片集配置
```json
{
  "firstgid": 1,
  "image": "terrain_grass_block",
  "name": "terrain_grass_block_center",
  "tilecount": 1,
  "tileheight": 64,
  "tilewidth": 64,
  "tiles": [
    {
      "id": 0,
      "properties": [
        {
          "name": "collides",
          "type": "bool",
          "value": true
        }
      ]
    }
  ]
}
```

### 正确的精灵图集配置
```json
{
  "firstgid": 3,
  "image": "character_purple_image",
  "name": "character_purple",
  "tilecount": 1,
  "tileheight": 102,
  "tilewidth": 84,
  "tiles": [
    {
      "id": 0,
      "properties": [
        {
          "name": "atlas",
          "type": "bool",
          "value": true
        }
      ]
    }
  ]
}
```

### 正确的敌人配置
```json
{
  "gid": 8,
  "height": 64,
  "id": 10,
  "name": "frog",
  "properties": [
    {
      "name": "uuid",
      "type": "string",
      "value": "enemy-frog-001"
    },
    {
      "name": "damage",
      "type": "int",
      "value": 2
    },
    {
      "name": "move_method",
      "type": "string",
      "value": "move_and_jump"
    },
    {
      "name": "move_speed",
      "type": "int",
      "value": 120
    },
    {
      "name": "jump_power",
      "type": "int",
      "value": 450
    },
    {
      "name": "patrol_distance",
      "type": "int",
      "value": 250
    },
    {
      "name": "detection_range",
      "type": "int",
      "value": 300
    },
    {
      "name": "jump_interval",
      "type": "int",
      "value": 1800
    },
    {
      "name": "death_particle_color",
      "type": "string",
      "value": "#00FF00"
    }
  ],
  "rotation": 0,
  "type": "enemy",
  "visible": true,
  "width": 64,
  "x": 400,
  "y": 1504
}
```

### 正确的静态危险物配置
```json
{
  "gid": 4,
  "height": 64,
  "id": 15,
  "name": "spikes",
  "properties": [
    {
      "name": "uuid",
      "type": "string",
      "value": "hazard-spikes-001"
    },
    {
      "name": "damage",
      "type": "int",
      "value": 2
    }
  ],
  "rotation": 0,
  "type": "hazard",
  "visible": true,
  "width": 64,
  "x": 448,
  "y": 1088
}
```

### 正确的可视化触发器配置
```json
{
  "height": 64,
  "id": 20,
  "name": "button_trigger",
  "properties": [
    {
      "name": "uuid",
      "type": "string",
      "value": "trigger-button-001"
    },
    {
      "name": "event_type",
      "type": "string",
      "value": "move"
    },
    {
      "name": "target_uuid",
      "type": "string",
      "value": "platform-001"
    },
    {
      "name": "velocity_x",
      "type": "float",
      "value": 0
    },
    {
      "name": "velocity_y",
      "type": "float",
      "value": -200
    },
    {
      "name": "duration",
      "type": "int",
      "value": 2000
    },
    {
      "name": "texture_key",
      "type": "string",
      "value": "button_idle"
    },
    {
      "name": "active_texture",
      "type": "string",
      "value": "button_pressed"
    },
    {
      "name": "use_sprite",
      "type": "bool",
      "value": true
    },
    {
      "name": "visual_scale",
      "type": "float",
      "value": 1.2
    }
  ],
  "rotation": 0,
  "type": "trigger",
  "visible": false,
  "width": 128,
  "x": 384,
  "y": 708
}
```

## 🔍 验证清单

AI生成配置时必须检查：

- [ ] 所有属性名与标准文档完全匹配
- [ ] 属性名使用下划线分隔（snake_case）
- [ ] 布尔值使用true/false（不是"true"/"false"字符串）
- [ ] 颜色值使用#RRGGBB格式
- [ ] 枚举值在允许的列表中
- [ ] 数值在合理范围内
- [ ] UUID格式正确且唯一

## 🚨 AI生成提醒

**在生成任何tilemap配置时，AI必须：**

1. **优先参考此文档**中的标准属性名
2. **完全匹配**属性名（大小写敏感）
3. **使用正确的数据类型**（int、string、bool、float）
4. **验证属性值**在允许范围内
5. **避免使用**驼峰命名法（camelCase）
6. **避免使用**常见的错误属性名

遵循这些标准可以确保生成的配置与游戏代码完美兼容。
