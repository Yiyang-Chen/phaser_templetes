import { defineConfig } from 'vite';

const phasermsg = () => {
    return {
        name: 'phasermsg',
        buildStart() {
            process.stdout.write(`Building for production...\n`);
        },
        buildEnd() {
            const line = "---------------------------------------------------------";
            const msg = `❤️❤️❤️ Tell us about your game! - games@phaser.io ❤️❤️❤️`;
            process.stdout.write(`${line}\n${msg}\n${line}\n`);
            
            process.stdout.write(`✨ Done ✨\n`);
        }
    }
}   

export default defineConfig({
    base: './',
    logLevel: 'warning',
    build: {
        // 增加内存限制和优化选项
        sourcemap: true,
        chunkSizeWarningLimit: 300,
        rollupOptions: {
            output: {
                manualChunks: {
                    phaser: ['phaser']
                }
            },
            // 限制最大并行处理数
            maxParallelFileOps: 1
        },
        // 使用 esbuild 替代 terser，速度更快，内存占用更少
        minify: 'esbuild',
        // 如果必须使用 terser，降低压缩级别
        // minify: 'terser',
        // terserOptions: {
        //     compress: {
        //         passes: 1,  // 减少到 1 次
        //         drop_console: true,
        //         drop_debugger: true
        //     },
        //     mangle: true,
        //     format: {
        //         comments: false
        //     }
        // }
    },
    server: {
        port: 8080
    },
    plugins: [
        phasermsg()
    ]
});