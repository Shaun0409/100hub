// netlify/functions/members.js
// Fetches members from Google Sheets via Sheet.best

// ⚠️ REPLACE THIS WITH YOUR ACTUAL SHEET.BEST URL
const SHEET_BEST_API = 'https://api.sheetbest.com/sheets/7fb06936-5f4f-4ca5-bb81-b4e8af870b57/tabs/Members';

// Default owners (first 3 members)
const DEFAULT_OWNERS = [
    {
        id: 'owner_1',
        timestamp: '2026-06-24T00:00:00.000Z',
        name: 'Lesley Khocy',
        email: 'khocypixs@gmail.com',
        role: 'Admin (Owner)',
        message: 'Co-Founder, Visual Director, Editor In Chief'
    },
    {
        id: 'owner_2',
        timestamp: '2026-06-24T00:00:00.000Z',
        name: 'Mpilo Nhlapho',
        email: 'mpilo1@gmail.com',
        role: 'Admin (Owner)',
        message: 'Founder & CBO'
    },
    {
        id: 'owner_3',
        timestamp: '2026-06-24T00:00:00.000Z',
        name: 'Shaun Tshabalala',
        email: 'shaun@example.com',
        role: 'Admin (Developer)',
        message: 'Lead Developer'
    }
];

exports.handler = async function(event, context) {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, OPTIONS'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 204, headers, body: '' };
    }

    if (event.httpMethod !== 'GET') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    try {
        const response = await fetch(SHEET_BEST_API);
        let members = [];
        
        if (response.ok) {
            const data = await response.json();
            if (Array.isArray(data)) {
                members = data;
            }
        }

        // Combine owners with sheet members
        const allMembers = [...DEFAULT_OWNERS];
        const existingEmails = new Set(DEFAULT_OWNERS.map(m => m.email.toLowerCase()));

        members.forEach(m => {
            if (m.email && !existingEmails.has(m.email.toLowerCase())) {
                allMembers.push({
                    id: m.id || 'member_' + Date.now(),
                    timestamp: m.timestamp || new Date().toISOString(),
                    name: m.name || 'Unknown',
                    email: m.email || '',
                    role: m.role || 'Member',
                    message: m.message || ''
                });
                existingEmails.add(m.email.toLowerCase());
            }
        });

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                members: allMembers,
                count: allMembers.length
            })
        };
    } catch (error) {
        console.error('Members error:', error);
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                members: DEFAULT_OWNERS,
                count: DEFAULT_OWNERS.length
            })
        };
    }
};