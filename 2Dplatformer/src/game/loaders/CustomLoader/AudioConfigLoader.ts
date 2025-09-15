import { AudioConfigFile } from '../CustomLoadFile/AudioConfigFile';
import { AudioType } from '../../audio/AudioManager';

declare module 'phaser' {
    namespace Loader {
        interface LoaderPlugin {
            /**
             * 加载音频配置文件并自动添加音频资源到队列
             * @param key 配置文件的键名
             * @param url 配置文件的URL
             * @param audioType 可选，指定只加载特定类型的音频（BGM或SFX）
             */
            audioConfig(key: string, url: string, audioType?: AudioType): LoaderPlugin;
        }
    }
}

/**
 * 注册音频配置加载器
 */
export function registerAudioConfigLoader() {
    console.log('🔧 注册音频配置加载器...');
    
    Phaser.Loader.LoaderPlugin.prototype.audioConfig = function(
        key: string, 
        url: string,
        audioType?: AudioType
    ): Phaser.Loader.LoaderPlugin {
        console.log(`📦 AudioConfigLoader: 添加音频配置到队列 - ${key} (${audioType || '全部'})`);
        
        const file = new AudioConfigFile(this, key, url, audioType);
        this.addFile(file);
        
        return this;
    };
    
    console.log('✅ 音频配置加载器注册完成');
}
