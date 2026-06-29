// netlify/functions/update-member.js
// Updates a member's status, selected image, or details via Sheet.best

const SHEET_BEST_API = 'https://api.sheetbest.com/sheets/7fb06936-5f4f-4ca5-bb81-b4e8af870b57/tabs/Members';


// ⚠️ REPLACE WITH YOUR FORMSPREE ENDPOINT
const FORMSPREE_ACCEPTED = 'https://formspree.io/f/xbdvozeb';
const FORMSPREE_DECLINED = 'https://formspree.io/f/xbdvozeb';

exports.handler = async function(event, context) {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, PUT, OPTIONS'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 204, headers, body: '' };
    }

    if (event.httpMethod !== 'POST' && event.httpMethod !== 'PUT') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    try {
        const body = JSON.parse(event.body);
        const { email, status, selectedImage, name, role, skills } = body;

        if (!email) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Member email is required' })
            };
        }

        // Build the update payload
        const updates = {};
        if (status !== undefined)        updates.status = status;
        if (selectedImage !== undefined) updates.selectedImage = selectedImage;
        if (name !== undefined)          updates.name = name;
        if (role !== undefined)          updates.role = role;
        if (skills !== undefined)        updates.skills = skills;

        if (Object.keys(updates).length === 0) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'No fields to update' })
            };
        }

        // First, get the current member data to get the name if not provided
        let memberName = name || '';
        if (!memberName) {
            const getResponse = await fetch(`${SHEET_BEST_API}/email/${encodeURIComponent(email.toLowerCase().trim())}`);
            if (getResponse.ok) {
                const data = await getResponse.json();
                if (Array.isArray(data) && data.length > 0) {
                    memberName = data[0].name || 'Member';
                }
            }
        }

        // Update the member
        const encodedEmail = encodeURIComponent(email.toLowerCase().trim());
        const url = `${SHEET_BEST_API}/email/${encodedEmail}`;

        const updateResponse = await fetch(url, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates)
        });

        const responseText = await updateResponse.text();

        if (!updateResponse.ok) {
            throw new Error(`Sheet.best responded with ${updateResponse.status}: ${responseText}`);
        }

        let result;
        try { result = JSON.parse(responseText); } catch { result = responseText; }

        if (Array.isArray(result) && result.length === 0) {
            return {
                statusCode: 404,
                headers,
                body: JSON.stringify({ error: 'Member not found in sheet' })
            };
        }

        // Send email notification if status changed
        if (status && (status === 'accepted' || status === 'declined')) {
            await sendStatusEmail(email, memberName, status);
        }

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                message: 'Member updated successfully',
                updated: result
            })
        };
    } catch (error) {
        console.error('Update error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                success: false,
                error: 'Failed to update member: ' + error.message
            })
        };
    }
};

// Function to send email via Formspree
async function sendStatusEmail(email, name, status) {
    try {
        const endpoint = status === 'accepted' ? FORMSPREE_ACCEPTED : FORMSPREE_DECLINED;
        
        let subject, message, htmlContent;

        if (status === 'accepted') {
            subject = '🎉 Welcome to the 100 HUB Community!';
            htmlContent = `
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1A1A1A; }
                        .header { text-align: center; padding: 20px 0; border-bottom: 2px solid #E31E24; }
                        .logo { font-size: 32px; font-weight: 700; }
                        .logo span { color: #E31E24; }
                        .content { padding: 30px 0; }
                        .button { display: inline-block; background: #E31E24; color: white; padding: 12px 30px; border-radius: 60px; text-decoration: none; margin-top: 20px; }
                        .footer { text-align: center; padding-top: 20px; border-top: 1px solid #E8E8E8; color: #666; font-size: 12px; }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <div class="logo">100 <span>HUB</span></div>
                    </div>
                    <div class="content">
                        <h1>Welcome to the 100 Family, ${name}! 🎉</h1>
                        <p>We're thrilled to have you as part of our creative community. Your application has been accepted, and you are now officially a member of the 100 HUB.</p>
                        <p>You're now part of a network of writers, creatives, and culture-shapers who are building something real. Here's what you can expect:</p>
                        <ul>
                            <li>Creative opportunities and collaborations</li>
                            <li>Editorial features in 100 Magazine</li>
                            <li>Exclusive events and networking</li>
                            <li>Industry conversations and insights</li>
                            <li>Brand collaborations and partnerships</li>
                        </ul>
                        <p>We can't wait to see the incredible work you'll create. Stay connected and follow us on social media for updates!</p>
                        <p>Best regards,<br>The 100 HUB Team</p>
                    </div>
                    <div class="footer">
                        <p>&copy; 2026 100 HUB. All rights reserved.</p>
                    </div>
                </body>
                </html>
            `;
        } else {
            subject = 'Update on your 100 HUB Application';
            htmlContent = `
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1A1A1A; }
                        .header { text-align: center; padding: 20px 0; border-bottom: 2px solid #E31E24; }
                        .logo { font-size: 32px; font-weight: 700; }
                        .logo span { color: #E31E24; }
                        .content { padding: 30px 0; }
                        .footer { text-align: center; padding-top: 20px; border-top: 1px solid #E8E8E8; color: #666; font-size: 12px; }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <div class="logo">100 <span>HUB</span></div>
                    </div>
                    <div class="content">
                        <h1>Hello ${name}</h1>
                        <p>Thank you for your interest in joining the 100 HUB community.</p>
                        <p>After careful review of your application, we regret to inform you that we are unable to accept you as a member at this time.</p>
                        <p>A member of our team will be in touch soon to provide more details about why your application was declined and to discuss potential future opportunities.</p>
                        <p>We appreciate your interest in 100 HUB and encourage you to stay connected with us through our social media channels.</p>
                        <p>Best regards,<br>The 100 HUB Team</p>
                    </div>
                    <div class="footer">
                        <p>&copy; 2026 100 HUB. All rights reserved.</p>
                    </div>
                </body>
                </html>
            `;
        }

        // Send to the member's email address
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                email: email, // This sends to the member's email
                name: name,
                subject: subject,
                message: htmlContent,
                _subject: subject,
                _replyto: email // This sets the reply-to as the member's email
            })
        });

        if (!response.ok) {
            console.error('Failed to send email:', await response.text());
        } else {
            console.log(`✅ Email sent to ${email} (${status})`);
        }
    } catch (error) {
        console.error('Email sending error:', error);
    }
}






