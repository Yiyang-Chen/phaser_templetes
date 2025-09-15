import { registerCustomTilemapLoader } from './CustomLoader/CustomTileMapLoader';
import { registerCustomSpriteAtlasLoader } from './CustomLoader/CustomSpriteAtlasLoader';

/**
 * 扩展Phaser加载器
 * 注册所有自定义加载器到Phaser系统
 */
export function extendLoader() {
    console.log('🔧 初始化所有自定义加载器...');
    
    // 注册智能tilemap加载器
    registerCustomTilemapLoader();
    
    // 注册精灵图集加载器
    registerCustomSpriteAtlasLoader();
    
    console.log('✅ 所有自定义加载器初始化完成');
}
