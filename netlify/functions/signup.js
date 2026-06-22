// netlify/functions/signup.js
const fs = require('fs');
const path = require('path');

// Path to the members.json file (in the root of your site)
const MEMBERS_FILE = path.join(__dirname, '..', '..', 'members.json');

// Read members from file
function readMembers() {
    try {
        if (fs.existsSync(MEMBERS_FILE)) {
            const data = fs.readFileSync(MEMBERS_FILE, 'utf8');
            return JSON.parse(data);
        }
    } catch (error) {
        console.error('Error reading members file:', error);
    }
    return { members: [], count: 3 };
}

// Write members to file
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
    // Only allow POST requests
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    try {
        // Parse the request body
        const data = JSON.parse(event.body);
        const { name, email, role, message } = data;

        // Validate
        if (!name || !email || !role) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Name, email, and role are required' })
            };
        }

        // Read current members
        const membersData = readMembers();

        // Check if at 100 members
        if (membersData.count >= 100) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Community is full! We\'ve reached 100 members.' })
            };
        }

        // Check if email already exists
        const existingMember = membersData.members.find(m => m.email === email);
        if (existingMember) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'This email is already registered.' })
            };
        }

        // Add new member
        const newMember = {
            id: Date.now(),
            timestamp: new Date().toISOString(),
            name: name,
            email: email,
            role: role,
            message: message || ''
        };

        membersData.members.push(newMember);
        membersData.count += 1;

        // Save to file
        const saved = writeMembers(membersData);

        if (!saved) {
            return {
                statusCode: 500,
                body: JSON.stringify({ error: 'Failed to save member data' })
            };
        }

        // Return success with updated count
        return {
            statusCode: 200,
            body: JSON.stringify({
                success: true,
                count: membersData.count,
                message: 'Successfully joined the community!'
            })
        };
    } catch (error) {
        console.error('Error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Server error' })
        };
    }
};