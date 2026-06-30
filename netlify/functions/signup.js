// netlify/functions/signup.js
// Saves member data to Google Sheets via Sheet.best
// Sends confirmation email to applicant via Resend

const SHEET_BEST_API = 'https://api.sheetbest.com/sheets/7fb06936-5f4f-4ca5-bb81-b4e8af870b57/tabs/Members';

// Resend email configuration - using verified domain
const EMAIL_FROM = 'noreply@100hub.co.za';
const REPLY_TO_EMAIL = '100projectsmedia@gmail.com';

// Generate a stable ID from email so it never changes between reads
function emailToId(email) {
    return 'member_' + email.toLowerCase().replace(/[^a-z0-9]/g, '');
}

// Function to send confirmation email via Resend
async function sendConfirmationEmail(email, name) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
        console.warn('RESEND_API_KEY not set — skipping email');
        return;
    }

    try {
        const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                from: `100 HUB <${EMAIL_FROM}>`,
                to: [email],
                reply_to: REPLY_TO_EMAIL,
                subject: '✅ Application Received - 100 HUB',
                html: `
                    <div style="font-family:'Helvetica Neue',Arial,sans-serif;max-width:560px;margin:0 auto;padding:40px 24px;color:#1A1A1A;">
                        <h1 style="font-size:26px;font-weight:700;margin-bottom:8px;">Hi ${name},</h1>
                        <p style="font-size:16px;color:#4A4A4A;line-height:1.7;margin-bottom:24px;">
                            Thank you for applying to join the 100 HUB community! 🙌
                        </p>
                        <p style="font-size:15px;color:#4A4A4A;line-height:1.7;margin-bottom:24px;">
                            We've received your application and we're excited to review your profile.
                        </p>
                        <div style="background:#F5F5F5;border-radius:10px;padding:20px 24px;margin-bottom:28px;">
                            <p style="margin:0 0 10px;font-size:12px;color:#8A8A8A;text-transform:uppercase;letter-spacing:1px;">What happens next</p>
                            <ul style="margin:0;padding-left:18px;font-size:14px;color:#4A4A4A;line-height:2.2;">
                                <li>Our team will review your application</li>
                                <li>You'll receive a welcome email once accepted</li>
                                <li>You'll get access to exclusive opportunities and events</li>
                            </ul>
                        </div>
                        <p style="font-size:14px;color:#8A8A8A;line-height:1.7;">
                            Follow us on Instagram 
                            <a href="https://instagram.com/100projectsmedia" style="color:#E31E24;">@100projectsmedia</a>.
                        </p>
                        <hr style="border:none;border-top:1px solid #E8E4DE;margin:32px 0;" />
                        <p style="font-size:12px;color:#B8B0A8;">100 HUB · Broadcasting &amp; Media Production Company</p>
                    </div>
                `
            })
        });

        if (!response.ok) {
            const errorData = await response.text();
            console.error('❌ Resend email error:', errorData);
        } else {
            console.log(`✅ Confirmation email sent to ${email}`);
        }
    } catch (error) {
        console.error('❌ Email sending error:', error);
    }
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

        // Send confirmation email to applicant (does not affect signup flow)
        await sendConfirmationEmail(email, name);

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