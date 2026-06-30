// netlify/functions/articles.js
// Manages articles via Sheet.best (same spreadsheet, Articles tab)

const SHEET_BEST_API = 'https://api.sheetbest.com/sheets/7fb06936-5f4f-4ca5-bb81-b4e8af870b57/tabs/Articles';

exports.handler = async function(event, context) {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 204, headers, body: '' };
    }

    // GET - fetch all articles
    if (event.httpMethod === 'GET') {
        try {
            const response = await fetch(SHEET_BEST_API);
            if (response.ok) {
                const data = await response.json();
                return {
                    statusCode: 200,
                    headers,
                    body: JSON.stringify({ articles: Array.isArray(data) ? data : [] })
                };
            }
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ articles: [] })
            };
        } catch (error) {
            console.error('GET articles error:', error);
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ articles: [] })
            };
        }
    }

    // POST - add a new article
    if (event.httpMethod === 'POST') {
        try {
            const body = JSON.parse(event.body);
            const { postId, articleUrl } = body;

            if (!postId || !articleUrl) {
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({ error: 'postId and articleUrl are required' })
                };
            }

            const response = await fetch(SHEET_BEST_API, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    postId: postId,
                    articleUrl: articleUrl
                })
            });

            if (!response.ok) {
                throw new Error('Failed to add article');
            }

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ success: true, message: 'Article added!' })
            };
        } catch (error) {
            console.error('POST article error:', error);
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({ error: 'Failed to add article' })
            };
        }
    }

    // DELETE - remove an article
    if (event.httpMethod === 'DELETE') {
        try {
            const body = JSON.parse(event.body);
            const { id } = body;

            if (!id) {
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({ error: 'ID is required' })
                };
            }

            const deleteResponse = await fetch(`${SHEET_BEST_API}/${id}`, {
                method: 'DELETE'
            });

            if (!deleteResponse.ok) {
                throw new Error('Failed to delete article');
            }

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ success: true, message: 'Article deleted!' })
            };
        } catch (error) {
            console.error('DELETE article error:', error);
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({ error: 'Failed to delete article' })
            };
        }
    }

    return {
        statusCode: 405,
        headers,
        body: JSON.stringify({ error: 'Method not allowed' })
    };
};