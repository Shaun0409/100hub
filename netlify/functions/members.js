// netlify/functions/members.js
// Fetches members from Google Sheets via Sheet.best

// Replace with your Sheet.best connection URL
const SHEET_BEST_API = 'https://api.sheetbest.com/sheets/ea89e6d2-3087-4506-ab5b-31e9802bcd62';

exports.handler = async function(event, context) {
    if (event.httpMethod !== 'GET') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    try {
        const response = await fetch(SHEET_BEST_API);
        
        if (!response.ok) {
            throw new Error('Failed to fetch members');
        }

        const members = await response.json();
        
        return {
            statusCode: 200,
            body: JSON.stringify({
                members: members || [],
                count: members ? members.length : 0
            })
        };

    } catch (error) {
        console.error('Members error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ 
                members: [], 
                count: 0,
                error: 'Failed to fetch members'
            })
        };
    }
};