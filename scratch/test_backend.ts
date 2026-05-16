import axios from 'axios';

const API_URL = 'http://localhost:9000';

async function test() {
    try {
        console.log("Testing /auth/profile without token...");
        const res1 = await axios.get(`${API_URL}/auth/profile`);
        console.log("Res1:", res1.status);
    } catch (error: any) {
        console.log("Res1 Error:", error.response?.status, error.response?.data);
    }

    try {
        console.log("\nTesting /usuarios/invalid_id (Should be 400 or 404, not 500)...");
        const res2 = await axios.get(`${API_URL}/usuarios/invalid_id`);
        console.log("Res2:", res2.status);
    } catch (error: any) {
        console.log("Res2 Error:", error.response?.status, error.response?.data);
    }
    
    try {
        console.log("\nTesting /valoraciones/received/invalid_id (Should be 200 with empty data)...");
        const res3 = await axios.get(`${API_URL}/valoraciones/received/invalid_id`);
        console.log("Res3:", res3.status, res3.data);
    } catch (error: any) {
        console.log("Res3 Error:", error.response?.status, error.response?.data);
    }
}

test();
