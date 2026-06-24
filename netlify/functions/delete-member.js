// netlify/functions/delete-member.js
// Deletes a member via Google Apps Script API

// ✅ REPLACE THIS WITH YOUR ACTUAL DEPLOYMENT ID
const API_BASE = 'https://script.google.com/macros/s/AKfycbyM7LSIRLazzgxXw18r6voB3IyoO6aHBdq_Auq0SOdbWgEvHocrze21CBBSTYptdi4czg/exec';

exports.handler = async function(event, context) {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS'
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

        // Check if it's a default owner (can't delete owners)
        if (id && id.startsWith('owner_')) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Cannot delete default owners' })
            };
        }

        // Get all members to find the email
        const getResponse = await fetch(`${API_BASE}?action=getMembers`);
        const data = await getResponse.json();

        if (!data.members || !Array.isArray(data.members)) {
            return {
                statusCode: 404,
                headers,
                body: JSON.stringify({ error: 'No members found' })
            };
        }

        // Find member by ID
        const member = data.members.find(m => m.id === id || m.id === parseInt(id));
        if (!member) {
            return {
                statusCode: 404,
                headers,
                body: JSON.stringify({ error: 'Member not found' })
            };
        }

        // Check if it's a default owner by email
        const ownerEmails = ['khocypixs@gmail.com', 'mpilo1@gmail.com', 'shaun@example.com'];
        if (ownerEmails.includes(member.email)) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Cannot delete default owners' })
            };
        }

        // Delete the member
        const response = await fetch(`${API_BASE}?action=deleteMember`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: member.email })
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