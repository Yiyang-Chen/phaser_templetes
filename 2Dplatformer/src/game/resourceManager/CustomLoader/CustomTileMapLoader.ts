import { CustomTilemapFile } from '../CustomLoadFile/CustomTilemapFile';

/**
 * 自定义Tilemap加载器
 * 扩展Phaser的LoaderPlugin，添加智能tilemap加载功能
 */

// 扩展Phaser LoaderPlugin的类型定义
declare module 'phaser' {
    namespace Loader {
        interface LoaderPlugin {
            customTilemap(key: string, url: string): LoaderPlugin;
        }
    }
}

/**
 * 注册自定义Tilemap加载器
 * 在游戏启动时调用此函数来扩展Phaser的加载器
 */
export function registerCustomTilemapLoader() {
    console.log('🔧 注册自定义Tilemap加载器...');
    
    // 自定义tilemap加载 - 使用自定义文件类型
    Phaser.Loader.LoaderPlugin.prototype.customTilemap = function(
        key: string, 
        url: string
    ): Phaser.Loader.LoaderPlugin {
        console.log(`📦 CustomTilemapLoader: 添加自定义tilemap到队列 - ${key}`);
        
        const file = new CustomTilemapFile(this, key, url);
        this.addFile(file);  // 关键：添加到Phaser的加载队列
        
        return this;
    };
    
    console.log('✅ 自定义Tilemap加载器注册完成');
}

/**
 * 智能Tilemap加载器的使用示例
 * 
 * @example
 * ```typescript
 * // 在main.ts中注册
 * import { registerCustomTilemapLoader } from './resourceManager/CustomLoader/CustomTileMapLoader';
 * 
 * const StartGame = (parent: string) => {
 *     registerCustomTilemapLoader();
 *     // ... 其他初始化代码
 * }
 * 
 * // 在Scene中使用
 * preload() {
 *     this.load
 *         .image('logo', 'assets/logo.png')
 *         .customTilemap('tilemap', 'assets/tilemap/scenes/tilemap.json')  // 🎯 自定义加载
 *         .audio('bgm', 'assets/audio/bgm.mp3');
 * }
 * 
 * init() {
 *     // 监听自定义tilemap完成事件
 *     this.load.on('filecomplete-customTilemap-tilemap', (key: string) => {
 *         console.log(`🗺️ 自定义tilemap加载完成 - ${key}`);
 *     });
 * }
 * ```
 */
