import request from 'supertest';
import dbConn from '../../db/dbConn';
import app from '../../test_server';

beforeEach(() => {
  dbConn.connect();
});

afterEach(() => {
  dbConn.end();
});

// Create server
const server = app
  .listen(app.get('port'), () => {
    console.log(`${app.get('port')} server is Running`);
  })
  .on('error', err => {
    console.log(`Error message ${err}`);
  });

describe('Test the root path', () => {
  test('It should response the GET method', async () => {
    const response = await request(app).get('/');
    expect(response.statusCode).toBe(200);
  });
});

// Close server
server.close();
