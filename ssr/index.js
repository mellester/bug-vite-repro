/* eslint-env node */
const express = require('express');
const {createPageRender} = require('vite-plugin-ssr');
const {createProxyMiddleware} = require('http-proxy-middleware');
const vite = require('vite');
const isProduction = process.env.NODE_ENV === 'production';
const root = `${__dirname}/..`;

startServer();

// eslint-disable-next-line max-lines-per-function
async function startServer() {
    const app = express();
    /** @type {vite.ViteDevServer} */
    let viteDevServer;
    if (isProduction) {
        app.use(express.static(`${root}/dist/client`, {index: false}));
    } else {
        viteDevServer = await vite.createServer({
            root,
            server: {middlewareMode: true},
        });
        app.use(viteDevServer.middlewares);
    }
    const renderPage = createPageRender({viteDevServer, isProduction, root});
    // @ts-ignore

    /**
     *  Reads the env file
     */
    const fs = require('fs');
    const dotenv = require('dotenv');
    const envConfig = dotenv.parse(fs.readFileSync('.env'));

    /**
     * Redirects api request to the correct url
     * This should help if mistakes are made during dev
     */
    app.all('/api/*', (req, res) => {
        const url = new URL(req.url, envConfig.VITE_CLIENT_API_URL);
        url.hostname = new URL(envConfig.VITE_CLIENT_API_URL).hostname;
        res.redirect(url.href);
    });

    /** If cors errors are a thing this creates a proxy
     *
     */
    const proxyUrl = new URL(envConfig.VITE_SSR_API_URL);
    proxyUrl.pathname = '/api';
    app.use(
        '/proxy/*',
        createProxyMiddleware({target: proxyUrl, changeOrigin: true, pathRewrite: {'^/proxy': '/api'}}),
    );

    // @ts-ignore

    app.get('*', async (req, res, next) => {
        const url = req.originalUrl;
        /** @type {Record<string, unknown>} */
        const contextProps = {};
        const result = await renderPage({url, contextProps});
        if (result.nothingRendered) return next();
        res.status(result.statusCode).send(result.renderResult);
    });

    const port = envConfig.SRR_PORT ?? 3000;
    app.listen(port);
    // eslint-disable-next-line
    console.log(`Server running at http://localhost:${port}`);
}
