// netlify/functions/update-member.js
// Updates a member's status, selected image, or details via Sheet.best
// Sends acceptance/decline email to the MEMBER via Resend

const SHEET_BEST_API = 'https://api.sheetbest.com/sheets/7fb06936-5f4f-4ca5-bb81-b4e8af870b57/tabs/Members';

// Resend email configuration - using verified domain
const EMAIL_FROM = 'noreply@100hub.co.za';
const REPLY_TO_EMAIL = '100projectsmedia@gmail.com';

async function sendEmail({ to, subject, html }) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
        console.warn('RESEND_API_KEY not set — skipping email');
        return;
    }
    const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            from: `100 HUB <${EMAIL_FROM}>`,
            to: [to],
            reply_to: REPLY_TO_EMAIL,
            subject,
            html
        })
    });
    if (!res.ok) {
        console.error('Resend error:', await res.text());
    } else {
        console.log('Email sent to:', to);
    }
}

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
        return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
    }

    try {
        const body = JSON.parse(event.body);
        const { email, status, selectedImage, name, role, skills } = body;

        if (!email) {
            return { statusCode: 400, headers, body: JSON.stringify({ error: 'Member email is required' }) };
        }

        const updates = {};
        if (status !== undefined)        updates.status = status;
        if (selectedImage !== undefined) updates.selectedImage = selectedImage;
        if (name !== undefined)          updates.name = name;
        if (role !== undefined)          updates.role = role;
        if (skills !== undefined)        updates.skills = skills;

        if (Object.keys(updates).length === 0) {
            return { statusCode: 400, headers, body: JSON.stringify({ error: 'No fields to update' }) };
        }

        // Fetch member name if not passed in (needed for the email)
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

        // PATCH the member in Sheet.best
        const encodedEmail = encodeURIComponent(email.toLowerCase().trim());
        const updateResponse = await fetch(`${SHEET_BEST_API}/email/${encodedEmail}`, {
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
            return { statusCode: 404, headers, body: JSON.stringify({ error: 'Member not found in sheet' }) };
        }

        // Send email TO THE MEMBER when their status changes
        if (status === 'accepted') {
            await sendEmail({
                to: email,   // ← goes to the applicant
                subject: "You've been accepted to 100 HUB 🎉",
                html: `
                    <div style="font-family:'Helvetica Neue',Arial,sans-serif;max-width:560px;margin:0 auto;padding:40px 24px;color:#1A1A1A;">
                        <h1 style="font-size:26px;font-weight:700;margin-bottom:8px;">Welcome to the 100 Family, ${memberName}!</h1>
                        <p style="font-size:16px;color:#4A4A4A;line-height:1.7;margin-bottom:24px;">
                            Your application has been reviewed and we're excited to let you know — 
                            you've been <strong>officially accepted</strong> as a member of the 100 HUB creative community.
                        </p>
                        <div style="background:#F5F5F5;border-radius:10px;padding:20px 24px;margin-bottom:28px;">
                            <p style="margin:0 0 10px;font-size:12px;color:#8A8A8A;text-transform:uppercase;letter-spacing:1px;">What to expect</p>
                            <ul style="margin:0;padding-left:18px;font-size:14px;color:#4A4A4A;line-height:2;">
                                <li>Your profile is now live on the 100 HUB</li>
                                <li>Creative opportunities and collaborations</li>
                                <li>Editorial features in 100 Magazine</li>
                                <li>Exclusive events and networking</li>
                                <li>Brand collaborations and partnerships</li>
                            </ul>
                        </div>
                        <p style="font-size:14px;color:#8A8A8A;line-height:1.7;">
                            Follow us on Instagram 
                            <a href="https://instagram.com/100projectsmedia" style="color:#E31E24;">@100projectsmedia</a> 
                            and stay connected with the community.
                        </p>
                        <hr style="border:none;border-top:1px solid #E8E4DE;margin:32px 0;" />
                        <p style="font-size:12px;color:#B8B0A8;">100 HUB · Broadcasting &amp; Media Production Company</p>
                    </div>
                `
            });
        }

        if (status === 'declined') {
            await sendEmail({
                to: email,   // ← goes to the applicant
                subject: 'Update on your 100 HUB Application',
                html: `
                    <div style="font-family:'Helvetica Neue',Arial,sans-serif;max-width:560px;margin:0 auto;padding:40px 24px;color:#1A1A1A;">
                        <h1 style="font-size:24px;font-weight:700;margin-bottom:8px;">Hello ${memberName},</h1>
                        <p style="font-size:16px;color:#4A4A4A;line-height:1.7;margin-bottom:24px;">
                            Thank you for your interest in joining the 100 HUB community. After carefully reviewing your application,
                            we are unable to accept you as a member at this time.
                        </p>
                        <p style="font-size:15px;color:#4A4A4A;line-height:1.7;margin-bottom:24px;">
                            A member of our team may be in touch with more details. We encourage you to stay connected 
                            and keep creating — the door isn't closed.
                        </p>
                        <p style="font-size:14px;color:#8A8A8A;line-height:1.7;">
                            Follow us on Instagram 
                            <a href="https://instagram.com/100projectsmedia" style="color:#E31E24;">@100projectsmedia</a>.
                        </p>
                        <hr style="border:none;border-top:1px solid #E8E4DE;margin:32px 0;" />
                        <p style="font-size:12px;color:#B8B0A8;">100 HUB · Broadcasting &amp; Media Production Company</p>
                    </div>
                `
            });
        }

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ success: true, message: 'Member updated successfully', updated: result })
        };

    } catch (error) {
        console.error('Update error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ success: false, error: 'Failed to update member: ' + error.message })
        };
    }
};