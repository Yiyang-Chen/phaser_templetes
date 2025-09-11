# URL参数使用指南

## 概述

这个2D平台游戏模板支持通过URL参数进行配置，这是一个示例实现，展示了如何在游戏启动时读取和处理URL参数。

## 支持的参数

### debug (示例参数)

启用调试模式，用于开发和测试目的。

**使用方法：**
```
https://yourgame.com/?debug=true
```

**效果：**
- 在浏览器控制台中显示调试信息
- 启用Phaser物理引擎的调试显示（碰撞框等）
- 在游戏画面右上角显示 "DEBUG MODE" 视觉指示器

## 技术实现示例

### URL参数解析

```typescript
// 解析URL参数
const urlParams = new URLSearchParams(window.location.search);
const debugValue = urlParams.get('debug');
const debugMode = debugValue?.toLowerCase() === 'true' || debugValue === '1';
```

### 参数传递

```typescript
// 通过Phaser Registry在场景间传递参数
this.registry.set('debugMode', debugMode);
```

### 视觉反馈

```typescript
// 在游戏场景中显示参数状态
if (this.registry.get('debugMode')) {
    // 创建视觉指示器
    const debugText = this.add.text(x, y, 'DEBUG MODE', style);
}
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
https://yourgame.com/?debug=true
https://yourgame.com/?debug=1
https://yourgame.com/?debug=yes
```

这个实现展示了如何构建一个灵活的参数系统，可以根据项目需求进行扩展和定制。