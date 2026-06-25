// netlify/functions/signup.js
// Saves member data to Google Sheets via Sheet.best

const SHEET_BEST_API = 'https://api.sheetbest.com/sheets/7fb06936-5f4f-4ca5-bb81-b4e8af870b57/tabs/Members';

// Generate a stable ID from email so it never changes between reads
function emailToId(email) {
    // e.g. "jane.doe@gmail.com" → "member_janedoegmailcom"
    return 'member_' + email.toLowerCase().replace(/[^a-z0-9]/g, '');
}

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
        const { name, email, role, skills, website, image1, image2, image3, status, socialPlatform, socialHandle } = JSON.parse(event.body);

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
                const emailExists = existingMembers.some(
                    m => m.email && m.email.toLowerCase() === email.toLowerCase()
                );
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
        // ✅ Now includes a stable `id` column derived from email
        const response = await fetch(SHEET_BEST_API, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id: emailToId(email),
                timestamp: new Date().toISOString(),
                name: name,
                email: email,
                role: role,
                skills: skills || '',
                website: website || '',
                socialPlatform: socialPlatform || '',
                socialHandle: socialHandle || '',
                image1: image1 || '',
                image2: image2 || '',
                image3: image3 || '',
                status: status || 'pending',
                selectedImage: ''
            })
        });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error('Failed to save to Google Sheets: ' + errText);
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
