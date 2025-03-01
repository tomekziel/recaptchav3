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
        const verifyUrl = "https://www.google.com/recaptcha/api/siteverify";
        const formData = new URLSearchParams();
        formData.append("secret", env.RECAPTCHA_SECRET);
        formData.append("response", recaptcha);

        const verificationResponse = await fetch(verifyUrl, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: formData.toString(),
        });

        if (!verificationResponse.ok) {
            throw new Error("Failed to contact reCAPTCHA server");
        }

        const verificationData = await verificationResponse.json();
        const { success, score } = verificationData;

        if (!success || typeof score !== "number" || score < 0.5) {
            return new Response(JSON.stringify({
                result: "FAIL",
                reason: "Failed reCAPTCHA verification",
                score: score ?? "N/A"
            }), { status: 403 });
        }

        return new Response(JSON.stringify({
            result: "OK",
            number: Number(number),
            score: score ?? "N/A"
        }), {
            headers: { "Content-Type": "application/json" }
        });

    } catch (error) {
        return new Response(JSON.stringify({
            result: "FAIL",
            reason: error.message || "Server error"
        }), { status: 500 });
    }
}
