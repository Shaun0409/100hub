// netlify/functions/upload-media-kit.js
// Manages media kit via Google Apps Script API

// ✅ REPLACE THIS WITH YOUR ACTUAL DEPLOYMENT ID
const API_BASE = 'https://script.google.com/macros/s/AKfycbyM7LSIRLazzgxXw18r6voB3IyoO6aHBdq_Auq0SOdbWgEvHocrze21CBBSTYptdi4czg/exec';

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
            const response = await fetch(`${API_BASE}?action=getMediaKit`);
            const data = await response.json();

            if (data.url) {
                return {
                    statusCode: 200,
                    headers,
                    body: JSON.stringify({ success: true, url: data.url })
                };
            } else {
                return {
                    statusCode: 404,
                    headers,
                    body: JSON.stringify({ error: 'Media Kit not found' })
                };
            }
        } catch (error) {
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
            const data = JSON.parse(event.body);
            const { url } = data;

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

            const response = await fetch(`${API_BASE}?action=updateMediaKit`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url })
            });

            const result = await response.json();

            if (result.error) {
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({ error: result.error })
                };
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
            console.error('Media kit error:', error);
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