// netlify/functions/members.js
// Fetches members from Google Sheets via Sheet.best

// ⚠️ REPLACE WITH YOUR SHEET.BEST URL
const SHEET_BEST_API = 'https://api.sheetbest.com/sheets/7fb06936-5f4f-4ca5-bb81-b4e8af870b57/tabs/Members';

const DEFAULT_OWNERS = [
    {
        id: 'owner_1',
        timestamp: '2026-06-24T00:00:00.000Z',
        name: 'Lesley Khocy',
        email: 'khocypixs@gmail.com',
        role: 'Admin (Owner)',
        skills: 'Co-Founder, Visual Director, Editor In Chief',
        status: 'accepted',
        selectedImage: ''
    },
    {
        id: 'owner_2',
        timestamp: '2026-06-24T00:00:00.000Z',
        name: 'Mpilo Nhlapho',
        email: 'mpilo1@gmail.com',
        role: 'Admin (Owner)',
        skills: 'Founder & CBO',
        status: 'accepted',
        selectedImage: ''
    },
    {
        id: 'owner_3',
        timestamp: '2026-06-24T00:00:00.000Z',
        name: 'Shaun Tshabalala',
        email: 'shaun@example.com',
        role: 'Admin (Developer)',
        skills: 'Lead Developer',
        status: 'accepted',
        selectedImage: ''
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
        let sheetMembers = [];
        
        if (response.ok) {
            const data = await response.json();
            if (Array.isArray(data)) {
                sheetMembers = data;
            }
        }

        // Get query parameters
        const params = event.queryStringParameters || {};
        const statusFilter = params.status || 'all';
        const page = parseInt(params.page) || 0;
        const limit = parseInt(params.limit) || 100;

        // Combine owners with sheet members
        let allMembers = [...DEFAULT_OWNERS];
        const existingEmails = new Set(DEFAULT_OWNERS.map(m => m.email.toLowerCase()));

        sheetMembers.forEach(m => {
            if (m.email && !existingEmails.has(m.email.toLowerCase())) {
                allMembers.push({
                    id: m.id || 'member_' + Date.now(),
                    timestamp: m.timestamp || new Date().toISOString(),
                    name: m.name || 'Unknown',
                    email: m.email || '',
                    role: m.role || 'Member',
                    skills: m.skills || '',
                    website: m.website || '',
                    image1: m.image1 || '',
                    image2: m.image2 || '',
                    image3: m.image3 || '',
                    status: m.status || 'pending',
                    selectedImage: m.selectedImage || ''
                });
                existingEmails.add(m.email.toLowerCase());
            }
        });

        // Filter by status if specified
        let filteredMembers = allMembers;
        if (statusFilter !== 'all') {
            filteredMembers = allMembers.filter(m => m.status === statusFilter);
        }

        // Sort by timestamp (newest first)
        filteredMembers.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        // Paginate
        const start = page * limit;
        const end = start + limit;
        const paginatedMembers = filteredMembers.slice(start, end);

        // Count accepted members for "Road to 100"
        const acceptedCount = allMembers.filter(m => m.status === 'accepted').length;

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                members: paginatedMembers,
                count: acceptedCount,
                total: allMembers.length,
                accepted: acceptedCount,
                pending: allMembers.filter(m => m.status === 'pending').length,
                declined: allMembers.filter(m => m.status === 'declined').length
            })
        };
    } catch (error) {
        console.error('Members error:', error);
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                members: DEFAULT_OWNERS,
                count: DEFAULT_OWNERS.length,
                total: DEFAULT_OWNERS.length,
                accepted: DEFAULT_OWNERS.length
            })
        };
    }
};