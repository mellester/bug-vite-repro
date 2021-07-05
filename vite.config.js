import vue from '@vitejs/plugin-vue';
import {defineConfig} from 'vite';
import ssr from 'vite-plugin-ssr/plugin';




export default defineConfig({
    plugins: [vue(), ssr()],
    resolve: {
        
    },
});
