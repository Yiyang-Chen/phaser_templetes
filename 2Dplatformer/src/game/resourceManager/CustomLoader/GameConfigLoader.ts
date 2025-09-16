import { Loader } from 'phaser';
import { GlobalResourceManager, GameConfig } from '../GlobalResourceManager';

/**
 * 游戏配置加载器
 * 在Boot场景中加载并解析game_config.json，将资源字典保存到全局registry
 */

/**
 * 注册游戏配置加载器到Phaser
 */
export function registerGameConfigLoader(): void {
    // 扩展Loader类型定义
    Loader.LoaderPlugin.prototype.gameConfig = function(key: string, url: string) {
        console.log(`[GameConfigLoader] 添加游戏配置到加载队列: ${key} -> ${url}`);
        
        this.json(key, url);
        
        // 监听加载完成事件
        this.once('filecomplete-json-' + key, (_fileKey: string, _type: string, data: GameConfig) => {
            console.log('[GameConfigLoader] 游戏配置加载完成，初始化资源字典...');
            
            // 初始化全局资源管理器
            const resourceManager = GlobalResourceManager.getInstance();
            resourceManager.initializeFromConfig(data);
            
            console.log('[GameConfigLoader] 资源字典初始化完成');
        });

        return this;
    };

    console.log('✅ GameConfigLoader 注册完成');
}

// 扩展Phaser类型定义
declare module 'phaser' {
    namespace Loader {
        interface LoaderPlugin {
            gameConfig(key: string, url: string): LoaderPlugin;
        }
    }
}