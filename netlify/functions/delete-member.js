// netlify/functions/delete-member.js
// Deletes a member from Google Sheets via Sheet.best

// ⚠️ REPLACE THIS WITH YOUR ACTUAL SHEET.BEST URL
const SHEET_BEST_API = 'https://api.sheetbest.com/sheets/7fb06936-5f4f-4ca5-bb81-b4e8af870b57/tabs/Members';

exports.handler = async function(event, context) {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 204, headers, body: '' };
    }

    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    try {
        const { id } = JSON.parse(event.body);

        if (id && id.startsWith('owner_')) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Cannot delete default owners' })
            };
        }

        // Get all members from Sheet.best
        const getResponse = await fetch(SHEET_BEST_API);
        if (!getResponse.ok) {
            throw new Error('Failed to fetch members');
        }

        const members = await getResponse.json();
        if (!Array.isArray(members)) {
            return {
                statusCode: 404,
                headers,
                body: JSON.stringify({ error: 'No members found' })
            };
        }

        // Find member by ID
        const memberToDelete = members.find(m => m.id === id || m.id === parseInt(id));
        if (!memberToDelete) {
            return {
                statusCode: 404,
                headers,
                body: JSON.stringify({ error: 'Member not found' })
            };
        }

        // Check if it's a default owner by email
        const ownerEmails = ['khocypixs@gmail.com', 'mpilo1@gmail.com', 'shaun@example.com'];
        if (ownerEmails.includes(memberToDelete.email)) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Cannot delete default owners' })
            };
        }

        // Delete from Sheet.best
        const deleteResponse = await fetch(`${SHEET_BEST_API}/${memberToDelete.id}`, {
            method: 'DELETE'
        });

        if (!deleteResponse.ok) {
            throw new Error('Failed to delete member');
        }

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ success: true, message: 'Member deleted' })
        };
    } catch (error) {
        console.error('Delete error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Failed to delete member: ' + error.message })
        };
    }
};