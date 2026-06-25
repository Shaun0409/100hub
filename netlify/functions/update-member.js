// netlify/functions/update-member.js
// Updates a member's status or selected image

// ⚠️ REPLACE WITH YOUR SHEET.BEST URL
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
        const { id, status, selectedImage, name, role, skills } = JSON.parse(event.body);

        if (!id) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Member ID is required' })
            };
        }

        // Get the member from Sheet.best
        const getResponse = await fetch(SHEET_BEST_API);
        if (!getResponse.ok) {
            throw new Error('Failed to fetch members');
        }

        const members = await getResponse.json();
        const memberToUpdate = members.find(m => m.id === id || m.id === parseInt(id));

        if (!memberToUpdate) {
            return {
                statusCode: 404,
                headers,
                body: JSON.stringify({ error: 'Member not found' })
            };
        }

        // Update fields
        if (status) memberToUpdate.status = status;
        if (selectedImage) memberToUpdate.selectedImage = selectedImage;
        if (name) memberToUpdate.name = name;
        if (role) memberToUpdate.role = role;
        if (skills) memberToUpdate.skills = skills;

        // Update in Sheet.best
        const updateResponse = await fetch(`${SHEET_BEST_API}/${memberToUpdate.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(memberToUpdate)
        });

        if (!updateResponse.ok) {
            throw new Error('Failed to update member');
        }

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                message: 'Member updated successfully',
                member: memberToUpdate
            })
        };
    } catch (error) {
        console.error('Update error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Failed to update member: ' + error.message })
        };
    }
};