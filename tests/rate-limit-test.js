const axios = require('axios');

// Configuration
const config = {
    baseURL: 'http://localhost:5000',
    token: '30fd33ed3f721ec67a91d3c9650dd0923ced008718b176b5600dbeb223ac1c16',
    totalRequests: 10, // We'll send 10 requests to test the 5/sec limit
};

// Function to send a single request
async function sendRequest(index) {
    try {
        const response = await axios.post(`${config.baseURL}/server/data`, 
            { test: `Request ${index}` },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'CL-X-TOKEN': config.token
                }
            }
        );
        console.log(`✅ Request ${index + 1} succeeded:`, {
            status: response.status,
            eventId: response.data.data.event_id,
            remainingRequests: response.headers['ratelimit-remaining']
        });
        return { success: true, response };
    } catch (error) {
        if (error.response) {
            console.log(`❌ Request ${index + 1} failed:`, {
                status: error.response.status,
                error: error.response.data.error,
                resetIn: error.response.data.reset_in_ms,
                retryAfter: error.response.data.retry_after
            });
        } else {
            console.log(`❌ Request ${index + 1} failed:`, error.message);
        }
        return { success: false, error };
    }
}

// Function to run the test
async function runTest() {
    console.log('Starting rate limit test...');
    console.log(`Sending ${config.totalRequests} requests rapidly...\n`);

    const startTime = Date.now();
    
    // Send requests in parallel to test rate limiting
    const promises = Array(config.totalRequests).fill().map((_, index) => 
        sendRequest(index)
    );

    const results = await Promise.all(promises);
    const endTime = Date.now();

    // Calculate statistics
    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;
    const duration = (endTime - startTime) / 1000;

    console.log('\nTest Results:');
    console.log('=============');
    console.log(`Duration: ${duration.toFixed(2)} seconds`);
    console.log(`Successful requests: ${successCount}`);
    console.log(`Failed requests (rate limited): ${failureCount}`);
    console.log(`Success rate: ${((successCount/config.totalRequests) * 100).toFixed(1)}%`);
}

// Run the test
runTest().catch(console.error); 