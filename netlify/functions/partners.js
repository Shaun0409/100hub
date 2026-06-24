// netlify/functions/partners.js
// Manages partners via Google Apps Script API

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

    // GET - fetch all partners
    if (event.httpMethod === 'GET') {
        try {
            const response = await fetch(`${API_BASE}?action=getPartners`);
            const data = await response.json();

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify(data)
            };
        } catch (error) {
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ logos: [] })
            };
        }
    }

    // POST - add a new partner
    if (event.httpMethod === 'POST') {
        try {
            const data = JSON.parse(event.body);
            const { url, name } = data;

            if (!url || !name) {
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({ error: 'URL and name are required' })
                };
            }

            const response = await fetch(`${API_BASE}?action=addPartner`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, url })
            });

            const result = await response.json();

            if (result.error) {
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({ error: result.error })
                };
            }

            // Get updated list
            const getResponse = await fetch(`${API_BASE}?action=getPartners`);
            const getData = await getResponse.json();

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    success: true,
                    logos: getData.logos || []
                })
            };
        } catch (error) {
            console.error('Add partner error:', error);
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({ error: 'Failed to add partner: ' + error.message })
            };
        }
    }

    // DELETE - remove a partner
    if (event.httpMethod === 'DELETE') {
        try {
            const data = JSON.parse(event.body);
            const { id } = data;

            if (!id) {
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({ error: 'ID is required' })
                };
            }

            // Get partners to find the name
            const getResponse = await fetch(`${API_BASE}?action=getPartners`);
            const getData = await getResponse.json();

            const partner = (getData.logos || []).find(p => p.id === id);
            if (!partner) {
                return {
                    statusCode: 404,
                    headers,
                    body: JSON.stringify({ error: 'Partner not found' })
                };
            }

            const response = await fetch(`${API_BASE}?action=deletePartner`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: partner.name })
            });

            const result = await response.json();

            if (result.error) {
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({ error: result.error })
                };
            }

            // Get updated list
            const refreshResponse = await fetch(`${API_BASE}?action=getPartners`);
            const refreshData = await refreshResponse.json();

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    success: true,
                    logos: refreshData.logos || []
                })
            };
        } catch (error) {
            console.error('Delete partner error:', error);
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({ error: 'Failed to delete partner: ' + error.message })
            };
        }
    }

    return {
        statusCode: 405,
        headers,
        body: JSON.stringify({ error: 'Method not allowed' })
    };
};