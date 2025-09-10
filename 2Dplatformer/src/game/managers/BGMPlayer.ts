import * as Phaser from 'phaser';
import { eventBus, GameEvent } from '../events/EventBus';

interface BGMConfig {
  scenes: {
    [sceneName: string]: {
      bgm: string;
      loop?: boolean;
      volume?: number;
    };
  };
  bgmList: {
    [key: string]: {
      url: string;
      preload?: boolean;
    };
  };
}

export class BGMPlayer {
  private static instance: BGMPlayer;
  private game: Phaser.Game | null = null;
  private bgmConfig: BGMConfig | null = null;
  private currentBGM: string | null = null;
  private currentBGMSound: Phaser.Sound.BaseSound | null = null;
  private currentScene: string | null = null;
  private loadedSounds: Set<string> = new Set();
  private isInitialized: boolean = false;
  private activeScene: Phaser.Scene | null = null;

  private constructor() {}

  public static getInstance(): BGMPlayer {
    if (!BGMPlayer.instance) {
      BGMPlayer.instance = new BGMPlayer();
    }
    return BGMPlayer.instance;
  }

  public initialize(game: Phaser.Game): void {
    if (this.isInitialized) {
      return;
    }

    this.game = game;
    this.init();
  }

  private async init(): Promise<void> {
    await this.loadBGMConfig();
    this.setupSceneListener();
    this.setupEventListeners();
    this.isInitialized = true;
  }
  
  private setupEventListeners(): void {
    // Listen for scene change events
    eventBus.on(GameEvent.SCENE_CHANGE, (data) => {
      this.onSceneChange(data.to);
    });
    
    // Listen for BGM control events
    eventBus.on(GameEvent.BGM_PLAY, (data) => {
      this.playBGM(data.key, data.loop ?? true, data.volume ?? 1.0);
    });
    
    eventBus.on(GameEvent.BGM_STOP, (data) => {
      if (data.key) {
        // Stop specific BGM
        if (this.currentBGM === data.key) {
          this.stopCurrentBGM();
        }
      } else {
        // Stop all BGM
        this.stopCurrentBGM();
      }
    });
    
    eventBus.on(GameEvent.BGM_PAUSE, () => {
      this.pauseCurrentBGM();
    });
    
    eventBus.on(GameEvent.BGM_RESUME, () => {
      this.resumeCurrentBGM();
    });
    
    eventBus.on(GameEvent.BGM_VOLUME_CHANGE, (data) => {
      this.setVolume(data.volume);
    });
  }

  private async preloadAllSounds(): Promise<void> {
    if (!this.bgmConfig?.bgmList || !this.activeScene) {
      return;
    }

    const soundsToPreload: Array<{ key: string; url: string }> = [];
    
    // Collect all sounds that need preloading
    for (const [key, bgmData] of Object.entries(this.bgmConfig.bgmList)) {
      if (bgmData.preload && !this.loadedSounds.has(key) && !this.activeScene.cache.audio.exists(key)) {
        soundsToPreload.push({ key, url: bgmData.url });
      }
    }

    if (soundsToPreload.length === 0) {
      return;
    }

    return new Promise<void>((resolve, reject) => {
      // Add all sounds to the loader queue
      soundsToPreload.forEach(({ key, url }) => {
        this.activeScene!.load.audio(key, url);
      });

      // Setup load complete event handler
      this.activeScene!.load.once('complete', () => {
        // Mark all successfully loaded sounds
        soundsToPreload.forEach(({ key }) => {
          if (this.activeScene!.cache.audio.exists(key)) {
            this.loadedSounds.add(key);
            // console.log(`BGMPlayer: Preloaded sound "${key}"`);
          }
        });
        // console.log(`BGMPlayer: Preloaded ${soundsToPreload.length} sound(s)`);
        resolve();
      });

      // Setup error handler
      this.activeScene!.load.once('loaderror', (fileObj: any) => {
        console.error(`BGMPlayer: Failed to preload sound "${fileObj.key}" from "${fileObj.url}"`);
        // Continue loading other sounds even if one fails
      });

      // Start the loader
      this.activeScene!.load.start();
    });
  }

  private async loadBGMConfig(): Promise<void> {
    try {
      const response = await fetch('/assets/audio/bgm-config.json');
      if (!response.ok) {
        throw new Error(`Failed to load BGM config: ${response.statusText}`);
      }
      this.bgmConfig = await response.json();
      // console.log('BGMPlayer: BGM config loaded successfully', this.bgmConfig);

      // Preload sounds marked for preloading
      if (this.bgmConfig?.bgmList && this.game) {
        const activeScenes = this.game.scene.getScenes(true);
        if (activeScenes.length > 0) {
          this.activeScene = activeScenes[0];
          await this.preloadAllSounds();
        }
      }
    } catch (error) {
      console.error('BGMPlayer: Error loading BGM config:', error);
      // Continue without BGM if config fails to load
      this.bgmConfig = { scenes: {}, bgmList: {} };
    }
  }

  private setupSceneListener(): void {
    if (!this.game) return;

    // Monitor scene changes using Phaser's game step event
    this.game.events.on('step', () => {
      this.checkSceneChange();
    });
  }

