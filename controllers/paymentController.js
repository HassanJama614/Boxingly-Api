
const axios = require('axios');
const Payment = require('../models/Payment');
const Class = require('../models/Class');

async function getMpesaAuthToken() {
    const consumerKey = process.env.MPESA_CONSUMER_KEY;
    const consumerSecret = process.env.MPESA_CONSUMER_SECRET;

    console.log('\n--- M-Pesa Auth Token Generation ---');
    console.log('  Attempting to get M-Pesa Auth Token...');
    console.log('  Raw Consumer Key from .env (first 5, last 5 chars):', consumerKey?.substring(0,5) + '...' + consumerKey?.slice(-5));
    
    console.log('  Value of process.env.MPESA_ENV:', process.env.MPESA_ENV);


    if (!consumerKey || !consumerSecret) {
        console.error('🔴 CRITICAL: MPESA_CONSUMER_KEY or MPESA_CONSUMER_SECRET is undefined or empty in .env!');
        throw new Error('M-Pesa API credentials missing in server configuration.');
    }
    if (process.env.MPESA_ENV !== 'sandbox' && process.env.MPESA_ENV !== 'production') {
        console.warn(`🟠 WARNING: MPESA_ENV is "${process.env.MPESA_ENV}". Defaulting to PRODUCTION environment for M-Pesa URLs. Set MPESA_ENV=sandbox for sandbox testing.`);
    }

    const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');
    console.log('  Base64 Auth Header for token request (first 10):', auth.substring(0, 10) + '...');

    let url;
    if (process.env.MPESA_ENV === 'sandbox') {
        url = 'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials';
        console.log('  MPESA_ENV is "sandbox". Using SANDBOX token URL.');
    } else {
        url = 'https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials';
        console.log('  MPESA_ENV is NOT "sandbox" (or undefined). Using PRODUCTION token URL.');
    }

    console.log('  Requesting M-Pesa token from CORRECT URL:', url);

    try {
        const response = await axios.get(url, {
            headers: {
                'Authorization': `Basic ${auth}`
            }
        });
        console.log('✅ Successfully fetched M-Pesa token. Token (first 10 chars):', response.data.access_token?.substring(0,10) + '...');
        return response.data.access_token;
    } catch (error) {
        console.error('🔴 Error getting M-Pesa token:');
        if (error.response) {
            console.error('   Error Status:', error.response.status);
            console.error('   Error Headers:', JSON.stringify(error.response.headers, null, 2));
            console.error('   Error Data from M-Pesa:', JSON.stringify(error.response.data, null, 2));
        } else if (error.request) {
            console.error('   No response received for M-Pesa token request. Error Request Object:', error.request);
        } else {
            console.error('   Error Message during M-Pesa token request setup:', error.message);
        }
        console.error('🔴 Request to M-Pesa token endpoint failed. Ensure MPESA_CONSUMER_KEY, MPESA_CONSUMER_SECRET, and MPESA_ENV are correct in .env.');
        throw new Error('Could not authenticate with M-Pesa');
    }
}

function formatPhoneNumber(phoneNumber) {
    if (!phoneNumber) return null;
    if (phoneNumber.startsWith('07')) {
        return `2547${phoneNumber.substring(2)}`;
    } else if (phoneNumber.startsWith('01')) {
        return `2541${phoneNumber.substring(2)}`;
    } else if (phoneNumber.startsWith('+254') && phoneNumber.length === 13) {
        return phoneNumber.substring(1);
    } else if (phoneNumber.startsWith('254') && phoneNumber.length === 12) {
        return phoneNumber;
    }
    console.warn('Phone number format might be incorrect, using as-is for M-Pesa:', phoneNumber);
    return phoneNumber;
}

function generateTimestamp() {
    const d = new Date(); 
    return d.getFullYear() +
        ('0' + (d.getMonth() + 1)).slice(-2) +
        ('0' + d.getDate()).slice(-2) +
        ('0' + d.getHours()).slice(-2) +
        ('0' + d.getMinutes()).slice(-2) +
        ('0' + d.getSeconds()).slice(-2);
}




