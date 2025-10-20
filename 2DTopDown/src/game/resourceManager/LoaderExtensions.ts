import { registerCustomTilemapLoader } from './CustomLoader/CustomTileMapLoader';
import { registerCustomSpriteAtlasLoader } from './CustomLoader/CustomSpriteAtlasLoader';
import { registerAudioConfigLoader } from './CustomLoader/AudioConfigLoader';
import { registerGameConfigLoader } from './CustomLoader/GameConfigLoader';
import { registerLevelSceneConfigLoader } from './CustomLoader/LevelSceneConfigLoader';

/**
 * 扩展Phaser加载器
 * 注册所有自定义加载器到Phaser系统
 */
export function extendLoader() {
    console.log('🔧 初始化所有自定义加载器...');
    
    // 注册自定义tilemap加载器
    registerCustomTilemapLoader();
    
    // 注册精灵图集加载器
    registerCustomSpriteAtlasLoader();
    
    // 注册音频配置加载器
    registerAudioConfigLoader();
    
    // 注册游戏配置加载器
    registerGameConfigLoader();
    
    // 注册关卡场景配置加载器
    registerLevelSceneConfigLoader();
    
    console.log('✅ 所有自定义加载器初始化完成');
}
