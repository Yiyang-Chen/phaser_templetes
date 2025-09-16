import { SpriteAtlasFile } from '../CustomLoadFile/SpriteAtlasFile';

/**
 * 自定义精灵图集加载器
 * 扩展Phaser的LoaderPlugin，添加智能精灵图集加载功能
 */

// 扩展Phaser LoaderPlugin的类型定义
declare module 'phaser' {
    namespace Loader {
        interface LoaderPlugin {
            spriteAtlas(key: string, imageUrl: string): LoaderPlugin;
        }
    }
}

/**
 * 注册自定义精灵图集加载器
 * 在游戏启动时调用此函数来扩展Phaser的加载器
 */
export function registerCustomSpriteAtlasLoader() {
    console.log('🔧 注册自定义精灵图集加载器...');
    
    // 精灵图集加载 - 使用自定义文件类型
    Phaser.Loader.LoaderPlugin.prototype.spriteAtlas = function(
        key: string, 
        imageUrl: string
    ): Phaser.Loader.LoaderPlugin {
        console.log(`🎭 CustomSpriteAtlasLoader: 添加精灵图集到队列 - ${key}`);
        
        const file = new SpriteAtlasFile(this, key, imageUrl);
        this.addFile(file);  // 关键：添加到Phaser的加载队列
        
        return this;
    };
    
    console.log('✅ 自定义精灵图集加载器注册完成');
}

/**
 * 精灵图集加载器的使用示例
 * 
 * @example
 * ```typescript
 * // 在main.ts中注册
 * import { registerCustomSpriteAtlasLoader } from './resourceManager/CustomLoader/CustomSpriteAtlasLoader';
 * 
 * const StartGame = (parent: string) => {
 *     registerCustomSpriteAtlasLoader();
 *     // ... 其他初始化代码
 * }
 * 
 * // 在Scene中使用
 * preload() {
 *     this.load
 *         .image('logo', 'assets/logo.png')
 *         .spriteAtlas('player', 'assets/player/character_purple.png')  // 🎯 智能加载
 *         .spriteAtlas('enemy', 'assets/enemy/frog.png');
 * }
 * 
 * init() {
 *     // 监听精灵图集完成事件
 *     this.load.on('filecomplete-spriteAtlas-player', (key: string) => {
 *         console.log(`🎭 精灵图集加载完成 - ${key}`);
 *     });
 * }
 * 
 * create() {
 *     // 使用加载的图集
 *     const player = this.add.sprite(100, 100, 'player');
 *     
 *     // 使用动画配置（如果存在）
 *     if (this.cache.json.exists('player_animations')) {
 *         const animConfig = this.cache.json.get('player_animations');
 *         // 处理动画配置...
 *     }
 * }
 * ```
 * 
 * @description
 * 自动加载的文件：
 * - 图片文件：character_purple.png
 * - 图集配置：character_purple.json
 * - 动画配置：character_purple_animators.json
 */
