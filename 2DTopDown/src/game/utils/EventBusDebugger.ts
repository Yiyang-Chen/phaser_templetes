import { eventBus, GameEvent } from '../events/EventBus';

/**
 * EventBus Debugger - 用于调试和监控 EventBus 事件
 */
export class EventBusDebugger {
    private static instance: EventBusDebugger;
    private enabled: boolean = false;
    private eventCounts: Map<GameEvent, number> = new Map();
    
    private constructor() {}
    
    public static getInstance(): EventBusDebugger {
        if (!EventBusDebugger.instance) {
            EventBusDebugger.instance = new EventBusDebugger();
        }
        return EventBusDebugger.instance;
    }
    
    /**
     * 启用调试器并监听所有事件
     */
    public enable(): void {
        if (this.enabled) return;
        
        this.enabled = true;
        eventBus.setDebugMode(true);
        
        // 监听所有定义的事件
        Object.values(GameEvent).forEach((event) => {
            eventBus.on(event as GameEvent, (data: any) => {
                this.logEvent(event as GameEvent, data);
            });
        });
        
        console.log('[EventBusDebugger] Enabled - Monitoring all events');
    }
    
    /**
     * 禁用调试器
     */
    public disable(): void {
        if (!this.enabled) return;
        
        this.enabled = false;
        eventBus.setDebugMode(false);
        
        console.log('[EventBusDebugger] Disabled');
    }
    
    /**
     * 记录事件
     */
    private logEvent(event: GameEvent, data: any): void {
        const count = (this.eventCounts.get(event) || 0) + 1;
        this.eventCounts.set(event, count);
        
        const timestamp = new Date().toLocaleTimeString();
        
        // 使用不同颜色区分不同类型的事件
        let color = '#ffffff';
        if (event.startsWith('scene:')) color = '#00ff00';
        else if (event.startsWith('player:')) color = '#00ffff';
        else if (event.startsWith('bgm:')) color = '#ff00ff';
        else if (event.startsWith('sound:')) color = '#ffff00';
        else if (event.startsWith('game:')) color = '#ff8800';
        else if (event.startsWith('animation:')) color = '#88ff00';
        
        console.log(
            `%c[${timestamp}] Event: ${event} (Count: ${count})`,
            `color: ${color}; font-weight: bold`,
            data
        );
    }
    
    /**
     * 获取事件统计信息
     */
    public getStats(): Map<GameEvent, number> {
        return new Map(this.eventCounts);
    }
    
    /**
     * 清除统计信息
     */
    public clearStats(): void {
        this.eventCounts.clear();
        console.log('[EventBusDebugger] Stats cleared');
    }
    
    /**
     * 打印当前统计信息
     */
    public printStats(): void {
        console.log('[EventBusDebugger] Event Statistics:');
        console.table(Array.from(this.eventCounts.entries()).map(([event, count]) => ({
            Event: event,
            Count: count
        })));
    }
}

// 导出全局实例
export const eventBusDebugger = EventBusDebugger.getInstance();