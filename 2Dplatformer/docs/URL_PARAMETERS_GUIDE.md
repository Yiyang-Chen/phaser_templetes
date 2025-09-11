# URL参数使用指南

## 概述

这个2D平台游戏模板支持通过URL参数进行配置，这是一个示例实现，展示了如何在游戏启动时读取和处理URL参数。

## 支持的参数

### debug (调试参数)

启用调试模式，用于开发和测试目的。

**使用方法：**
```
https://yourgame.com/?debug=true
```

**效果：**
- 在浏览器控制台中显示调试信息
- 启用Phaser物理引擎的调试显示（碰撞框等）
- 在游戏画面右上角显示 "DEBUG MODE" 视觉指示器

### level (关卡选择参数)

直接跳转到指定关卡，跳过主菜单。

**使用方法：**
```
https://yourgame.com/?level=1
https://yourgame.com/?level=2
https://yourgame.com/?level=3
```

**效果：**
- 跳过主菜单，直接进入指定关卡
- 参数必须是正整数（1, 2, 3...）
- 无效参数会显示警告并使用默认流程

## 技术实现示例

### URL参数解析

```typescript
// 解析URL参数
const urlParams = new URLSearchParams(window.location.search);

// 解析debug参数
const debugValue = urlParams.get('debug');
const debugMode = debugValue?.toLowerCase() === 'true' || debugValue === '1';

// 解析level参数
const levelValue = urlParams.get('level');
let level: number | null = null;
if (levelValue) {
    const levelInt = parseInt(levelValue, 10);
    if (!isNaN(levelInt) && levelInt > 0) {
        level = levelInt;
    }
}
```

### 参数传递

```typescript
// 通过Phaser Registry在场景间传递参数
this.registry.set('debugMode', debugMode);
this.registry.set('selectedLevel', level);
```

### 参数使用

```typescript
// 在游戏场景中使用参数
if (this.registry.get('debugMode')) {
    // 创建调试视觉指示器
    const debugText = this.add.text(x, y, 'DEBUG MODE', style);
}

const selectedLevel = this.registry.get('selectedLevel') || 1;
console.log('当前关卡:', selectedLevel);
```

## 扩展指南

### 添加新参数

1. **在URLParameterManager中添加参数检查：**
```typescript
private parseURLParameters(): void {
    const urlParams = new URLSearchParams(window.location.search);
    
    // 检查debug参数
    const debugValue = urlParams.get('debug');
    if (debugValue) {
        this.debugMode = debugValue.toLowerCase() === 'true';
    }
    
    // 添加新参数
    const newParam = urlParams.get('newParam');
    if (newParam) {
        this.newParamValue = newParam;
    }
}
```

2. **在Boot场景中处理参数：**
```typescript
private handleURLParameters(): void {
    if (this.urlParams.isDebugMode()) {
        // 处理debug模式
    }
    
    // 处理新参数
    const newValue = this.urlParams.getNewParam();
    this.registry.set('newParam', newValue);
}
```

3. **在游戏场景中使用参数：**
```typescript
create() {
    const newValue = this.registry.get('newParam');
    if (newValue) {
        // 根据参数值执行相应逻辑
    }
}
```

## 部署注意事项

- 确保在生产环境中移除或限制敏感参数的访问
- 考虑参数验证和错误处理
- 对于需要持久化的设置，考虑使用localStorage
- 避免在URL中传递敏感信息

## 代码位置

- URL参数管理：`src/game/utils/URLParameterManager.ts`
- 参数处理：`src/game/scenes/Boot.ts`
- 参数使用：`src/game/scenes/Game.ts`

## 示例URL

```
# 启用调试模式
https://yourgame.com/?debug=true
https://yourgame.com/?debug=1

# 直接进入关卡
https://yourgame.com/?level=1
https://yourgame.com/?level=2
https://yourgame.com/?level=3

# 组合参数
https://yourgame.com/?debug=true&level=2
```

这个实现展示了如何构建一个灵活的参数系统，支持调试模式和关卡选择，可以根据项目需求进行扩展和定制。