exports.initiateMpesaSTKPush = async (req, res) => {
    const { classId, amount, phoneNumber } = req.body;
    const userId = req.user ? req.user.id : null;

    console.log(`\n🔵 STK Push Initiated by User ID: ${userId}`);
    console.log(`   Class ID: ${classId}, Amount: ${amount}, Phone: ${phoneNumber}`);

    if (!userId) {
        console.error('🔴 User ID not found in request. User might not be authenticated.');
        return res.status(401).json({ success: false, message: 'User not authenticated.' });
    }
    if (!classId || !amount || !phoneNumber) {
        console.error('🔴 Missing required fields: classId, amount, or phoneNumber.');
        return res.status(400).json({ success: false, message: 'Missing required fields: classId, amount, or phoneNumber.' });
    }

    try {
        const selectedClass = await Class.findById(classId);
        if (!selectedClass) {
            console.error(`🔴 Class not found for ID: ${classId}`);
            return res.status(404).json({ success: false, message: 'Class not found.' });
        }
        if (selectedClass.price !== Number(amount)) {
            console.error(`🔴 Invalid amount. Class Price: ${selectedClass.price}, Submitted Amount: ${amount}`);
            return res.status(400).json({ success: false, message: 'Invalid amount for the selected class.' });
        }

        const formattedPhone = formatPhoneNumber(phoneNumber);
        if (!formattedPhone || !formattedPhone.startsWith('254') || formattedPhone.length !== 12) {
            console.error(`🔴 Invalid formatted phone number for M-Pesa: ${formattedPhone} (Original: ${phoneNumber})`);
            return res.status(400).json({ success: false, message: 'Invalid M-Pesa phone number format. Must be like 2547XXXXXXXX.' });
        }
        console.log('   Formatted Phone for M-Pesa:', formattedPhone);

        const token = await getMpesaAuthToken();
        console.log('   Auth Token obtained. Proceeding with STK Push.');
        
        console.log('   Token being sent for STK Push (first 10 chars):', token?.substring(0,10) + '...');
        


        const timestamp = generateTimestamp();
        const shortCode = process.env.MPESA_SHORTCODE;
        const passkey = process.env.MPESA_PASSKEY;

        if (!shortCode || !passkey || !process.env.MPESA_CALLBACK_URL) {
            console.error('🔴 M-Pesa server configuration error: MPESA_SHORTCODE, MPESA_PASSKEY, or MPESA_CALLBACK_URL is missing in .env');
            return res.status(500).json({ success: false, message: 'Server M-Pesa configuration error.' });
        }

        const password = Buffer.from(`${shortCode}${passkey}${timestamp}`).toString('base64');
        console.log('   STK Push Password (first 10):', password.substring(0,10) + '...');
        console.log('   Timestamp used for STK Push password:', timestamp); // Log timestamp used for password

        const stkPushUrl = process.env.MPESA_ENV === 'sandbox'
            ? 'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest'
            : 'https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest';

        const payload = {
            BusinessShortCode: shortCode,
            Password: password,
            Timestamp: timestamp,
            TransactionType: 'CustomerPayBillOnline',
            Amount: String(amount),
            PartyA: formattedPhone,
            PartyB: shortCode,
            PhoneNumber: formattedPhone,
            CallBackURL: process.env.MPESA_CALLBACK_URL,
            AccountReference: `BOX-${classId.toString().slice(-4)}-${userId.toString().slice(-4)}`, // Max 12 Chars, unique enough for ref
            TransactionDesc: `Class: ${selectedClass.name.substring(0,25)}`, // Max ~20-30 Chars for description
        };

        console.log('   Payload for M-Pesa STK Push:', JSON.stringify(payload, null, 2));
        console.log('   Making STK Push request to M-Pesa API URL:', stkPushUrl);

        const mpesaResponse = await axios.post(stkPushUrl, payload, {
            headers: { Authorization: `Bearer ${token}` },
        });

        console.log('✅ M-Pesa STK Push API Response:', JSON.stringify(mpesaResponse.data, null, 2));

        if (mpesaResponse.data && mpesaResponse.data.ResponseCode === '0') {
            console.log('   STK Push successfully initiated by M-Pesa. Creating payment record...');
            await Payment.create({
                userId,
                classId,
                amount: Number(amount),
                phoneNumber: formattedPhone,
                mpesaMerchantRequestID: mpesaResponse.data.MerchantRequestID,
                mpesaCheckoutRequestID: mpesaResponse.data.CheckoutRequestID,
                status: 'pending',
            });
            console.log('   Payment record created with status: pending.');
            res.json({ success: true, message: 'STK Push initiated. Please check your phone for M-Pesa PIN prompt.', data: mpesaResponse.data });
        } else {
            console.error('🔴 M-Pesa STK Push initiation reported failure by API:', mpesaResponse.data.ResponseDescription || mpesaResponse.data.errorMessage || 'Unknown M-Pesa error during STK Push');
            res.status(400).json({ success: false, message: mpesaResponse.data.ResponseDescription || mpesaResponse.data.errorMessage || 'Failed to initiate STK push with M-Pesa API' });
        }
    } catch (error) {
        const errorData = error.response ? error.response.data : null;
        console.error('🔴 Overall Error in initiateMpesaSTKPush function:', error.message);
        if (errorData) {
            console.error('   Error data from M-Pesa/Axios (initiateMpesaSTKPush):', JSON.stringify(errorData, null, 2));
            res.status(error.response.status || 500).json({ success: false, message: errorData.errorMessage || errorData.message || 'Error from M-Pesa STK Push service.' });
        } else if (error.request) {
            console.error('   No response received from M-Pesa for STK Push, request details:', error.request);
            res.status(500).json({ success: false, message: 'No response from M-Pesa service for STK Push.' });
        } else if(error.message === 'Could not authenticate with M-Pesa') {
            res.status(500).json({ success: false, message: 'M-Pesa authentication failed. Check server credentials.' });
        }
         else {
            res.status(500).json({ success: false, message: 'Server error during M-Pesa payment initiation.' });
        }
    }
};


