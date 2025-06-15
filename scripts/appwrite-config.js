import { Client, Account, Databases, Query } from 'https://cdn.jsdelivr.net/npm/appwrite@13.0.1/+esm';

const client = new Client();

client
	.setEndpoint("https://cloud.appwrite.io/v1")
	.setProject("68405f0c00292a48a95a");

const account = new Account(client);
const databases = new Databases(client);
export { client, account, databases, Query }

