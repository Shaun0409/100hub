// netlify/functions/signup.js
// Saves member data to Google Sheets via Sheet.best

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
        const { name, email, role, skills, website, image1, image2, image3, status } = JSON.parse(event.body);

        if (!name || !email || !role) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Name, email, and role are required' })
            };
        }

        // Check if email already exists
        const checkResponse = await fetch(SHEET_BEST_API);
        if (checkResponse.ok) {
            const existingMembers = await checkResponse.json();
            if (Array.isArray(existingMembers)) {
                const emailExists = existingMembers.some(m => m.email === email);
                if (emailExists) {
                    return {
                        statusCode: 400,
                        headers,
                        body: JSON.stringify({ error: 'This email is already registered.' })
                    };
                }
            }
        }

        // Save to Google Sheets via Sheet.best
        const response = await fetch(SHEET_BEST_API, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                timestamp: new Date().toISOString(),
                name: name,
                email: email,
                role: role,
                skills: skills || '',
                website: website || '',
                image1: image1 || '',
                image2: image2 || '',
                image3: image3 || '',
                status: status || 'pending',
                selectedImage: ''
            })
        });

        if (!response.ok) {
            throw new Error('Failed to save to Google Sheets');
        }

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                message: 'Successfully joined the community!'
            })
        };
    } catch (error) {
        console.error('Signup error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Failed to save member data: ' + error.message })
        };
    }
};