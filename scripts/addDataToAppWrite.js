import { Client, Account, Databases, Query } from 'https://cdn.jsdelivr.net/npm/appwrite@13.0.1/+esm';

const client = new Client();
client.setEndpoint('https://cloud.appwrite.io/v1').setProject('68405f0c00292a48a95a');


const databases = new Databases(client);

const databaseId = "684619e30005eeecc28a"; // ← غيرها
const collectionId = "684619e30005eeecc28a"; // ← اسم الكولكشن بتاعك
fetch("../database.json")
    .then((res) => res.json())
    .then((data) => {
        console.log("📦 Loaded Agents JSON:", data);
        addAgentsFromJSON(data);
    })
    .catch((err) => {
        console.error("❌ مشكلة في تحميل الملف:", err);
    });

async function addAgentsFromJSON(agentsArray) {
    agentsArray.forEach((agent, index) => {
        setTimeout(async () => {
            try {
                const response = await databases.createDocument(
                    databaseId,
                    collectionId,
                    "unique()",
                    agent
                );
                console.log(`✅ [${index + 1}] Added agent:`, response);
            } catch (error) {
                console.error(`❌ [${index + 1}] Failed to add agent:`, error.message);
            }
        }, index * 1000); // ← كل عميل يتأخر 3 ثواني عن اللي قبله
    });
}
