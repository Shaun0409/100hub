// netlify/functions/signup.js
// Adds a member via Google Apps Script API

// ✅ REPLACE THIS WITH YOUR ACTUAL DEPLOYMENT ID
const API_BASE = 'https://script.google.com/macros/s/AKfycbyM7LSIRLazzgxXw18r6voB3IyoO6aHBdq_Auq0SOdbWgEvHocrze21CBBSTYptdi4czg/exec';

exports.handler = async function(event, context) {
    // Allow CORS
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
    };

    // Handle preflight OPTIONS request
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 204,
            headers: headers,
            body: ''
        };
    }

    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers: headers,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    try {
        // Parse the request body
        let body;
        try {
            body = JSON.parse(event.body);
        } catch (e) {
            return {
                statusCode: 400,
                headers: headers,
                body: JSON.stringify({ error: 'Invalid JSON body' })
            };
        }

        const { name, email, role, message } = body;

        if (!name || !email || !role) {
            return {
                statusCode: 400,
                headers: headers,
                body: JSON.stringify({ error: 'Name, email, and role are required' })
            };
        }

        // Call Google Apps Script API
        const response = await fetch(`${API_BASE}?action=addMember`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, role, message: message || '' })
        });

        const data = await response.json();

        if (data.error) {
            return {
                statusCode: 400,
                headers: headers,
                body: JSON.stringify({ error: data.error })
            };
        }

        // Get updated count
        const countResponse = await fetch(`${API_BASE}?action=getMembers`);
        const countData = await countResponse.json();
        const count = countData.members ? countData.members.length + 3 : 3;

        return {
            statusCode: 200,
            headers: headers,
            body: JSON.stringify({
                success: true,
                count: count,
                message: 'Successfully joined the community!'
            })
        };
    } catch (error) {
        console.error('Signup error:', error);
        return {
            statusCode: 500,
            headers: headers,
            body: JSON.stringify({ error: 'Failed to save member data: ' + error.message })
        };
    }
};