// netlify/functions/delete-member.js
// Deletes a member from Google Sheets via Sheet.best

// Replace with your Sheet.best connection URL
const SHEET_BEST_API = 'https://api.sheetbest.com/sheets/ea89e6d2-3087-4506-ab5b-31e9802bcd62';

exports.handler = async function(event, context) {
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    try {
        const data = JSON.parse(event.body);
        const { id, deleteAll } = data;

        // Get all members
        const response = await fetch(SHEET_BEST_API);
        if (!response.ok) {
            throw new Error('Failed to fetch members');
        }

        let members = await response.json();

        if (deleteAll) {
            // Delete all members - we need to delete each row individually
            for (const member of members) {
                await fetch(`${SHEET_BEST_API}/${member.id}`, {
                    method: 'DELETE'
                });
            }
            return {
                statusCode: 200,
                body: JSON.stringify({ success: true, message: 'All members deleted' })
            };
        }

        // Delete single member by ID
        if (!id) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Member ID is required' })
            };
        }

        const deleteResponse = await fetch(`${SHEET_BEST_API}/${id}`, {
            method: 'DELETE'
        });

        if (!deleteResponse.ok) {
            throw new Error('Failed to delete member');
        }

        return {
            statusCode: 200,
            body: JSON.stringify({ success: true, message: 'Member deleted' })
        };

    } catch (error) {
        console.error('Delete error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Failed to delete member' })
        };
    }
};