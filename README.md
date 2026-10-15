# Hotel Rooms API — Assessment Set A5

RESTful Backend API for Hotel Room Inventory management built with Node.js and Express.

---

## 📌 Problem Statement & Architecture

- **Resource**: `rooms`
- **Data Persistence**: **In-memory only** (JavaScript array/list in memory).
- **Initial State**: Starts completely empty on server launch.
- **Port**: Reads from `PORT` environment variable (defaults to `8080`).
- **Protocols & Format**: Pure JSON requests and JSON responses with exact HTTP status codes.

---

## 🛠️ Tech Stack & Setup

- **Runtime**: Node.js (v18+)
- **Framework**: Express.js
- **Testing**: Built-in test suite (`test.js`) with 102 automated checks covering 100% of assessment requirements.

### Installation

```bash
npm install
```

### Running Server

```bash
# Start server on default port 8080
npm start

# Or with custom port
PORT=8080 node index.js
```

### Running Automated Tests

```bash
npm test
```

---

## 📋 Resource Schema (`rooms`)

| Field | Type | Required | Rules & Constraints |
|---|---|---|---|
| `id` | Integer | Server-generated | Read-only. Assigned automatically sequentially (1, 2, ...). Never taken from request body. |
| `name` | String | Yes | Trimmed. Length: 3 to 60 characters. Searchable and sortable. |
| `location` | String | Yes | Trimmed. Length: 2 to 40 characters. Searchable. |
| `type` | String (Enum) | Yes | Exactly one of: `Single`, `Double`, `Suite`, `Deluxe`, `Family` (case-sensitive). Filterable. |
| `pricePerNight` | Number | Yes | Greater than `0` and at most `100000`. Decimals allowed. Range-filterable and sortable. |
| `capacity` | Integer | Yes | Whole integer from `1` to `10`. Sortable. |
| `available` | Boolean | Yes | `true` or `false` (JSON boolean, not string). Filterable. |
| `roomNumber` | String | Yes | 1 to 20 characters. **Unique** across all records (case-insensitive). |

*Note: Unknown fields sent in request bodies are ignored (never stored or returned).*

---

## 🚀 API Endpoints

### 1. Create Room
- **Method**: `POST`
- **Path**: `/api/rooms`
- **Status**: `201 Created`
- **Body**:
```json
{
  "name": "Lake View Deluxe",
  "location": "Ooty",
  "type": "Deluxe",
  "pricePerNight": 4500,
  "capacity": 3,
  "available": true,
  "roomNumber": "R-204"
}
```
- **Response** (`201`):
```json
{
  "id": 1,
  "name": "Lake View Deluxe",
  "location": "Ooty",
  "type": "Deluxe",
  "pricePerNight": 4500,
  "capacity": 3,
  "available": true,
  "roomNumber": "R-204"
}
```

### 2. List Rooms (with Filtering, Search, Sort & Pagination)
- **Method**: `GET`
- **Path**: `/api/rooms`
- **Status**: `200 OK`
- **Query Parameters**:
  - `page`: Positive integer (default `1`).
  - `limit`: Positive integer (default `10`, max `50`).
  - `search`: Case-insensitive partial match on `name` or `location`.
  - `type`: Enum filter (`Single`, `Double`, `Suite`, `Deluxe`, `Family`).
  - `available`: Boolean filter (`true` or `false`).
  - `minPricePerNight`: Lowest price (inclusive, number).
  - `maxPricePerNight`: Highest price (inclusive, number).
  - `sort`: Sort field (`name`, `pricePerNight`, `capacity`).
  - `order`: Sort direction (`asc` default, `desc`).
- **Response** (`200`):
```json
{
  "data": [
    {
      "id": 1,
      "name": "Lake View Deluxe",
      "location": "Ooty",
      "type": "Deluxe",
      "pricePerNight": 4500,
      "capacity": 3,
      "available": true,
      "roomNumber": "R-204"
    }
  ],
  "page": 1,
  "limit": 10,
  "total": 1,
  "totalPages": 1
}
```

### 3. Get Room by ID
- **Method**: `GET`
- **Path**: `/api/rooms/:id`
- **Status**: `200 OK` (or `404 Not Found` if id does not exist)

### 4. Replace Room (Full Update)
- **Method**: `PUT`
- **Path**: `/api/rooms/:id`
- **Status**: `200 OK`
- **Rules**: Requires all fields. `id` cannot be changed. Unknown id returns `404`. Duplicate `roomNumber` returns `409`.

### 5. Partial Update Room
- **Method**: `PATCH`
- **Path**: `/api/rooms/:id`
- **Status**: `200 OK`
- **Rules**: At least one recognized field required (`{}` returns `400`). Fields not sent remain unchanged. `id` cannot be changed. Duplicate `roomNumber` returns `409`.

### 6. Delete Room
- **Method**: `DELETE`
- **Path**: `/api/rooms/:id`
- **Status**: `204 No Content` (empty body)
- **Rules**: Second delete on same id returns `404`.

---

## 🚦 Status Codes & Error Format

All error responses return JSON with `{ "error": "message" }`:

- `200`: Success (Read, List, Update)
- `201`: Created (POST)
- `204`: Deleted (DELETE, empty body)
- `400`: Bad Request (Validation failure, missing fields, malformed JSON, invalid query param)
- `404`: Not Found (Unknown id or unknown route)
- `409`: Conflict (Duplicate `roomNumber` ignoring case)

---

## 🧪 Evaluator Instructions

When running the official evaluation kit:

1. Start this API server on port 8080:
   ```bash
   node index.js
   ```
2. In the assessment kit terminal:
   ```bash
   npm run whoami
   npm run evaluate
   ```