// exports.handler = async function(event, context) {
//     const headers = {
//         'Access-Control-Allow-Origin': '*',
//         'Access-Control-Allow-Headers': 'Content-Type',
//         'Access-Control-Allow-Methods': 'POST, PUT, OPTIONS'
//     };

//     if (event.httpMethod === 'OPTIONS') {
//         return { statusCode: 204, headers, body: '' };
//     }

//     if (event.httpMethod !== 'POST' && event.httpMethod !== 'PUT') {
//         return {
//             statusCode: 405,
//             headers,
//             body: JSON.stringify({ error: 'Method not allowed' })
//         };
//     }

//     try {
//         const body = JSON.parse(event.body);
//         const { email, status, selectedImage, name, role, skills } = body;

//         // ✅ We identify members by email — it's always present and unique
//         if (!email) {
//             return {
//                 statusCode: 400,
//                 headers,
//                 body: JSON.stringify({ error: 'Member email is required' })
//             };
//         }

//         // Build the update payload — only include fields that were sent
//         const updates = {};
//         if (status !== undefined)        updates.status = status;
//         if (selectedImage !== undefined) updates.selectedImage = selectedImage;
//         if (name !== undefined)          updates.name = name;
//         if (role !== undefined)          updates.role = role;
//         if (skills !== undefined)        updates.skills = skills;

//         if (Object.keys(updates).length === 0) {
//             return {
//                 statusCode: 400,
//                 headers,
//                 body: JSON.stringify({ error: 'No fields to update' })
//             };
//         }

//         // ✅ Sheet.best filtered PATCH: /columnName/value
//         // Finds all rows where email == the given email and patches only the sent fields
//         const encodedEmail = encodeURIComponent(email.toLowerCase().trim());
//         const url = `${SHEET_BEST_API}/email/${encodedEmail}`;

//         console.log('PATCH URL:', url);
//         console.log('Updates:', updates);

//         const updateResponse = await fetch(url, {
//             method: 'PATCH',
//             headers: { 'Content-Type': 'application/json' },
//             body: JSON.stringify(updates)
//         });

//         const responseText = await updateResponse.text();
//         console.log(`Sheet.best response ${updateResponse.status}:`, responseText);

//         if (!updateResponse.ok) {
//             throw new Error(`Sheet.best responded with ${updateResponse.status}: ${responseText}`);
//         }

//         let result;
//         try { result = JSON.parse(responseText); } catch { result = responseText; }

//         // Sheet.best returns [] when no row matched the filter
//         if (Array.isArray(result) && result.length === 0) {
//             return {
//                 statusCode: 404,
//                 headers,
//                 body: JSON.stringify({ error: 'Member not found in sheet' })
//             };
//         }

//         return {
//             statusCode: 200,
//             headers,
//             body: JSON.stringify({
//                 success: true,
//                 message: 'Member updated successfully',
//                 updated: result
//             })
//         };
//     } catch (error) {
//         console.error('Update error:', error);
//         return {
//             statusCode: 500,
//             headers,
//             body: JSON.stringify({
//                 success: false,
//                 error: 'Failed to update member: ' + error.message
//             })
//         };
//     }
// };
