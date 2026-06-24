// netlify/functions/signup.js
// Uses Sheet.best API to store members in Google Sheets

// Replace with your Sheet.best connection URL
const SHEET_BEST_API = 'https://api.sheetbest.com/sheets/ea89e6d2-3087-4506-ab5b-31e9802bcd62';

// Helper to get member count from Google Sheets
async function getMemberCount() {
    try {
        const response = await fetch(SHEET_BEST_API);
        if (response.ok) {
            const data = await response.json();
            return data.length || 0;
        }
        return 0;
    } catch (error) {
        return 0;
    }
}

exports.handler = async function(event, context) {
    // Only allow POST requests
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    try {
        const { name, email, role, message } = JSON.parse(event.body);

        // Validate required fields
        if (!name || !email || !role) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Name, email, and role are required' })
            };
        }

        // Check if email already exists
        const checkResponse = await fetch(SHEET_BEST_API);
        if (checkResponse.ok) {
            const existingMembers = await checkResponse.json();
            const emailExists = existingMembers.some(m => m.email === email);
            if (emailExists) {
                return {
                    statusCode: 400,
                    body: JSON.stringify({ error: 'This email is already registered.' })
                };
            }
        }

        // Check if at 100 members
        const currentCount = await getMemberCount();
        if (currentCount >= 100) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Community is full! We\'ve reached 100 members.' })
            };
        }

        // Save to Google Sheets via Sheet.best
        const response = await fetch(SHEET_BEST_API, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                timestamp: new Date().toISOString(),
                name: name,
                email: email,
                role: role,
                message: message || ''
            })
        });

        if (!response.ok) {
            throw new Error('Failed to save to Google Sheets');
        }

        const newCount = await getMemberCount();

        return {
            statusCode: 200,
            body: JSON.stringify({
                success: true,
                count: newCount,
                message: 'Successfully joined the community!'
            })
        };

    } catch (error) {
        console.error('Signup error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Failed to save member data: ' + error.message })
        };
    }
};