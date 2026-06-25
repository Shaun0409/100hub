// netlify/functions/media-kit.js
// Manages media kit URL via Sheet.best

// ⚠️ REPLACE WITH YOUR SHEET.BEST URL
const SHEET_BEST_API = 'https://api.sheetbest.com/sheets/7fb06936-5f4f-4ca5-bb81-b4e8af870b57/tabs/MediaKit';

exports.handler = async function(event, context) {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 204, headers, body: '' };
    }

    // GET - fetch media kit URL
    if (event.httpMethod === 'GET') {
        try {
            const response = await fetch(SHEET_BEST_API);
            if (response.ok) {
                const data = await response.json();
                if (Array.isArray(data) && data.length > 0) {
                    const lastItem = data[data.length - 1];
                    if (lastItem.url) {
                        return {
                            statusCode: 200,
                            headers,
                            body: JSON.stringify({ success: true, url: lastItem.url })
                        };
                    }
                }
            }
            return {
                statusCode: 404,
                headers,
                body: JSON.stringify({ error: 'Media Kit not found' })
            };
        } catch (error) {
            console.error('GET media kit error:', error);
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({ error: 'Failed to fetch media kit' })
            };
        }
    }

    // POST - update media kit URL
    if (event.httpMethod === 'POST') {
        try {
            const { url } = JSON.parse(event.body);

            if (!url) {
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({ error: 'URL is required' })
                };
            }

            // Validate URL
            try {
                new URL(url);
            } catch (e) {
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({ error: 'Invalid URL format' })
                };
            }

            const response = await fetch(SHEET_BEST_API, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    timestamp: new Date().toISOString(),
                    name: 'Media Kit',
                    url: url
                })
            });

            if (!response.ok) {
                throw new Error('Failed to save media kit URL');
            }

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    success: true,
                    message: 'Media Kit URL saved successfully!',
                    url: url
                })
            };
        } catch (error) {
            console.error('POST media kit error:', error);
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({ error: 'Failed to save media kit: ' + error.message })
            };
        }
    }

    return {
        statusCode: 405,
        headers,
        body: JSON.stringify({ error: 'Method not allowed' })
    };
};