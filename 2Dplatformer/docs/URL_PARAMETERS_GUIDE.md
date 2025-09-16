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

### 🆕 dev_game_config_token (开发配置参数)

用于开发和测试环境，允许从远程URL加载游戏配置文件。

**使用方法：**
```
https://yourgame.com/?dev_game_config_token=https://example.com/config/game_config.json
```

**效果：**
- 优先从指定URL下载game_config.json
- 下载失败时自动回退到本地配置文件
- 支持动态配置切换，便于开发测试
- URL必须是有效的HTTP/HTTPS地址

**安全说明：**
- 仅建议在开发和测试环境中使用
- 生产环境应禁用此功能或添加域名白名单验证

## 技术实现示例

### 架构设计

本实现采用**单例模式**的URLParameterManager来管理URL参数，确保全局只有一个实例处理参数解析和访问。

### URLParameterManager类

```typescript
export class URLParameterManager {
    private static instance: URLParameterManager;
    private debugMode: boolean = false;
    private level: number | null = null;

    // 单例模式实现
    public static getInstance(): URLParameterManager {
        if (!URLParameterManager.instance) {
            URLParameterManager.instance = new URLParameterManager();
        }
        return URLParameterManager.instance;
    }

    // URL参数解析
    private parseURLParameters(): void {
        const urlParams = new URLSearchParams(window.location.search);
        
        // 解析debug参数
        const debugValue = urlParams.get('debug');
        if (debugValue) {
            this.debugMode = debugValue.toLowerCase() === 'true' || 
                           debugValue === '1' || 
                           debugValue.toLowerCase() === 'yes';
        }
        
        // 解析level参数
        const levelValue = urlParams.get('level');
        if (levelValue) {
            const levelInt = parseInt(levelValue, 10);
            if (!isNaN(levelInt) && levelInt > 0) {
                this.level = levelInt;
            }
        }
    }
}
```

### Boot场景中的参数处理

```typescript
export class Boot extends Scene {
    private urlParams: URLParameterManager;

    constructor() {
        super('Boot');
        // 获取单例实例
        this.urlParams = URLParameterManager.getInstance();
    }

    preload() {
        // 加载基础资源
        this.load.image('background', 'assets/bg.png');
        
        // 处理URL参数（在preload阶段处理）
        this.handleURLParameters();
        
        // 根据参数加载配置
        this.loadGameConfig();
    }

    create() {
        // 所有资源和配置已加载完成
        console.log('[Boot] 游戏配置加载完成，启动Preloader...');
        this.scene.start('Preloader');
    }

    private handleURLParameters(): void {
        // 调试模式处理
        if (this.urlParams.isDebugMode()) {
            // 安全地设置物理调试模式
            if (this.game.config.physics && 'arcade' in this.game.config.physics && this.game.config.physics.arcade) {
                this.game.config.physics.arcade.debug = true;
            }
            this.registry.set('debugMode', true);
            console.log('[Boot] 🐛 调试模式已启用');
        }
        
        // 关卡选择处理
        if (this.urlParams.hasLevel()) {
            const selectedLevel = this.urlParams.getLevel();
            this.registry.set('selectedLevel', selectedLevel);
            console.log(`[Boot] 🎯 设置关卡: ${selectedLevel}`);
        }
    }

    private loadGameConfig(): void {
        // 检查远程配置参数
        const devConfigUrl = this.urlParams.getParameter('dev_game_config_token');
        
        if (devConfigUrl) {
            console.log('[Boot] 🌐 检测到dev_game_config_token参数，尝试从远程加载配置');
            this.loadRemoteGameConfig(devConfigUrl);
        } else {
            console.log('[Boot] 📁 使用本地游戏配置文件');
            this.loadLocalGameConfig();
        }
    }

    private loadRemoteGameConfig(url: string): void {
        // 验证URL格式
        try {
            new URL(url);
        } catch (urlError) {
            console.warn('[Boot] ❌ 无效的URL格式，使用本地配置:', url);
            this.loadLocalGameConfig();
            return;
        }

        // 使用GameConfigLoader加载远程配置
        this.load.gameConfig('remote-game-config', url);
        
        // 监听加载错误，失败时回退到本地配置
        this.load.once('loaderror', (file: any) => {
            if (file.key === 'remote-game-config') {
                console.warn('[Boot] ⚠️ 远程配置加载失败，回退到本地配置');
                this.loadLocalGameConfig();
            }
        });
    }

    private loadLocalGameConfig(): void {
        this.load.gameConfig('game-config', 'assets/game_config.json');
    }
}
```

