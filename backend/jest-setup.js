import { connect, clearDatabase, closeDatabase } from './jest-mongo-setup.js';

beforeAll(async () => {
    await connect();
});

afterEach(async () => {
    await clearDatabase();
});

afterAll(async () => {
    await closeDatabase();
});
