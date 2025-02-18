export async function onRequestPost({ request, env }) {
    try {
        const { number, recaptcha } = await request.json();
        
        // Input Validation
        if (!number || !recaptcha) {
            return new Response(JSON.stringify({
                result: "FAIL",
                reason: "Missing required fields"
            }), { status: 400 });
        }

        // reCAPTCHA Verification
        const verifyUrl = new URL('https://www.google.com/recaptcha/api/siteverify');
        verifyUrl.searchParams.append('secret', env.RECAPTCHA_SECRET);
        verifyUrl.searchParams.append('response', recaptcha);
        
        const verification = await fetch(verifyUrl);
        const { success, score } = await verification.json();

        // Score Thresholding
        if (!success || score < 0.5) {
            return new Response(JSON.stringify({
                result: "FAIL",
                reason: "Failed reCAPTCHA verification",
                score
            }), { status: 403 });
        }

        return new Response(JSON.stringify({
            result: "OK",
            number: Number(number)
        }), {
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        return new Response(JSON.stringify({
            result: "FAIL",
            reason: "Server error"
        }), { status: 500 });
    }
}
