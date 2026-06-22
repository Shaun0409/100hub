// netlify/functions/delete-member.js
const fs = require('fs');
const path = require('path');

const MEMBERS_FILE = path.join(__dirname, '..', '..', 'members.json');

function readMembers() {
    try {
        if (fs.existsSync(MEMBERS_FILE)) {
            const data = fs.readFileSync(MEMBERS_FILE, 'utf8');
            return JSON.parse(data);
        }
    } catch (error) {
        console.error('Error reading members file:', error);
    }
    return { members: [], count: 0 };
}

function writeMembers(data) {
    try {
        fs.writeFileSync(MEMBERS_FILE, JSON.stringify(data, null, 2));
        return true;
    } catch (error) {
        console.error('Error writing members file:', error);
        return false;
    }
}

exports.handler = async function(event, context) {
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    try {
        const data = JSON.parse(event.body);
        const membersData = readMembers();

        // Delete all members
        if (data.deleteAll) {
            membersData.members = [];
            membersData.count = 0;
            writeMembers(membersData);
            return {
                statusCode: 200,
                body: JSON.stringify({ success: true, message: 'All members deleted' })
            };
        }

        // Delete single member by ID
        const { id } = data;
        if (!id) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Member ID is required' })
            };
        }

        const initialCount = membersData.members.length;
        membersData.members = membersData.members.filter(m => m.id !== parseInt(id));
        membersData.count = membersData.members.length;

        if (membersData.members.length === initialCount) {
            return {
                statusCode: 404,
                body: JSON.stringify({ error: 'Member not found' })
            };
        }

        writeMembers(membersData);

        return {
            statusCode: 200,
            body: JSON.stringify({ success: true, message: 'Member deleted' })
        };
    } catch (error) {
        console.error('Error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Server error' })
        };
    }
};