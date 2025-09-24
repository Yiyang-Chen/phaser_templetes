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
| `can_charge_jump` | bool | 可以蓄力跳 | true |
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

## 🎨 颜色值标准

所有颜色属性必须使用十六进制格式：

| 格式 | 示例 | 说明 |
|------|------|------|
| `#RRGGBB` | `#FF0000` | 红色 |
| `#RRGGBB` | `#00FF00` | 绿色 |
| `#RRGGBB` | `#0000FF` | 蓝色 |
| `#RRGGBB` | `#FFD700` | 金色 |

## 📝 配置示例

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