  private checkSceneChange(): void {
    if (!this.game || !this.bgmConfig) return;

    const activeScenes = this.game.scene.getScenes(true);
    const primaryScene = activeScenes.find(scene => 
      ['MainMenu', 'Game', 'Victory', 'GameOver'].includes(scene.scene.key)
    );

    if (primaryScene && primaryScene.scene.key !== this.currentScene) {
      const previousScene = this.currentScene;
      this.currentScene = primaryScene.scene.key;
      this.activeScene = primaryScene;
      // console.log(`BGMPlayer: Scene changed to ${this.currentScene}`);
      
      // Emit scene change event
      if (previousScene) {
        eventBus.emit(GameEvent.SCENE_CHANGE, {
          from: previousScene,
          to: this.currentScene
        });
      } else {
        this.onSceneChange(this.currentScene);
      }
    }
  }

  private onSceneChange(sceneName: string): void {
    if (!this.bgmConfig) {
      return;
    }

    const sceneConfig = this.bgmConfig.scenes[sceneName];

    if (!sceneConfig) {
      // No BGM configured for this scene, stop current BGM
      this.stopCurrentBGM();
      return;
    }

    const bgmKey = sceneConfig.bgm;

    // If same BGM is already playing, don't restart it
    if (this.currentBGM === bgmKey && this.currentBGMSound?.isPlaying) {
      return;
    }

    // Stop current BGM if any
    this.stopCurrentBGM();

    // Play new BGM
    this.playBGM(bgmKey, sceneConfig.loop ?? true, sceneConfig.volume ?? 1.0);
  }

  private async playBGM(bgmKey: string, loop: boolean = true, volume: number = 1.0): Promise<void> {
    if (!this.bgmConfig?.bgmList[bgmKey] || !this.activeScene) {
      console.warn(`BGMPlayer: BGM key "${bgmKey}" not found in configuration or no active scene`);
      return;
    }

    const bgmData = this.bgmConfig.bgmList[bgmKey];

    try {
      // Check if sound is already loaded
      if (this.loadedSounds.has(bgmKey)) {
        // Sound is loaded, play it directly
        this.playSoundInstance(bgmKey, loop, volume);
      } else {
        // Sound not loaded, load it asynchronously
        await this.loadSound(bgmKey, bgmData.url);
        this.playSoundInstance(bgmKey, loop, volume);
      }
    } catch (error) {
      console.error(`BGMPlayer: Error playing BGM "${bgmKey}":`, error);
    }
  }

  private async loadSound(key: string, url: string): Promise<void> {
    if (!this.activeScene || this.loadedSounds.has(key)) {
      return; // Already loaded or no scene available
    }

    // Check if sound is already in cache
    if (this.activeScene.cache.audio.exists(key)) {
      this.loadedSounds.add(key);
      return;
    }

    try {
      await new Promise<void>((resolve, reject) => {
        this.activeScene!.load.audio(key, url);
        
        this.activeScene!.load.once('complete', () => {
          if (this.activeScene!.cache.audio.exists(key)) {
            this.loadedSounds.add(key);
            // console.log(`BGMPlayer: Sound "${key}" loaded successfully`);
            resolve();
          } else {
            reject(new Error(`Failed to load sound "${key}"`));
          }
        });

        this.activeScene!.load.once('loaderror', () => {
          reject(new Error(`Failed to load sound "${key}" from "${url}"`));
        });

        this.activeScene!.load.start();
      });
    } catch (error) {
      console.error(`BGMPlayer: Failed to load sound "${key}" from "${url}":`, error);
      throw error;
    }
  }

  private playSoundInstance(key: string, loop: boolean, volume: number): void {
    if (!this.activeScene) return;

    try {
      this.currentBGMSound = this.activeScene.sound.add(key, {
        loop: loop,
        volume: volume
      });

      this.currentBGMSound.play();
      this.currentBGM = key;
      // console.log(`BGMPlayer: Playing BGM: ${key}`);
    } catch (error) {
      console.error(`BGMPlayer: Error playing sound instance "${key}":`, error);
    }
  }

  private stopCurrentBGM(): void {
    if (this.currentBGMSound) {
      try {
        this.currentBGMSound.stop();
        this.currentBGMSound.destroy();
        // console.log(`BGMPlayer: Stopped BGM: ${this.currentBGM}`);
      } catch (error) {
        console.error(`BGMPlayer: Error stopping BGM "${this.currentBGM}":`, error);
      }
      this.currentBGMSound = null;
      this.currentBGM = null;
    }
  }

  public stopAll(): void {
    this.stopCurrentBGM();
  }

  public pauseCurrentBGM(): void {
    if (this.currentBGMSound && this.currentBGMSound.isPlaying) {
      this.currentBGMSound.pause();
    }
  }

  public resumeCurrentBGM(): void {
    if (this.currentBGMSound && !this.currentBGMSound.isPlaying) {
      this.currentBGMSound.resume();
    }
  }

  public setVolume(volume: number): void {
    const clampedVolume = Math.max(0, Math.min(1, volume));
    if (this.currentBGMSound && 'setVolume' in this.currentBGMSound) {
      (this.currentBGMSound as any).setVolume(clampedVolume);
    }
  }

  public getCurrentBGM(): string | null {
    return this.currentBGM;
  }

  public getCurrentScene(): string | null {
    return this.currentScene;
  }

  // Trigger a scene change manually (for testing or external control)
  public changeScene(sceneName: string): void {
    this.currentScene = sceneName;
    this.onSceneChange(sceneName);
  }

  public destroy(): void {
    this.stopAll();
    if (this.game) {
      this.game.events.off('step');
    }
    this.game = null;
    this.activeScene = null;
    this.bgmConfig = null;
    this.loadedSounds.clear();
    BGMPlayer.instance = null as any;
  }
}