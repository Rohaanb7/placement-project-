const http = require('http');
const assert = require('assert');
const { app, reset, getRooms } = require('./index');

let server;
let port;
let baseUrl;

function request(method, path, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, baseUrl);
    const reqHeaders = { ...headers };
    let postData = null;

    if (body !== null) {
      if (typeof body === 'string') {
        postData = body;
      } else {
        postData = JSON.stringify(body);
        reqHeaders['Content-Type'] = 'application/json';
      }
    }

    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: reqHeaders
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        let json = null;
        try {
          if (data) json = JSON.parse(data);
        } catch (e) {
          json = null;
        }
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: json,
          rawBody: data
        });
      });
    });

    req.on('error', reject);

    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

async function runTests() {
  console.log('--- Starting Comprehensive 100-Check Assessment Test Suite ---\n');

  // Start test server on dynamic free port
  server = app.listen(0);
  port = server.address().port;
  baseUrl = `http://localhost:${port}`;

  let passed = 0;
  let failed = 0;

  async function check(desc, fn) {
    try {
      await fn();
      passed++;
      console.log(`[PASS] Check ${passed + failed}: ${desc}`);
    } catch (err) {
      failed++;
      console.error(`[FAIL] Check ${passed + failed}: ${desc}`);
      console.error(`       Error: ${err.message}`);
    }
  }

  // --- Group 1: Create (POST) - 14 Checks ---
  reset();
  await check('POST /api/rooms with valid record returns 201 and trimmed values', async () => {
    const res = await request('POST', '/api/rooms', {
      name: '  Grand Suite Deluxe  ',
      location: '  Goa Beach  ',
      type: 'Deluxe',
      pricePerNight: 5500.5,
      capacity: 4,
      available: true,
      roomNumber: '  R-101  '
    });
    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.body.id, 1);
    assert.strictEqual(res.body.name, 'Grand Suite Deluxe');
    assert.strictEqual(res.body.location, 'Goa Beach');
    assert.strictEqual(res.body.type, 'Deluxe');
    assert.strictEqual(res.body.pricePerNight, 5500.5);
    assert.strictEqual(res.body.capacity, 4);
    assert.strictEqual(res.body.available, true);
    assert.strictEqual(res.body.roomNumber, 'R-101');
  });

  await check('POST rejects empty body with 400', async () => {
    const res = await request('POST', '/api/rooms', {});
    assert.strictEqual(res.status, 400);
  });

  await check('POST rejects missing name with 400', async () => {
    const res = await request('POST', '/api/rooms', {
      location: 'Goa',
      type: 'Single',
      pricePerNight: 2000,
      capacity: 1,
      available: true,
      roomNumber: 'R-102'
    });
    assert.strictEqual(res.status, 400);
  });

  await check('POST rejects short name (<3 chars) with 400', async () => {
    const res = await request('POST', '/api/rooms', {
      name: 'AB',
      location: 'Goa',
      type: 'Single',
      pricePerNight: 2000,
      capacity: 1,
      available: true,
      roomNumber: 'R-103'
    });
    assert.strictEqual(res.status, 400);
  });

  await check('POST rejects blank name after trimming with 400', async () => {
    const res = await request('POST', '/api/rooms', {
      name: '      ',
      location: 'Goa',
      type: 'Single',
      pricePerNight: 2000,
      capacity: 1,
      available: true,
      roomNumber: 'R-104'
    });
    assert.strictEqual(res.status, 400);
  });

  await check('POST rejects short location (<2 chars) with 400', async () => {
    const res = await request('POST', '/api/rooms', {
      name: 'Single Room',
      location: 'G',
      type: 'Single',
      pricePerNight: 2000,
      capacity: 1,
      available: true,
      roomNumber: 'R-105'
    });
    assert.strictEqual(res.status, 400);
  });

  await check('POST rejects invalid enum type with 400', async () => {
    const res = await request('POST', '/api/rooms', {
      name: 'Luxury Single',
      location: 'Goa',
      type: 'deluxe', // lowercase is invalid
      pricePerNight: 2000,
      capacity: 1,
      available: true,
      roomNumber: 'R-106'
    });
    assert.strictEqual(res.status, 400);
  });

  await check('POST rejects pricePerNight as string with 400', async () => {
    const res = await request('POST', '/api/rooms', {
      name: 'Luxury Single',
      location: 'Goa',
      type: 'Single',
      pricePerNight: '2000',
      capacity: 1,
      available: true,
      roomNumber: 'R-107'
    });
    assert.strictEqual(res.status, 400);
  });

  await check('POST rejects pricePerNight <= 0 with 400', async () => {
    const res = await request('POST', '/api/rooms', {
      name: 'Luxury Single',
      location: 'Goa',
      type: 'Single',
      pricePerNight: 0,
      capacity: 1,
      available: true,
      roomNumber: 'R-108'
    });
    assert.strictEqual(res.status, 400);
  });

  await check('POST rejects pricePerNight > 100000 with 400', async () => {
    const res = await request('POST', '/api/rooms', {
      name: 'Luxury Single',
      location: 'Goa',
      type: 'Single',
      pricePerNight: 100001,
      capacity: 1,
      available: true,
      roomNumber: 'R-109'
    });
    assert.strictEqual(res.status, 400);
  });

  await check('POST rejects capacity as float 1.5 with 400', async () => {
    const res = await request('POST', '/api/rooms', {
      name: 'Luxury Single',
      location: 'Goa',
      type: 'Single',
      pricePerNight: 2000,
      capacity: 1.5,
      available: true,
      roomNumber: 'R-110'
    });
    assert.strictEqual(res.status, 400);
  });

  await check('POST rejects available as string "true" with 400', async () => {
    const res = await request('POST', '/api/rooms', {
      name: 'Luxury Single',
      location: 'Goa',
      type: 'Single',
      pricePerNight: 2000,
      capacity: 1,
      available: 'true',
      roomNumber: 'R-111'
    });
    assert.strictEqual(res.status, 400);
  });

  await check('POST rejects duplicate roomNumber (ignoring case) with 409', async () => {
    const res = await request('POST', '/api/rooms', {
      name: 'Another Room',
      location: 'Mumbai',
      type: 'Double',
      pricePerNight: 3500,
      capacity: 2,
      available: true,
      roomNumber: 'r-101' // r-101 equals R-101
    });
    assert.strictEqual(res.status, 409);
  });

  await check('POST ignores id in request body', async () => {
    const res = await request('POST', '/api/rooms', {
      id: 9999,
      name: 'Ocean View Double',
      location: 'Kochi',
      type: 'Double',
      pricePerNight: 4000,
      capacity: 2,
      available: false,
      roomNumber: 'R-102'
    });
    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.body.id, 2);
  });

  // --- Group 2: Read one (GET /{id}) - 8 Checks ---
  await check('GET /api/rooms/1 returns correct record with 200', async () => {
    const res = await request('GET', '/api/rooms/1');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.id, 1);
    assert.strictEqual(res.body.roomNumber, 'R-101');
  });

  await check('GET /api/rooms/2 returns second record with 200', async () => {
    const res = await request('GET', '/api/rooms/2');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.id, 2);
    assert.strictEqual(res.body.roomNumber, 'R-102');
  });

  await check('GET /api/rooms/999999 returns 404 with JSON error', async () => {
    const res = await request('GET', '/api/rooms/999999');
    assert.strictEqual(res.status, 404);
    assert(res.body && res.body.error);
  });

  await check('GET /api/rooms/abc returns 404 (not 400/500)', async () => {
    const res = await request('GET', '/api/rooms/abc');
    assert.strictEqual(res.status, 404);
  });

  await check('GET /api/rooms/-1 returns 404', async () => {
    const res = await request('GET', '/api/rooms/-1');
    assert.strictEqual(res.status, 404);
  });

  await check('GET /api/rooms/0 returns 404', async () => {
    const res = await request('GET', '/api/rooms/0');
    assert.strictEqual(res.status, 404);
  });

  await check('GET /api/rooms/null returns 404', async () => {
    const res = await request('GET', '/api/rooms/null');
    assert.strictEqual(res.status, 404);
  });

  await check('GET /api/rooms/1.5 returns 404', async () => {
    const res = await request('GET', '/api/rooms/1.5');
    assert.strictEqual(res.status, 404);
  });

  // --- Group 3: List basics (GET) - 8 Checks ---
  await check('GET /api/rooms returns 200 and list shape (data, page, limit, total, totalPages)', async () => {
    const res = await request('GET', '/api/rooms');
    assert.strictEqual(res.status, 200);
    assert(Array.isArray(res.body.data));
    assert.strictEqual(res.body.page, 1);
    assert.strictEqual(res.body.limit, 10);
    assert.strictEqual(res.body.total, 2);
    assert.strictEqual(res.body.totalPages, 1);
  });

  await check('GET /api/rooms returns items in creation order by default', async () => {
    const res = await request('GET', '/api/rooms');
    assert.strictEqual(res.body.data[0].id, 1);
    assert.strictEqual(res.body.data[1].id, 2);
  });

  await check('GET /api/rooms items have all required properties', async () => {
    const res = await request('GET', '/api/rooms');
    const item = res.body.data[0];
    assert.strictEqual(typeof item.id, 'number');
    assert.strictEqual(typeof item.name, 'string');
    assert.strictEqual(typeof item.location, 'string');
    assert.strictEqual(typeof item.type, 'string');
    assert.strictEqual(typeof item.pricePerNight, 'number');
    assert.strictEqual(typeof item.capacity, 'number');
    assert.strictEqual(typeof item.available, 'boolean');
    assert.strictEqual(typeof item.roomNumber, 'string');
  });

  await check('GET /api/rooms on empty server returns total: 0 and totalPages: 0', async () => {
    reset();
    const res = await request('GET', '/api/rooms');
    assert.strictEqual(res.status, 200);
    assert.deepStrictEqual(res.body.data, []);
    assert.strictEqual(res.body.total, 0);
    assert.strictEqual(res.body.totalPages, 0);
  });

  await check('GET /api/rooms default limit is 10 and page is 1', async () => {
    const res = await request('GET', '/api/rooms');
    assert.strictEqual(res.body.page, 1);
    assert.strictEqual(res.body.limit, 10);
  });

  await check('GET /api/rooms correctly reflects total after new creates', async () => {
    await request('POST', '/api/rooms', {
      name: 'Room Alpha',
      location: 'Delhi',
      type: 'Single',
      pricePerNight: 1500,
      capacity: 1,
      available: true,
      roomNumber: 'A-1'
    });
    await request('POST', '/api/rooms', {
      name: 'Room Beta',
      location: 'Delhi',
      type: 'Single',
      pricePerNight: 1600,
      capacity: 1,
      available: true,
      roomNumber: 'B-1'
    });
    const res = await request('GET', '/api/rooms');
    assert.strictEqual(res.body.total, 2);
    assert.strictEqual(res.body.data.length, 2);
  });

  await check('GET /api/rooms unknown fields are NOT present in list response', async () => {
    await request('POST', '/api/rooms', {
      name: 'Room Gamma',
      location: 'Delhi',
      type: 'Single',
      pricePerNight: 1700,
      capacity: 1,
      available: true,
      roomNumber: 'G-1',
      extraField: 'shouldBeIgnored'
    });
    const res = await request('GET', '/api/rooms');
    const gamma = res.body.data.find(r => r.roomNumber === 'G-1');
    assert.strictEqual(gamma.extraField, undefined);
  });

  await check('GET /api/rooms with empty search string returns all records', async () => {
    const res = await request('GET', '/api/rooms?search=');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.total, 3);
  });

  // --- Group 4: Update (PUT) - 10 Checks ---
  await check('PUT /api/rooms/1 full replace returns 200 and retains original id', async () => {
    const res = await request('PUT', '/api/rooms/1', {
      name: 'Updated Alpha Suite',
      location: 'New Delhi',
      type: 'Suite',
      pricePerNight: 3000,
      capacity: 2,
      available: false,
      roomNumber: 'A-1'
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.id, 1);
    assert.strictEqual(res.body.name, 'Updated Alpha Suite');
    assert.strictEqual(res.body.type, 'Suite');
    assert.strictEqual(res.body.available, false);
  });

  await check('PUT /api/rooms/9999 on unknown id returns 404 (does not create)', async () => {
    const res = await request('PUT', '/api/rooms/9999', {
      name: 'Nonexistent',
      location: 'Nowhere',
      type: 'Single',
      pricePerNight: 1000,
      capacity: 1,
      available: true,
      roomNumber: 'Z-999'
    });
    assert.strictEqual(res.status, 404);
  });

  await check('PUT rejects missing required fields with 400', async () => {
    const res = await request('PUT', '/api/rooms/1', {
      name: 'Partial',
      location: 'Delhi'
    });
    assert.strictEqual(res.status, 400);
  });

  await check('PUT rejects invalid field value with 400', async () => {
    const res = await request('PUT', '/api/rooms/1', {
      name: 'Valid Name',
      location: 'Valid Loc',
      type: 'InvalidType',
      pricePerNight: 2000,
      capacity: 2,
      available: true,
      roomNumber: 'A-1'
    });
    assert.strictEqual(res.status, 400);
  });

  await check('PUT ignores id sent in body (keeps original id)', async () => {
    const res = await request('PUT', '/api/rooms/1', {
      id: 5555,
      name: 'Updated Alpha Suite',
      location: 'New Delhi',
      type: 'Suite',
      pricePerNight: 3000,
      capacity: 2,
      available: false,
      roomNumber: 'A-1'
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.id, 1);
  });

  await check('PUT rejects duplicate roomNumber matching another record with 409', async () => {
    const res = await request('PUT', '/api/rooms/1', {
      name: 'Updated Alpha Suite',
      location: 'New Delhi',
      type: 'Suite',
      pricePerNight: 3000,
      capacity: 2,
      available: false,
      roomNumber: 'b-1' // duplicate of room 2 (B-1)
    });
    assert.strictEqual(res.status, 409);
  });

  await check('PUT allows keeping own roomNumber without 409', async () => {
    const res = await request('PUT', '/api/rooms/1', {
      name: 'Updated Alpha Suite',
      location: 'New Delhi',
      type: 'Suite',
      pricePerNight: 3200,
      capacity: 2,
      available: true,
      roomNumber: 'A-1' // its own roomNumber
    });
    assert.strictEqual(res.status, 200);
  });

  await check('PUT ignores unknown fields in body', async () => {
    const res = await request('PUT', '/api/rooms/1', {
      name: 'Updated Alpha Suite',
      location: 'New Delhi',
      type: 'Suite',
      pricePerNight: 3200,
      capacity: 2,
      available: true,
      roomNumber: 'A-1',
      unknownField: 'foo'
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.unknownField, undefined);
  });

  await check('PUT trims text fields properly', async () => {
    const res = await request('PUT', '/api/rooms/1', {
      name: '   Trimmed Suite   ',
      location: '   Trimmed City   ',
      type: 'Suite',
      pricePerNight: 3200,
      capacity: 2,
      available: true,
      roomNumber: '   A-1   '
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.name, 'Trimmed Suite');
    assert.strictEqual(res.body.location, 'Trimmed City');
    assert.strictEqual(res.body.roomNumber, 'A-1');
  });

  await check('PUT on invalid body (not object) returns 400', async () => {
    const res = await request('PUT', '/api/rooms/1', 'not an object', { 'Content-Type': 'application/json' });
    assert.strictEqual(res.status, 400);
  });

  // --- Group 5: Update (PATCH) - 10 Checks ---
  await check('PATCH /api/rooms/1 partial update modifies only sent fields', async () => {
    const res = await request('PATCH', '/api/rooms/1', {
      pricePerNight: 4500
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.pricePerNight, 4500);
    assert.strictEqual(res.body.name, 'Trimmed Suite'); // Untouched
  });

  await check('PATCH with empty body {} returns 400', async () => {
    const res = await request('PATCH', '/api/rooms/1', {});
    assert.strictEqual(res.status, 400);
  });

  await check('PATCH with only unknown fields returns 400', async () => {
    const res = await request('PATCH', '/api/rooms/1', { unknownProp: 'val' });
    assert.strictEqual(res.status, 400);
  });

  await check('PATCH on unknown id returns 404', async () => {
    const res = await request('PATCH', '/api/rooms/99999', { pricePerNight: 5000 });
    assert.strictEqual(res.status, 404);
  });

  await check('PATCH with invalid type value returns 400', async () => {
    const res = await request('PATCH', '/api/rooms/1', { type: 'InvalidType' });
    assert.strictEqual(res.status, 400);
  });

  await check('PATCH with string pricePerNight returns 400', async () => {
    const res = await request('PATCH', '/api/rooms/1', { pricePerNight: '5000' });
    assert.strictEqual(res.status, 400);
  });

  await check('PATCH ignores unknown fields sent alongside valid fields', async () => {
    const res = await request('PATCH', '/api/rooms/1', {
      name: 'New Name for Room 1',
      ignoredField: 123
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.name, 'New Name for Room 1');
    assert.strictEqual(res.body.ignoredField, undefined);
  });

  await check('PATCH cannot change id even if id sent in body', async () => {
    const res = await request('PATCH', '/api/rooms/1', {
      id: 8888,
      location: 'Bangalore'
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.id, 1);
    assert.strictEqual(res.body.location, 'Bangalore');
  });

  await check('PATCH rejects duplicate roomNumber matching another record with 409', async () => {
    const res = await request('PATCH', '/api/rooms/1', {
      roomNumber: 'B-1' // duplicate of room 2
    });
    assert.strictEqual(res.status, 409);
  });

  await check('PATCH allows setting same roomNumber without 409', async () => {
    const res = await request('PATCH', '/api/rooms/1', {
      roomNumber: 'A-1'
    });
    assert.strictEqual(res.status, 200);
  });

  // --- Group 6: Delete (DELETE) - 8 Checks ---
  await check('DELETE /api/rooms/1 returns 204 with empty body', async () => {
    const res = await request('DELETE', '/api/rooms/1');
    assert.strictEqual(res.status, 204);
    assert.strictEqual(res.rawBody, '');
  });

  await check('GET /api/rooms/1 returns 404 after deletion', async () => {
    const res = await request('GET', '/api/rooms/1');
    assert.strictEqual(res.status, 404);
  });

  await check('DELETE /api/rooms/1 second delete returns 404', async () => {
    const res = await request('DELETE', '/api/rooms/1');
    assert.strictEqual(res.status, 404);
  });

  await check('DELETE on unknown id returns 404', async () => {
    const res = await request('DELETE', '/api/rooms/88888');
    assert.strictEqual(res.status, 404);
  });

  await check('DELETE drops total count by exactly one', async () => {
    const res = await request('GET', '/api/rooms');
    assert.strictEqual(res.body.total, 2); // Was 3, now 2
  });

  await check('Other records remain intact after DELETE', async () => {
    const res = await request('GET', '/api/rooms/2');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.roomNumber, 'B-1');
  });

  await check('DELETE room 2 returns 204', async () => {
    const res = await request('DELETE', '/api/rooms/2');
    assert.strictEqual(res.status, 204);
  });

  await check('Total drops to 1 after second delete', async () => {
    const res = await request('GET', '/api/rooms');
    assert.strictEqual(res.body.total, 1);
  });

  // --- Seed Data for Pagination, Filter, Search, Sort (15 rooms) ---
  reset();
  const seedRooms = [
    { name: 'Azure Suite', location: 'Goa', type: 'Suite', pricePerNight: 8000, capacity: 4, available: true, roomNumber: 'RM-101' },
    { name: 'Beachfront Villa', location: 'Goa', type: 'Deluxe', pricePerNight: 12000, capacity: 6, available: true, roomNumber: 'RM-102' },
    { name: 'City Center Single', location: 'Bangalore', type: 'Single', pricePerNight: 2000, capacity: 1, available: false, roomNumber: 'RM-103' },
    { name: 'Downtown Studio', location: 'Bangalore', type: 'Single', pricePerNight: 2500, capacity: 1, available: true, roomNumber: 'RM-104' },
    { name: 'Executive Deluxe', location: 'Mumbai', type: 'Deluxe', pricePerNight: 7500, capacity: 2, available: false, roomNumber: 'RM-105' },
    { name: 'Family Haven', location: 'Ooty', type: 'Family', pricePerNight: 9000, capacity: 8, available: true, roomNumber: 'RM-106' },
    { name: 'Garden Cottage', location: 'Ooty', type: 'Double', pricePerNight: 4500, capacity: 2, available: true, roomNumber: 'RM-107' },
    { name: 'Heritage Palace', location: 'Jaipur', type: 'Suite', pricePerNight: 15000, capacity: 5, available: false, roomNumber: 'RM-108' },
    { name: 'Imperial Suite', location: 'Delhi', type: 'Suite', pricePerNight: 11000, capacity: 4, available: true, roomNumber: 'RM-109' },
    { name: 'Jungle Lodge', location: 'Wayanad', type: 'Family', pricePerNight: 6500, capacity: 7, available: true, roomNumber: 'RM-110' },
    { name: 'King Deluxe', location: 'Kolkata', type: 'Deluxe', pricePerNight: 5000, capacity: 2, available: false, roomNumber: 'RM-111' },
    { name: 'Lake View Suite', location: 'Udaipur', type: 'Suite', pricePerNight: 13500, capacity: 3, available: true, roomNumber: 'RM-112' },
    { name: 'Mountain View Double', location: 'Manali', type: 'Double', pricePerNight: 3500, capacity: 2, available: true, roomNumber: 'RM-113' },
    { name: 'Noble Double', location: 'Chennai', type: 'Double', pricePerNight: 3200, capacity: 2, available: false, roomNumber: 'RM-114' },
    { name: 'Oasis Deluxe', location: 'Jaisalmer', type: 'Deluxe', pricePerNight: 4800, capacity: 3, available: true, roomNumber: 'RM-115' }
  ];

  for (const r of seedRooms) {
    await request('POST', '/api/rooms', r);
  }

  // --- Group 7: Pagination - 12 Checks ---
  await check('Pagination: page=1&limit=5 returns first 5 records', async () => {
    const res = await request('GET', '/api/rooms?page=1&limit=5');
    assert.strictEqual(res.body.data.length, 5);
    assert.strictEqual(res.body.page, 1);
    assert.strictEqual(res.body.limit, 5);
    assert.strictEqual(res.body.total, 15);
    assert.strictEqual(res.body.totalPages, 3);
    assert.strictEqual(res.body.data[0].roomNumber, 'RM-101');
    assert.strictEqual(res.body.data[4].roomNumber, 'RM-105');
  });

  await check('Pagination: page=2&limit=5 returns next 5 without overlap', async () => {
    const res = await request('GET', '/api/rooms?page=2&limit=5');
    assert.strictEqual(res.body.data.length, 5);
    assert.strictEqual(res.body.data[0].roomNumber, 'RM-106');
    assert.strictEqual(res.body.data[4].roomNumber, 'RM-110');
  });

  await check('Pagination: page=3&limit=5 returns remainder page', async () => {
    const res = await request('GET', '/api/rooms?page=3&limit=5');
    assert.strictEqual(res.body.data.length, 5);
    assert.strictEqual(res.body.data[0].roomNumber, 'RM-111');
    assert.strictEqual(res.body.data[4].roomNumber, 'RM-115');
  });

  await check('Pagination: every record appears exactly once across pages', async () => {
    const seen = new Set();
    for (let p = 1; p <= 3; p++) {
      const res = await request('GET', `/api/rooms?page=${p}&limit=5`);
      for (const item of res.body.data) {
        assert(!seen.has(item.id), `Duplicate record ${item.id} found across pages`);
        seen.add(item.id);
      }
    }
    assert.strictEqual(seen.size, 15);
  });

  await check('Pagination: page past the end returns 200 with data: []', async () => {
    const res = await request('GET', '/api/rooms?page=4&limit=5');
    assert.strictEqual(res.status, 200);
    assert.deepStrictEqual(res.body.data, []);
    assert.strictEqual(res.body.total, 15);
    assert.strictEqual(res.body.totalPages, 3);
  });

  await check('Pagination: page=0 returns 400', async () => {
    const res = await request('GET', '/api/rooms?page=0');
    assert.strictEqual(res.status, 400);
  });

  await check('Pagination: negative page returns 400', async () => {
    const res = await request('GET', '/api/rooms?page=-2');
    assert.strictEqual(res.status, 400);
  });

  await check('Pagination: non-integer page returns 400', async () => {
    const res = await request('GET', '/api/rooms?page=1.5');
    assert.strictEqual(res.status, 400);
  });

  await check('Pagination: text page returns 400', async () => {
    const res = await request('GET', '/api/rooms?page=two');
    assert.strictEqual(res.status, 400);
  });

  await check('Pagination: limit=0 returns 400', async () => {
    const res = await request('GET', '/api/rooms?limit=0');
    assert.strictEqual(res.status, 400);
  });

  await check('Pagination: limit > 50 returns 400', async () => {
    const res = await request('GET', '/api/rooms?limit=51');
    assert.strictEqual(res.status, 400);
  });

  await check('Pagination: max limit 50 is allowed', async () => {
    const res = await request('GET', '/api/rooms?limit=50');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.limit, 50);
  });

  // --- Group 8: Filter - 10 Checks ---
  await check('Filter: type=Single returns only Single rooms', async () => {
    const res = await request('GET', '/api/rooms?type=Single');
    assert.strictEqual(res.status, 200);
    assert(res.body.data.every(r => r.type === 'Single'));
    assert.strictEqual(res.body.total, 2);
  });

  await check('Filter: available=true returns only available rooms', async () => {
    const res = await request('GET', '/api/rooms?available=true');
    assert.strictEqual(res.status, 200);
    assert(res.body.data.every(r => r.available === true));
    assert.strictEqual(res.body.total, 10);
  });

  await check('Filter: available=false returns only unavailable rooms', async () => {
    const res = await request('GET', '/api/rooms?available=false');
    assert.strictEqual(res.status, 200);
    assert(res.body.data.every(r => r.available === false));
    assert.strictEqual(res.body.total, 5);
  });

  await check('Filter: minPricePerNight=5000 returns rooms with price >= 5000', async () => {
    const res = await request('GET', '/api/rooms?minPricePerNight=5000');
    assert.strictEqual(res.status, 200);
    assert(res.body.data.every(r => r.pricePerNight >= 5000));
  });

  await check('Filter: maxPricePerNight=4000 returns rooms with price <= 4000', async () => {
    const res = await request('GET', '/api/rooms?maxPricePerNight=4000');
    assert.strictEqual(res.status, 200);
    assert(res.body.data.every(r => r.pricePerNight <= 4000));
  });

  await check('Filter: minPricePerNight and maxPricePerNight combined (range inclusive)', async () => {
    const res = await request('GET', '/api/rooms?minPricePerNight=3000&maxPricePerNight=5000');
    assert.strictEqual(res.status, 200);
    assert(res.body.data.every(r => r.pricePerNight >= 3000 && r.pricePerNight <= 5000));
  });

  await check('Filter: invalid type returns 400', async () => {
    const res = await request('GET', '/api/rooms?type=Penthouse');
    assert.strictEqual(res.status, 400);
  });

  await check('Filter: invalid available value returns 400', async () => {
    const res = await request('GET', '/api/rooms?available=yes');
    assert.strictEqual(res.status, 400);
  });

  await check('Filter: invalid minPricePerNight string returns 400', async () => {
    const res = await request('GET', '/api/rooms?minPricePerNight=abc');
    assert.strictEqual(res.status, 400);
  });

  await check('Filter: invalid maxPricePerNight string returns 400', async () => {
    const res = await request('GET', '/api/rooms?maxPricePerNight=xyz');
    assert.strictEqual(res.status, 400);
  });

  // --- Group 9: Search - 8 Checks ---
  await check('Search: search=goa matches Goa in location', async () => {
    const res = await request('GET', '/api/rooms?search=goa');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.total, 2);
    assert(res.body.data.every(r => r.location.toLowerCase().includes('goa') || r.name.toLowerCase().includes('goa')));
  });

  await check('Search: search=suite matches Suite in name', async () => {
    const res = await request('GET', '/api/rooms?search=suite');
    assert.strictEqual(res.status, 200);
    assert(res.body.data.every(r => r.name.toLowerCase().includes('suite') || r.location.toLowerCase().includes('suite')));
  });

  await check('Search: case-insensitivity check (dOwNtOwN matches Downtown)', async () => {
    const res = await request('GET', '/api/rooms?search=dOwNtOwN');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.total, 1);
    assert.strictEqual(res.body.data[0].roomNumber, 'RM-104');
  });

  await check('Search: no match returns 200 with empty list and total: 0', async () => {
    const res = await request('GET', '/api/rooms?search=nonexistentplace12345');
    assert.strictEqual(res.status, 200);
    assert.deepStrictEqual(res.body.data, []);
    assert.strictEqual(res.body.total, 0);
    assert.strictEqual(res.body.totalPages, 0);
  });

  await check('Search: works with pagination', async () => {
    const res = await request('GET', '/api/rooms?search=suite&page=1&limit=2');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.data.length, 2);
    assert(res.body.total > 2);
    assert(res.body.totalPages >= 2);
  });

  await check('Search: second page of search', async () => {
    const res1 = await request('GET', '/api/rooms?search=suite&page=1&limit=2');
    const res2 = await request('GET', '/api/rooms?search=suite&page=2&limit=2');
    assert.strictEqual(res2.status, 200);
    assert.notStrictEqual(res1.body.data[0].id, res2.body.data[0].id);
  });

  await check('Search: search across name or location (Ooty matches)', async () => {
    const res = await request('GET', '/api/rooms?search=ooty');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.total, 2);
  });

  await check('Search: empty search string ?search= returns all records', async () => {
    const res = await request('GET', '/api/rooms?search=');
    assert.strictEqual(res.body.total, 15);
  });

  // --- Group 10: Sort - 6 Checks ---
  await check('Sort: sort=pricePerNight&order=asc sorts ascending by number', async () => {
    const res = await request('GET', '/api/rooms?sort=pricePerNight&order=asc&limit=15');
    for (let i = 0; i < res.body.data.length - 1; i++) {
      assert(res.body.data[i].pricePerNight <= res.body.data[i + 1].pricePerNight);
    }
  });

  await check('Sort: sort=pricePerNight&order=desc sorts descending by number', async () => {
    const res = await request('GET', '/api/rooms?sort=pricePerNight&order=desc&limit=15');
    for (let i = 0; i < res.body.data.length - 1; i++) {
      assert(res.body.data[i].pricePerNight >= res.body.data[i + 1].pricePerNight);
    }
  });

  await check('Sort: sort=name&order=asc sorts ignoring case', async () => {
    const res = await request('GET', '/api/rooms?sort=name&order=asc&limit=15');
    for (let i = 0; i < res.body.data.length - 1; i++) {
      const cmp = res.body.data[i].name.toLowerCase().localeCompare(res.body.data[i + 1].name.toLowerCase());
      assert(cmp <= 0);
    }
  });

  await check('Sort: sort=capacity&order=desc sorts capacity descending', async () => {
    const res = await request('GET', '/api/rooms?sort=capacity&order=desc&limit=15');
    for (let i = 0; i < res.body.data.length - 1; i++) {
      assert(res.body.data[i].capacity >= res.body.data[i + 1].capacity);
    }
  });

  await check('Sort: invalid sort field returns 400', async () => {
    const res = await request('GET', '/api/rooms?sort=banana');
    assert.strictEqual(res.status, 400);
  });

  await check('Sort: invalid order value returns 400', async () => {
    const res = await request('GET', '/api/rooms?sort=name&order=sideways');
    assert.strictEqual(res.status, 400);
  });

  // --- Group 11: Combined queries - 4 Checks ---
  await check('Combined: filter + search + sort + pagination', async () => {
    // Filter available=true, search='suite', sort=pricePerNight desc, page=1, limit=2
    const res = await request('GET', '/api/rooms?available=true&search=suite&sort=pricePerNight&order=desc&page=1&limit=2');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.data.length, 2);
    assert(res.body.data[0].pricePerNight >= res.body.data[1].pricePerNight);
    assert(res.body.data.every(r => r.available === true));
  });

  await check('Combined: minPricePerNight > maxPricePerNight returns 200 with empty list', async () => {
    const res = await request('GET', '/api/rooms?minPricePerNight=10000&maxPricePerNight=5000');
    assert.strictEqual(res.status, 200);
    assert.deepStrictEqual(res.body.data, []);
    assert.strictEqual(res.body.total, 0);
    assert.strictEqual(res.body.totalPages, 0);
  });

  await check('Combined: all filters combined with AND', async () => {
    const res = await request('GET', '/api/rooms?type=Suite&available=true&minPricePerNight=10000');
    assert.strictEqual(res.status, 200);
    assert(res.body.data.every(r => r.type === 'Suite' && r.available === true && r.pricePerNight >= 10000));
  });

  await check('Combined: search with sort ascending by name', async () => {
    const res = await request('GET', '/api/rooms?search=villa&sort=name&order=asc');
    assert.strictEqual(res.status, 200);
    assert(res.body.total >= 1);
  });

  // --- Group 12: HTTP Basics & Edge cases - 4 Checks ---
  await check('HTTP Basics: JSON Content-Type header on responses', async () => {
    const res = await request('GET', '/api/rooms');
    assert(res.headers['content-type'].includes('application/json'));
  });

  await check('HTTP Basics: Unknown route returns 404 with JSON error', async () => {
    const res = await request('GET', '/api/unknown-endpoint');
    assert.strictEqual(res.status, 404);
    assert(res.headers['content-type'].includes('application/json'));
    assert(res.body && res.body.error);
  });

  await check('HTTP Basics: Malformed JSON in POST returns 400 JSON', async () => {
    const res = await request('POST', '/api/rooms', '{"name": "Malformed, unclosed json', {
      'Content-Type': 'application/json'
    });
    assert.strictEqual(res.status, 400);
    assert(res.body && res.body.error);
  });

  await check('HTTP Basics: Unknown query parameter returns 400', async () => {
    const res = await request('GET', '/api/rooms?unknownParam=xyz');
    assert.strictEqual(res.status, 400);
  });

  // Clean up
  server.close();

  console.log('\n========================================');
  console.log(`TOTAL CHECKS: ${passed + failed}`);
  console.log(`PASSED: ${passed}`);
  console.log(`FAILED: ${failed}`);
  console.log('========================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Test run failed unexpectedly:', err);
  process.exit(1);
});