exports.mpesaCallback = async (req, res) => {
    console.log('\n🔵 M-Pesa Callback Received (Path: /api/payments/stk-notification):');
    console.log('   Raw Callback Body:', JSON.stringify(req.body, null, 2));

    if (!req.body || !req.body.Body || !req.body.Body.stkCallback) {
        console.error('🔴 Invalid callback structure received from M-Pesa.');
        return res.status(200).json({ ResultCode: 1, ResultDesc: 'Rejected due to invalid callback data structure from client side.' });
    }

    const callbackData = req.body.Body.stkCallback;
    const merchantRequestID = callbackData.MerchantRequestID;
    const checkoutRequestID = callbackData.CheckoutRequestID;
    const resultCode = callbackData.ResultCode;
    const resultDesc = callbackData.ResultDesc;

    console.log(`   Processing callback for MerchantRequestID: ${merchantRequestID}, CheckoutRequestID: ${checkoutRequestID}`);
    console.log(`   ResultCode from M-Pesa: ${resultCode} (Type: ${typeof resultCode}), ResultDesc: ${resultDesc}`);

    try {
        const payment = await Payment.findOne({
            mpesaMerchantRequestID: merchantRequestID,
            mpesaCheckoutRequestID: checkoutRequestID,
        });

        if (!payment) {
            console.warn(`🟠 Payment record not found for MerchantRequestID: ${merchantRequestID} and CheckoutRequestID: ${checkoutRequestID}. Acknowledging M-Pesa.`);
            return res.status(200).json({ ResultCode: 0, ResultDesc: 'Accepted. (Payment record not found by App - potentially a duplicate callback or test)' });
        }

        console.log(`   Found payment record: ${payment._id}, Current DB Status: ${payment.status}`);
        if (payment.status === 'completed' || payment.status === 'failed' || payment.status === 'cancelled') { // Added cancelled here
            console.warn(`   Payment ${payment._id} already processed as '${payment.status}'. Acknowledging M-Pesa.`);
            return res.status(200).json({ ResultCode: 0, ResultDesc: 'Accepted. (Transaction already processed)' });
        }

        payment.mpesaCallbackData = callbackData;

        if (String(resultCode) === "0") {
            payment.status = 'completed';
            if (callbackData.CallbackMetadata && callbackData.CallbackMetadata.Item) {
                const receiptItem = callbackData.CallbackMetadata.Item.find(item => item.Name === 'MpesaReceiptNumber');
                if (receiptItem && receiptItem.Value) {
                    payment.mpesaReceiptNumber = receiptItem.Value;
                    console.log(`   MpesaReceiptNumber extracted: ${payment.mpesaReceiptNumber}`);
                } else {
                     console.warn('   MpesaReceiptNumber not found in callback metadata (Name not "MpesaReceiptNumber" or Value missing).');
                }
            } else {
                 console.warn('   CallbackMetadata or Item array not present. Cannot extract receipt.');
            }
            console.log(`✅ Payment ${payment._id} successfully updated to 'completed'.`);
        } else {
            payment.status = (resultDesc && resultDesc.toLowerCase().includes('cancel')) || String(resultCode) === "1032" ? 'cancelled' : 'failed';
            console.log(`🔴 Payment ${payment._id} updated to '${payment.status}'. M-Pesa Reason: ${resultDesc} (Code: ${resultCode})`);
        }

        await payment.save();
        console.log(`   Payment record saved with new status. Responding to M-Pesa.`);
        res.status(200).json({ ResultCode: 0, ResultDesc: 'Accepted' });

    } catch (error) {
        console.error('🔴 Error processing M-Pesa callback in database or internal logic:', error.message, error.stack);
        res.status(200).json({ ResultCode: 0, ResultDesc: 'Accepted with an internal server error during processing.' });
    }
};