
# URL Shortener

The Custom URL Shortener API allows users to create short URLs from long, complex URLs, manage these links under specific topics, and view detailed analytics about link performance. The API leverages Google Sign-In for user authentication, includes rate limiting on short url requests, and is dockerized for cloud deployment and scalability.

 

## Run Locally


**STEP1 ->** Rename .env.example to .env and enter the `DATABASE_URL` `CLIENT_SECRET`, `CLIENT_ID`, `VALKEY_URL` , `PORT`

**STEP2 ->** Install dependencies using `bun install` or `npm install`

**STEP3 ->** Generate prisma client using `bun run gen` or `npx prisma gen`

**STEP4 ->** Migrate database schema using `bun run mig` or `npx prisma mig`

**STEP5 ->** Run `bun run dev` or `npm run dev` to start the server



## API Reference

#### 1. Initate Google Login/Register 

```http
  GET /auth/google-auth
```

- **Description:** Initiates the Google Sign-In flow to authenticate the user. The user is redirected to Google’s authentication page.

#### 2. Login/Register user

```http
  GET /auth/google/callback
```
- **Description:** Handles the callback from Google after authentication. On successful authentication, the user is issued an authentication token (e.g., JWT) along with user details.

- **Response:** redirects to `/:userId` on success


#### 3. Create Short URL
```http
  POST /api/shorten/:userId
```
- **Path Parameter:**
  userId (string) -> The userId of user who is requesting.

- **Description:** Creates a new short URL for a provided long URL. Optionally, a user may supply a custom alias and assign a topic for grouping purposes.

- **Request Body**:

      {
        "longUrl": "https://www.example.com/",
        "customAlias": "optional-custom-alias",    // Optional
        "topic": "acquisition"                      // Optional 
      }

- **Response:**
  Success (201 Created):

      {
        "shortUrl": "https://short.ly/abc123",
        "msg": "Url generated successfully",
      }
- **Error Responses:**\
  400 Bad Request: [error :'field is required'].\
  403 Unauthenticated: error: "Unauthenticated, user not found"\
  500 Internal server error


#### 4. Redirect Short URL
```http
  GET /api/shorten/{alias}
```
- **Description:** Redirects to the original long URL associated with the given alias.

- **Path Parameter**: alias (string) ->The unique identifier of the short URL.
- **Response**: Issues an HTTP 302 redirect to the original URL.

- **Error Responses:**\
  404 Not Found: The provided alias does not exist.
  429 Not Found: 'error: "Too many requests"'



#### 5. Get URL Analytics
```http
  GET /api/analytics/{alias}
```
- **Description:** Retrieves detailed analytics for a specific short URL, including overall clicks, unique users, and breakdowns by date, operating system, and device type.

- **Path Parameter**: alias (string) -> The unique alias of the short URL.

- **Response Example**:

      {
        "totalClicks": 150,
        "uniqueUsers": 100,
        "clicksByDate": [{
          "date": "2025-02-10", "clickCount": 30 
        }],
        "osType": [{ 
          "osName": "Windows", "uniqueClicks": 70, "uniqueUsers": 50 
          }],
        "deviceType": [
          { "deviceName": "desktop", "uniqueClicks": 120, "uniqueUsers": 90 },
          { "deviceName": "mobile", "uniqueClicks": 30, "uniqueUsers": 20 }
        ]
      }

- **Error Responses:**\
  404 Not Found: The specified short URL does not exist.\
    403 Unauthenticated: Unauthenticated, user not found.\
     403 Unauthenticated: Unauthenticated,invalid userId.\
     500 Internal Server Error.


#### 6. Get Topic-Based Analytics
````http
GET/api/analytics/topic/{topic}
````
- **Description:** Retrieves aggregated analytics for all short URLs grouped under a specific topic (e.g., acquisition, activation, retention).

- **Path Parameter:**
  topic (string)-> The topic/category for which analytics are       requested.

- **Response Example:**

      {
        "totalClicks": 500,
        "uniqueUsers": 350,
        "clicksByDate": [
          { "date": "2025-02-10", "clickCount": 150 },
          { "date": "2025-02-11", "clickCount": 200 },
          { "date": "2025-02-12", "clickCount": 150 }
        ],
        "urls": [
          {
            "shortUrl": "https://short.ly/abc123",
            "totalClicks": 200,
            "uniqueUsers": 150
          },
          {
            "shortUrl": "https://short.ly/def456",
            "totalClicks": 300,
            "uniqueUsers": 200
          }
        ]
      }
  - **Error Responses:**\
    403 Unauthenticated: Unauthenticated, user not found.\
     403 Unauthenticated: Unauthenticated,invalid userId.\
     500 Internal Server Error.

####  7. Get Overall Analytics
```html
 GET /api/analytics/overall
````
- **Description:** Provides an overall view of the analytics for all short URLs created by the authenticated user, including total URL count, total clicks, unique user counts, and detailed breakdowns.
- **Response Example:**

      {
        "totalUrls": 10,
        "totalClicks": 1200,
        "uniqueUsers": 900,
        "clicksByDate": [
          { "date": "2025-02-10", "clickCount": 300 },
          { "date": "2025-02-11", "clickCount": 400 },
          { "date": "2025-02-12", "clickCount": 500 }
        ],
        "osType": [
          { "osName": "Windows", "uniqueClicks": 600, "uniqueUsers": 450 },
          { "osName": "macOS", "uniqueClicks": 600, "uniqueUsers": 450 }
        ],
        "deviceType": [
          { "deviceName": "desktop", "uniqueClicks": 800, "uniqueUsers": 600 },
          { "deviceName": "mobile", "uniqueClicks": 400, "uniqueUsers": 300 }
        ]
      }

- **Error Responses:**\
    403 Unauthenticated: Unauthenticated, user not found.\
     403 Unauthenticated: Unauthenticated,invalid userId.\
     500 Internal Server Error.


