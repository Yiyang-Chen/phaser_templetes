/**
 * URL参数管理器
 * 用于处理游戏启动时的URL参数（仅支持debug模式）
 */
export class URLParameterManager {
    private static instance: URLParameterManager;
    private debugMode: boolean = false;

    private constructor() {
        this.parseURLParameters();
    }

    public static getInstance(): URLParameterManager {
        if (!URLParameterManager.instance) {
            URLParameterManager.instance = new URLParameterManager();
        }
        return URLParameterManager.instance;
    }

    /**
     * 解析URL参数
     */
    private parseURLParameters(): void {
        const urlParams = new URLSearchParams(window.location.search);
        
        // 只检查debug参数
        const debugValue = urlParams.get('debug');
        if (debugValue) {
            this.debugMode = debugValue.toLowerCase() === 'true' || debugValue === '1' || debugValue.toLowerCase() === 'yes';
            console.log('🎮 检测到URL参数: debug=' + debugValue);
        }
    }

    /**
     * 检查是否启用调试模式
     */
    public isDebugMode(): boolean {
        return this.debugMode;
    }
}
