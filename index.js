const express = require('express');

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware for parsing JSON
app.use(express.json());

// In-memory data store
let rooms = [];
let nextId = 1;

// Allowed values and constraints
const ALLOWED_TYPES = new Set(['Single', 'Double', 'Suite', 'Deluxe', 'Family']);
const SORT_FIELDS = new Set(['name', 'pricePerNight', 'capacity']);
const SORT_ORDERS = new Set(['asc', 'desc']);
const ALLOWED_QUERY_PARAMS = new Set([
  'page',
  'limit',
  'search',
  'type',
  'available',
  'minPricePerNight',
  'maxPricePerNight',
  'sort',
  'order'
]);

const RECOGNIZED_FIELDS = [
  'name',
  'location',
  'type',
  'pricePerNight',
  'capacity',
  'available',
  'roomNumber'
];

// Helper: Validation functions
function validateName(val) {
  if (typeof val !== 'string') return null;
  const trimmed = val.trim();
  if (trimmed.length < 3 || trimmed.length > 60) return null;
  return trimmed;
}

function validateLocation(val) {
  if (typeof val !== 'string') return null;
  const trimmed = val.trim();
  if (trimmed.length < 2 || trimmed.length > 40) return null;
  return trimmed;
}

function validateType(val) {
  if (typeof val !== 'string' || !ALLOWED_TYPES.has(val)) return null;
  return val;
}

function validatePricePerNight(val) {
  if (typeof val !== 'number' || !Number.isFinite(val) || isNaN(val)) return null;
  if (val <= 0 || val > 100000) return null;
  return val;
}

function validateCapacity(val) {
  if (typeof val !== 'number' || !Number.isInteger(val)) return null;
  if (val < 1 || val > 10) return null;
  return val;
}

function validateAvailable(val) {
  if (typeof val !== 'boolean') return null;
  return val;
}

function validateRoomNumber(val) {
  if (typeof val !== 'string') return null;
  const trimmed = val.trim();
  if (trimmed.length < 1 || trimmed.length > 20) return null;
  return trimmed;
}

// POST /api/rooms - Create a room
app.post('/api/rooms', (req, res) => {
  if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
    return res.status(400).json({ error: 'Request body must be a JSON object' });
  }

  // Check required fields presence
  for (const field of RECOGNIZED_FIELDS) {
    if (req.body[field] === undefined) {
      return res.status(400).json({ error: `Field '${field}' is required` });
    }
  }

  const name = validateName(req.body.name);
  if (name === null) return res.status(400).json({ error: 'Invalid name' });

  const location = validateLocation(req.body.location);
  if (location === null) return res.status(400).json({ error: 'Invalid location' });

  const type = validateType(req.body.type);
  if (type === null) return res.status(400).json({ error: 'Invalid type' });

  const pricePerNight = validatePricePerNight(req.body.pricePerNight);
  if (pricePerNight === null) return res.status(400).json({ error: 'Invalid pricePerNight' });

  const capacity = validateCapacity(req.body.capacity);
  if (capacity === null) return res.status(400).json({ error: 'Invalid capacity' });

  const available = validateAvailable(req.body.available);
  if (available === null) return res.status(400).json({ error: 'Invalid available' });

  const roomNumber = validateRoomNumber(req.body.roomNumber);
  if (roomNumber === null) return res.status(400).json({ error: 'Invalid roomNumber' });

  // Check roomNumber uniqueness (case-insensitive)
  const isDuplicate = rooms.some(
    r => r.roomNumber.toLowerCase() === roomNumber.toLowerCase()
  );
  if (isDuplicate) {
    return res.status(409).json({ error: 'roomNumber already exists' });
  }

  const newRoom = {
    id: nextId++,
    name,
    location,
    type,
    pricePerNight,
    capacity,
    available,
    roomNumber
  };

  rooms.push(newRoom);
  return res.status(201).json(newRoom);
});

