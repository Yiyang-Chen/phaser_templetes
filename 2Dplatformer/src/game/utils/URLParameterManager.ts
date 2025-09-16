/**
 * URL参数管理器
 * 用于处理游戏启动时的URL参数（支持debug模式和level选择）
 */
export class URLParameterManager {
    private static instance: URLParameterManager;
    private debugMode: boolean = false;
    private level: number | null = null;

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
        
        // 检查debug参数
        const debugValue = urlParams.get('debug');
        if (debugValue) {
            this.debugMode = debugValue.toLowerCase() === 'true' || debugValue === '1' || debugValue.toLowerCase() === 'yes';
            console.log('[URLParameterManager] 检测到URL参数: debug=' + debugValue);
        }
        
        // 检查level参数
        const levelValue = urlParams.get('level');
        if (levelValue) {
            const levelInt = parseInt(levelValue, 10);
            if (!isNaN(levelInt) && levelInt > 0) {
                this.level = levelInt;
                console.log('[URLParameterManager] 检测到URL参数: level=' + levelInt);
            } else {
                console.warn('[URLParameterManager] 无效的level参数:', levelValue, '必须是正整数');
            }
        }
    }

    /**
     * 检查是否启用调试模式
     */
    public isDebugMode(): boolean {
        return this.debugMode;
    }

    /**
     * 获取指定的关卡
     */
    public getLevel(): number | null {
        return this.level;
    }

    /**
     * 检查是否指定了关卡
     */
    public hasLevel(): boolean {
        return this.level !== null;
    }

    /**
     * 获取指定的URL参数
     */
    public getParameter(name: string): string | null {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(name);
    }

    /**
     * 检查是否存在指定的URL参数
     */
    public hasParameter(name: string): boolean {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.has(name);
    }
}
