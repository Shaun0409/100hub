// netlify/functions/members.js
// Fetches members from Google Sheets via Sheet.best

const SHEET_BEST_API = 'https://api.sheetbest.com/sheets/7fb06936-5f4f-4ca5-bb81-b4e8af870b57/tabs/Members';

function emailToId(email) {
    return 'member_' + email.toLowerCase().replace(/[^a-z0-9]/g, '');
}

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
        let sheetMembers = [];

        if (response.ok) {
            const data = await response.json();
            if (Array.isArray(data)) {
                sheetMembers = data;
            }
        }

        const params = event.queryStringParameters || {};
        const statusFilter = params.status || 'all';
        const page = parseInt(params.page) || 0;
        const limit = parseInt(params.limit) || 100;

        // Use Set for O(1) lookups
        const seenEmails = new Set();
        let allMembers = [];

        // Optimized loop
        for (let i = 0; i < sheetMembers.length; i++) {
            const m = sheetMembers[i];
            if (!m.email) continue;
            const emailKey = m.email.toLowerCase();
            if (seenEmails.has(emailKey)) continue;
            seenEmails.add(emailKey);

            allMembers.push({
                id: m.id || emailToId(m.email),
                email: m.email,
                timestamp: m.timestamp || new Date().toISOString(),
                name: m.name || 'Unknown',
                role: m.role || 'Member',
                skills: m.skills || '',
                website: m.website || '',
                image1: m.image1 || '',
                image2: m.image2 || '',
                image3: m.image3 || '',
                status: m.status || 'pending',
                selectedImage: m.selectedImage || '',
                socialPlatform: m.socialPlatform || '',
                socialHandle: m.socialHandle || ''
            });
        }

        // Filter by status (optimized)
        let filteredMembers = allMembers;
        if (statusFilter !== 'all') {
            filteredMembers = [];
            for (let i = 0; i < allMembers.length; i++) {
                if (allMembers[i].status === statusFilter) {
                    filteredMembers.push(allMembers[i]);
                }
            }
        }

        // Sort by timestamp (newest first)
        filteredMembers.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        // Paginate
        const start = page * limit;
        const paginatedMembers = filteredMembers.slice(start, start + limit);

        // Count accepted members
        let acceptedCount = 0;
        let pendingCount = 0;
        let declinedCount = 0;
        for (let i = 0; i < allMembers.length; i++) {
            if (allMembers[i].status === 'accepted') acceptedCount++;
            else if (allMembers[i].status === 'pending') pendingCount++;
            else if (allMembers[i].status === 'declined') declinedCount++;
        }

        const result = {
            members: paginatedMembers,
            count: acceptedCount,
            total: allMembers.length,
            accepted: acceptedCount,
            pending: pendingCount,
            declined: declinedCount
        };

        return {
            statusCode: 200,
            headers: { ...headers, 'Cache-Control': 'no-store' },
            body: JSON.stringify(result)
        };
    } catch (error) {
        console.error('Members error:', error);
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                members: [],
                count: 0,
                total: 0,
                accepted: 0,
                pending: 0,
                declined: 0
            })
        };
    }
};