const express = require('express');
const serverless = require('serverless-http');
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');

const app = express();
app.use(cors());

app.get('/scrape', async (req, res) => {
    try {
        const { url } = req.query;
        if (!url) return res.status(400).json({ error: 'URL is required' });

        const response = await axios.get(url);
        const html = response.data;
        const $ = cheerio.load(html);

        const baseUrl = new URL(url).origin; // Extract base domain

        const formatLink = (link) => {
            if (!link) return null;
            return link.startsWith('http') ? link : `${baseUrl}/${link.replace(/^\/+/, '')}`;
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

module.exports.handler = serverless(app);
