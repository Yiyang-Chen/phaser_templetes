import type { CollectibleProperties } from '../types/GameTypes';
import { SingletonManager } from '../core/BaseManager';

export interface CollectedItemData {
    name: string;           // Item name (texture key)
    type: string;          // Item type for grouping
    count: number;         // Number collected
    score: number;         // Total score from this item type
    properties: CollectibleProperties;       // Additional properties
}

export class CollectedItemsManager extends SingletonManager {
    private items: Map<string, CollectedItemData> = new Map();
    private totalScore: number = 0;
    private mustCollectItems: Set<string> = new Set();
    private collectedMustHaveItems: Set<string> = new Set();
    
    constructor() {
        super();
    }
    
    protected onInitialize(): void {
        this.reset();
    }
    
    reset(): void {
        this.items.clear();
        this.totalScore = 0;
        this.mustCollectItems.clear();
        this.collectedMustHaveItems.clear();
    }
    
    addMustCollectItem(itemName: string): void {
        this.mustCollectItems.add(itemName);
    }
    
    collectItem(name: string, type: string, score: number = 0, isMustCollect: boolean = false, properties: CollectibleProperties = {}): void {
        // Update item collection data
        if (!this.items.has(name)) {
            this.items.set(name, {
                name,
                type,
                count: 0,
                score: 0,
                properties
            });
        }
        
        const itemData = this.items.get(name)!;
        itemData.count++;
        itemData.score += score;
        
        // Update total score
        this.totalScore += score;
        
        // Track must-collect items
        if (isMustCollect) {
            this.collectedMustHaveItems.add(name);
        }
    }
    
    hasCollectedAllRequired(): boolean {
        for (const required of this.mustCollectItems) {
            if (!this.collectedMustHaveItems.has(required)) {
                return false;
            }
        }
        return true;
    }
    
    getMissingRequiredItems(): string[] {
        const missing: string[] = [];
        for (const required of this.mustCollectItems) {
            if (!this.collectedMustHaveItems.has(required)) {
                missing.push(required);
            }
        }
        return missing;
    }
    
    getTotalScore(): number {
        return this.totalScore;
    }
    
    getCollectedItemsByType(): Map<string, CollectedItemData[]> {
        const groupedItems = new Map<string, CollectedItemData[]>();
        
        for (const item of this.items.values()) {
            if (!groupedItems.has(item.type)) {
                groupedItems.set(item.type, []);
            }
            groupedItems.get(item.type)!.push(item);
        }
        
        return groupedItems;
    }
    
    getAllCollectedItems(): CollectedItemData[] {
        return Array.from(this.items.values());
    }
    
    getItemCount(name: string): number {
        return this.items.get(name)?.count || 0;
    }
    
    getItemScore(name: string): number {
        return this.items.get(name)?.score || 0;
    }
    
    getSummaryData(): {
        totalScore: number;
        itemsByType: Map<string, CollectedItemData[]>;
        totalItemsCollected: number;
        uniqueItemsCollected: number;
        gameTime?: number;
        timeScore?: number;
        killScore?: number;
        killCount?: number;
    } {
        let totalItemsCollected = 0;
        for (const item of this.items.values()) {
            totalItemsCollected += item.count;
        }
        
        return {
            totalScore: this.totalScore,
            itemsByType: this.getCollectedItemsByType(),
            totalItemsCollected,
            uniqueItemsCollected: this.items.size
        };
    }
}