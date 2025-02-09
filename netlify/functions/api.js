const express = require('express');
const serverless = require('serverless-http');
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');

const app = express();
const router = express.Router();
app.use(cors());

// Change the route to root path
router.get('/scrape', async (req, res) => {
    try {
        const { url } = req.query;
        if (!url) return res.status(400).json({ error: 'URL is required' });

        const response = await axios.get(url);
        const html = response.data;
        const $ = cheerio.load(html);

        const baseUrl = new URL(url).origin;
            const formatLink = (link) => {
                if (!link) return null;
            
                // Handle protocol-relative URLs (starting with //)
                if (link.startsWith('//')) {
                    return `https:${link}`;
                }
            
                // Handle absolute URLs
                if (link.startsWith('http')) {
                    return link;
                }
            
                // Handle relative URLs
                return `${baseUrl}/${link.replace(/^\/+/, '')}`;
            };

        const cssLinks = [];
        const jsLinks = [];
        const assetLinks = [];

        $('link[rel="stylesheet"]').each((_, el) => {
            const href = $(el).attr('href');
            const formatted = formatLink(href);
            if (formatted) cssLinks.push(formatted);
        });

        $('script[src]').each((_, el) => {
            const src = $(el).attr('src');
            const formatted = formatLink(src);
            if (formatted) jsLinks.push(formatted);
        });

        $('img, source, video').each((_, el) => {
            const src = $(el).attr('src');
            const formatted = formatLink(src);
            if (formatted) assetLinks.push(formatted);
        });

        res.json({ html, css: cssLinks, js: jsLinks, assets: assetLinks });
    } catch (error) {
        res.status(500).json({ error: 'Failed to scrape the website' });
    }
});

app.use('/.netlify/functions/api', router);

module.exports.handler = serverless(app);
