import { Scene } from 'phaser';
import { URLParameterManager } from '../utils/URLParameterManager';

export class Boot extends Scene
{
    private urlParams: URLParameterManager;

    constructor ()
    {
        super('Boot');
        this.urlParams = URLParameterManager.getInstance();
    }

    preload ()
    {
        //  The Boot Scene is typically used to load in any assets you require for your Preloader, such as a game logo or background.
        //  The smaller the file size of the assets, the better, as the Boot Scene itself has no preloader.

        this.load.image('background', 'assets/bg.png');
        
        // 处理URL参数
        this.handleURLParameters();

        // 加载游戏配置文件（支持远程配置）
        this.loadGameConfig();
    }

    create ()
    {
        console.log('[Boot] 游戏配置加载完成，启动Preloader...');
        this.scene.start('Preloader');
    }

    /**
     * 处理URL参数
     */
    private handleURLParameters(): void {
        // 调试模式
        if (this.urlParams.isDebugMode()) {
            // 安全地设置物理调试模式
            if (this.game.config.physics && 'arcade' in this.game.config.physics && this.game.config.physics.arcade) {
                this.game.config.physics.arcade.debug = true;
            }
            this.registry.set('debugMode', true);
            console.log('[Boot] 调试模式已启用');
        }
        
        // 关卡选择
        if (this.urlParams.hasLevel()) {
            const selectedLevel = this.urlParams.getLevel();
            this.registry.set('selectedLevel', selectedLevel);
            console.log(`[Boot] 设置关卡: ${selectedLevel}`);
        }
    }

    /**
     * 加载游戏配置文件（支持远程配置）
     */
    private loadGameConfig(): void {
        // 检查是否有project_id和api_host参数
        const projectId = this.urlParams.getParameter('project_id');
        const apiHost = this.urlParams.getParameter('api_host');
        
        if (projectId && apiHost) {
            // 构建远程配置URL
            const remoteConfigUrl = `${apiHost}/game/api/public/projects/${projectId}/game_config?env=dev`;
            console.log('[Boot] 检测到project_id和api_host参数，尝试从远程加载配置:', remoteConfigUrl);
            
            // 验证参数格式
            if (!this.isValidProjectId(projectId) || !this.isValidApiHost(apiHost)) {
                console.warn('[Boot] 无效的project_id或api_host参数，使用本地配置');
                this.loadLocalGameConfig();
                return;
            }
            
            // 尝试加载远程配置，失败时回退到本地
            this.loadRemoteGameConfig(remoteConfigUrl);
        } else {
            // 使用本地配置文件
            console.log('[Boot] 使用本地游戏配置文件...');
            this.loadLocalGameConfig();
        }
    }

    /**
     * 从远程URL加载游戏配置
     */
    private loadRemoteGameConfig(url: string): void {
        console.log('[Boot] 使用GameConfigLoader加载远程配置:', url);
        
        // 直接使用GameConfigLoader加载远程配置
        // 这样可以复用所有现有的处理逻辑
        this.load.gameConfig('remote-game-config', url);
        
        // 监听加载错误，失败时回退到本地配置
        this.load.once('loaderror', (file: any) => {
            if (file.key === 'remote-game-config') {
                console.warn('[Boot] 远程配置加载失败，回退到本地配置:', file.src);
                this.loadLocalGameConfig();
            }
        });
    }

    /**
     * 加载本地游戏配置
     */
    private loadLocalGameConfig(): void {
        console.log('[Boot] 加载本地游戏配置文件');
        this.load.gameConfig('game-config', 'assets/game_config.json');
    }

    /**
     * 验证project_id参数格式
     */
    private isValidProjectId(projectId: string): boolean {
        // project_id应该是数字
        return /^\d+$/.test(projectId);
    }

    /**
     * 验证api_host参数格式
     */
    private isValidApiHost(apiHost: string): boolean {
        // api_host应该是有效的域名格式
        const hostPattern = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
        return hostPattern.test(apiHost);
    }
}