// GET /api/rooms - List records (filters, search, sort, pagination)
app.get('/api/rooms', (req, res) => {
  // Validate query parameter keys
  for (const key of Object.keys(req.query)) {
    if (!ALLOWED_QUERY_PARAMS.has(key)) {
      return res.status(400).json({ error: `Unknown query parameter: ${key}` });
    }
  }

  // 1. Pagination parameters
  let page = 1;
  if (req.query.page !== undefined) {
    const pageStr = String(req.query.page).trim();
    if (!/^[1-9]\d*$/.test(pageStr)) {
      return res.status(400).json({ error: 'page must be a positive integer' });
    }
    page = parseInt(pageStr, 10);
  }

  let limit = 10;
  if (req.query.limit !== undefined) {
    const limitStr = String(req.query.limit).trim();
    if (!/^[1-9]\d*$/.test(limitStr)) {
      return res.status(400).json({ error: 'limit must be a positive integer' });
    }
    limit = parseInt(limitStr, 10);
    if (limit > 50) {
      return res.status(400).json({ error: 'limit cannot exceed 50' });
    }
  }

  // 2. Filter parameters
  if (req.query.type !== undefined) {
    if (!ALLOWED_TYPES.has(req.query.type)) {
      return res.status(400).json({ error: 'Invalid type filter' });
    }
  }

  let filterAvailable = null;
  if (req.query.available !== undefined) {
    if (req.query.available === 'true') {
      filterAvailable = true;
    } else if (req.query.available === 'false') {
      filterAvailable = false;
    } else {
      return res.status(400).json({ error: 'available must be true or false' });
    }
  }

  let minPrice = null;
  if (req.query.minPricePerNight !== undefined) {
    const raw = String(req.query.minPricePerNight).trim();
    const num = Number(raw);
    if (raw === '' || isNaN(num) || !Number.isFinite(num)) {
      return res.status(400).json({ error: 'minPricePerNight must be a number' });
    }
    minPrice = num;
  }

  let maxPrice = null;
  if (req.query.maxPricePerNight !== undefined) {
    const raw = String(req.query.maxPricePerNight).trim();
    const num = Number(raw);
    if (raw === '' || isNaN(num) || !Number.isFinite(num)) {
      return res.status(400).json({ error: 'maxPricePerNight must be a number' });
    }
    maxPrice = num;
  }

  // If minPricePerNight > maxPricePerNight: return empty result with 200
  if (minPrice !== null && maxPrice !== null && minPrice > maxPrice) {
    return res.status(200).json({
      data: [],
      page,
      limit,
      total: 0,
      totalPages: 0
    });
  }

  // 3. Sort parameters
  if (req.query.sort !== undefined) {
    if (!SORT_FIELDS.has(req.query.sort)) {
      return res.status(400).json({ error: 'Invalid sort field' });
    }
  }

  let order = 'asc';
  if (req.query.order !== undefined) {
    if (!SORT_ORDERS.has(req.query.order)) {
      return res.status(400).json({ error: 'order must be asc or desc' });
    }
    order = req.query.order;
  }

  // Search parameter
  let searchTerm = null;
  if (req.query.search !== undefined) {
    searchTerm = String(req.query.search).trim();
  }

  // Start processing pipeline: filters -> search -> sort -> pagination
  let result = [...rooms];

  // Apply filters
  if (req.query.type !== undefined) {
    result = result.filter(r => r.type === req.query.type);
  }

  if (filterAvailable !== null) {
    result = result.filter(r => r.available === filterAvailable);
  }

  if (minPrice !== null) {
    result = result.filter(r => r.pricePerNight >= minPrice);
  }

  if (maxPrice !== null) {
    result = result.filter(r => r.pricePerNight <= maxPrice);
  }

  // Apply search (case-insensitive contains on name or location)
  if (searchTerm && searchTerm.length > 0) {
    const lowerSearch = searchTerm.toLowerCase();
    result = result.filter(
      r =>
        r.name.toLowerCase().includes(lowerSearch) ||
        r.location.toLowerCase().includes(lowerSearch)
    );
  }

  const total = result.length;
  const totalPages = total === 0 ? 0 : Math.ceil(total / limit);

  // Apply sort
  if (req.query.sort !== undefined) {
    const sortField = req.query.sort;
    const mult = order === 'desc' ? -1 : 1;

    result.sort((a, b) => {
      if (sortField === 'name') {
        const cmp = a.name.toLowerCase().localeCompare(b.name.toLowerCase());
        return mult * cmp;
      } else if (sortField === 'pricePerNight') {
        return mult * (a.pricePerNight - b.pricePerNight);
      } else if (sortField === 'capacity') {
        return mult * (a.capacity - b.capacity);
      }
      return 0;
    });
  }

  // Apply pagination
  const startIndex = (page - 1) * limit;
  const data = startIndex >= total ? [] : result.slice(startIndex, startIndex + limit);

  return res.status(200).json({
    data,
    page,
    limit,
    total,
    totalPages
  });
});

// GET /api/rooms/:id - Get one record
app.get('/api/rooms/:id', (req, res) => {
  const room = rooms.find(r => String(r.id) === req.params.id);
  if (!room) {
    return res.status(404).json({ error: 'Room not found' });
  }
  return res.status(200).json(room);
});

