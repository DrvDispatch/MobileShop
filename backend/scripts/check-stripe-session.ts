import 'dotenv/config';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

async function main() {
    // Get the session ID from the most recent order
    const sessionIds = [
        'cs_test_b1Fsd3fXTNLynu8wQcuIIrc5Ju2SkeC0o3uR16jetTC49wK6AxqDFg3nFM', // ND-MJO6J4VB-REIX
        'cs_test_b1eTcyX7iHpqvWvmO0o31kjaiSJHqaRTxkIZDft8egKNXV0eDESeR4IEGU', // ND-MJNIWBBQ-5CGJ
    ];

    for (const sessionId of sessionIds) {
        console.log(`\n=== Session: ${sessionId.substring(0, 30)}... ===`);
        try {
            const session = await stripe.checkout.sessions.retrieve(sessionId);
            console.log(`  Status: ${session.status}`);
            console.log(`  Payment Status: ${session.payment_status}`);
            console.log(`  Metadata: ${JSON.stringify(session.metadata)}`);
            console.log(`  Customer Email: ${session.customer_email}`);
        } catch (error) {
            console.log(`  Error: ${error}`);
        }
    }
}

main().catch(console.error);