### 参数使用

```typescript
// 在任何场景中直接使用单例获取参数
const urlParams = URLParameterManager.getInstance();

if (urlParams.isDebugMode()) {
    // 创建调试视觉指示器
    const debugText = this.add.text(x, y, 'DEBUG MODE', style);
}

// 也可以通过registry获取Boot场景设置的值
const selectedLevel = this.registry.get('selectedLevel') || 1;
console.log('当前关卡:', selectedLevel);

// 或者直接从URLParameterManager获取
const levelFromManager = urlParams.getLevel() || 1;
console.log('当前关卡:', levelFromManager);
```

## 组合参数使用

### 开发调试组合

```
# 使用远程配置 + 调试模式 + 指定关卡
https://yourgame.com/?dev_game_config_token=https://dev-server.com/configs/test_config.json&debug=true&level=2

# 仅调试模式 + 指定关卡
https://yourgame.com/?debug=true&level=1
```

### 测试场景示例

```
# 测试新资源配置
https://yourgame.com/?dev_game_config_token=https://cdn.example.com/test/game_config_v2.json

# 快速测试特定关卡
https://yourgame.com/?level=3&debug=true

# 生产环境调试（不推荐）
https://yourgame.com/?debug=true
```

## 扩展指南

### 添加新参数

1. **在URLParameterManager中添加属性和解析逻辑：**
```typescript
export class URLParameterManager {
    private static instance: URLParameterManager;
    private debugMode: boolean = false;
    private level: number | null = null;
    private newParamValue: string | null = null; // 新参数

    private parseURLParameters(): void {
        const urlParams = new URLSearchParams(window.location.search);
        
        // 现有参数解析...
        
        // 添加新参数解析
        const newParam = urlParams.get('newParam');
        if (newParam) {
            this.newParamValue = newParam;
            console.log('[URLParameterManager] 检测到URL参数: newParam=' + newParam);
        }
    }

    // 添加访问方法
    public getNewParam(): string | null {
        return this.newParamValue;
    }

    public hasNewParam(): boolean {
        return this.newParamValue !== null;
    }
}
```

2. **在Boot场景中处理新参数：**
```typescript
private handleURLParameters(): void {
    // 现有参数处理...
    
    // 处理新参数
    if (this.urlParams.hasNewParam()) {
        const newValue = this.urlParams.getNewParam();
        this.registry.set('newParam', newValue);
        console.log(`[Boot] 设置新参数: ${newValue}`);
    }
}
```

3. **在游戏场景中使用参数：**
```typescript
create() {
    const newValue = this.registry.get('newParam');
    if (newValue) {
        // 根据参数值执行相应逻辑
        console.log('使用新参数:', newValue);
    }
}
```

## 代码特性

### 安全性改进

- **类型安全的物理调试设置**：使用安全的类型检查来设置Phaser物理调试模式
- **统一的日志格式**：使用`[ClassName]`前缀格式化日志输出，便于调试和维护
- **参数验证**：对level参数进行严格的数值验证，确保只接受正整数

### 架构优势

- **单例模式**：确保全局只有一个URLParameterManager实例，避免重复解析
- **全局访问**：任何场景都可以通过`getInstance()`直接访问，无需通过registry传递
- **职责分离**：URLParameterManager负责参数解析，Boot场景负责参数应用
- **类型安全**：使用TypeScript提供完整的类型检查和智能提示

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