// PUT /api/rooms/:id - Replace a record
app.put('/api/rooms/:id', (req, res) => {
  const room = rooms.find(r => String(r.id) === req.params.id);
  if (!room) {
    return res.status(404).json({ error: 'Room not found' });
  }

  if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
    return res.status(400).json({ error: 'Request body must be a JSON object' });
  }

  // All required fields must be present
  for (const field of RECOGNIZED_FIELDS) {
    if (req.body[field] === undefined) {
      return res.status(400).json({ error: `Field '${field}' is required` });
    }
  }

  const name = validateName(req.body.name);
  if (name === null) return res.status(400).json({ error: 'Invalid name' });

  const location = validateLocation(req.body.location);
  if (location === null) return res.status(400).json({ error: 'Invalid location' });

  const type = validateType(req.body.type);
  if (type === null) return res.status(400).json({ error: 'Invalid type' });

  const pricePerNight = validatePricePerNight(req.body.pricePerNight);
  if (pricePerNight === null) return res.status(400).json({ error: 'Invalid pricePerNight' });

  const capacity = validateCapacity(req.body.capacity);
  if (capacity === null) return res.status(400).json({ error: 'Invalid capacity' });

  const available = validateAvailable(req.body.available);
  if (available === null) return res.status(400).json({ error: 'Invalid available' });

  const roomNumber = validateRoomNumber(req.body.roomNumber);
  if (roomNumber === null) return res.status(400).json({ error: 'Invalid roomNumber' });

  // Check roomNumber uniqueness against other rooms
  const isDuplicate = rooms.some(
    r => r.id !== room.id && r.roomNumber.toLowerCase() === roomNumber.toLowerCase()
  );
  if (isDuplicate) {
    return res.status(409).json({ error: 'roomNumber already exists' });
  }

  // Replace record fields (id remains unchanged, unknown fields ignored)
  room.name = name;
  room.location = location;
  room.type = type;
  room.pricePerNight = pricePerNight;
  room.capacity = capacity;
  room.available = available;
  room.roomNumber = roomNumber;

  return res.status(200).json(room);
});

// PATCH /api/rooms/:id - Update some fields
app.patch('/api/rooms/:id', (req, res) => {
  const room = rooms.find(r => String(r.id) === req.params.id);
  if (!room) {
    return res.status(404).json({ error: 'Room not found' });
  }

  if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
    return res.status(400).json({ error: 'Request body must be a JSON object' });
  }

  // Find recognized updatable fields present in body
  const presentFields = RECOGNIZED_FIELDS.filter(field => field in req.body);
  if (presentFields.length === 0) {
    return res.status(400).json({ error: 'At least one recognized field is required' });
  }

  const updates = {};

  if ('name' in req.body) {
    const name = validateName(req.body.name);
    if (name === null) return res.status(400).json({ error: 'Invalid name' });
    updates.name = name;
  }

  if ('location' in req.body) {
    const location = validateLocation(req.body.location);
    if (location === null) return res.status(400).json({ error: 'Invalid location' });
    updates.location = location;
  }

  if ('type' in req.body) {
    const type = validateType(req.body.type);
    if (type === null) return res.status(400).json({ error: 'Invalid type' });
    updates.type = type;
  }

  if ('pricePerNight' in req.body) {
    const pricePerNight = validatePricePerNight(req.body.pricePerNight);
    if (pricePerNight === null) return res.status(400).json({ error: 'Invalid pricePerNight' });
    updates.pricePerNight = pricePerNight;
  }

  if ('capacity' in req.body) {
    const capacity = validateCapacity(req.body.capacity);
    if (capacity === null) return res.status(400).json({ error: 'Invalid capacity' });
    updates.capacity = capacity;
  }

  if ('available' in req.body) {
    const available = validateAvailable(req.body.available);
    if (available === null) return res.status(400).json({ error: 'Invalid available' });
    updates.available = available;
  }

  if ('roomNumber' in req.body) {
    const roomNumber = validateRoomNumber(req.body.roomNumber);
    if (roomNumber === null) return res.status(400).json({ error: 'Invalid roomNumber' });

    // Check duplicate roomNumber across other rooms
    const isDuplicate = rooms.some(
      r => r.id !== room.id && r.roomNumber.toLowerCase() === roomNumber.toLowerCase()
    );
    if (isDuplicate) {
      return res.status(409).json({ error: 'roomNumber already exists' });
    }
    updates.roomNumber = roomNumber;
  }

  // Apply updates (id can never be changed)
  Object.assign(room, updates);

  return res.status(200).json(room);
});

// DELETE /api/rooms/:id - Delete a record
app.delete('/api/rooms/:id', (req, res) => {
  const index = rooms.findIndex(r => String(r.id) === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Room not found' });
  }

  rooms.splice(index, 1);
  return res.status(204).end();
});

// JSON 404 handler for unknown routes
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handling middleware (catches malformed JSON)
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ error: 'Malformed JSON' });
  }
  return res.status(500).json({ error: 'Internal server error' });
});

// Helper function to reset data for tests
function reset() {
  rooms = [];
  nextId = 1;
}

// Start server if run directly
let server = null;
if (require.main === module) {
  server = app.listen(PORT, () => {
    console.log(`Hotel Rooms API server listening on port ${PORT}`);
  });
}

module.exports = { app, reset, getRooms: () => rooms };
