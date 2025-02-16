
Custom URL Shortener API Documentation
The Custom URL Shortener API allows users to create short URLs from long, complex URLs, manage these links under specific topics, and view detailed analytics about link performance. The API leverages Google Sign-In for user authentication, includes rate limiting on URL creation, and is dockerized for cloud deployment and scalability.

Table of Contents
  Authentication
  Short URL API
  Create Short URL
  Redirect Short URL
  Analytics
  Get URL Analytics
  Get Topic-Based Analytics
  Get Overall Analytics
  Rate Limiting & Error Handling
  Deployment & Scalability
  Authentication
  Google Sign-In
  
Endpoint: /api/auth/google

Method: GET

Description: Initiates the Google Sign-In flow to authenticate the user. The user is redirected to Google’s authentication page.

Endpoint: /api/

Method: GET

Description: Handles the callback from Google after authentication. On successful authentication, the user is issued an authentication token (e.g., JWT) along with user details.

Note: Only Google Sign-In is supported for user authentication.

Short URL API
1. Create Short URL
Endpoint: /api/shorten
Method: POST
Authentication: Required
Rate Limiting: Applied (limits the number of URLs a user can create in a specified timeframe)
Description: Creates a new short URL for a provided long URL. Optionally, a user may supply a custom alias and assign a topic for grouping purposes.
Request Body
json
Copy
Edit
{
  "longUrl": "https://www.example.com/very/long/url/path",
  "customAlias": "optional-custom-alias",    // Optional
  "topic": "acquisition"                      // Optional (e.g., acquisition, activation, retention)
}
Response
Success (201 Created):
json
Copy
Edit
{
  "shortUrl": "https://short.ly/abc123",
  "createdAt": "2025-02-15T12:34:56Z"
}
Error Responses:
400 Bad Request: Missing or invalid parameters.
429 Too Many Requests: Rate limit exceeded.
2. Redirect Short URL
Endpoint: /api/shorten/{alias}
Method: GET
Description: Redirects to the original long URL associated with the given alias. Each redirect is logged for analytics purposes, capturing details such as timestamp, user agent, IP address, and geolocation.
Path Parameter
alias (string): The unique identifier of the short URL.
Response
Behavior: Issues an HTTP 302 redirect to the original URL.

Error Responses:

404 Not Found: The provided alias does not exist.
Analytics
1. Get URL Analytics
Endpoint: /api/analytics/{alias}
Method: GET
Authentication: Required (user must be the owner of the URL)
Description: Retrieves detailed analytics for a specific short URL, including overall clicks, unique users, and breakdowns by date, operating system, and device type.
Path Parameter
alias (string): The unique alias of the short URL.
Response Example
json
Copy
Edit
{
  "totalClicks": 150,
  "uniqueUsers": 100,
  "clicksByDate": [
    { "date": "2025-02-10", "clickCount": 30 },
    { "date": "2025-02-11", "clickCount": 40 },
    { "date": "2025-02-12", "clickCount": 80 }
  ],
  "osType": [
    { "osName": "Windows", "uniqueClicks": 70, "uniqueUsers": 50 },
    { "osName": "macOS", "uniqueClicks": 80, "uniqueUsers": 60 }
  ],
  "deviceType": [
    { "deviceName": "desktop", "uniqueClicks": 120, "uniqueUsers": 90 },
    { "deviceName": "mobile", "uniqueClicks": 30, "uniqueUsers": 20 }
  ]
}
Error Responses:
404 Not Found: The specified short URL does not exist.
401 Unauthorized: User is not authenticated or does not own the URL.
2. Get Topic-Based Analytics
Endpoint: /api/analytics/topic/{topic}
Method: GET
Authentication: Required
Description: Retrieves aggregated analytics for all short URLs grouped under a specific topic (e.g., acquisition, activation, retention).
Path Parameter
topic (string): The topic/category for which analytics are requested.
Response Example
json
Copy
Edit
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
Error Responses:
404 Not Found: No URLs exist under the specified topic.
401 Unauthorized: User is not authenticated or lacks permission.
3. Get Overall Analytics
Endpoint: /api/analytics/overall
Method: GET
Authentication: Required
Description: Provides an overall view of the analytics for all short URLs created by the authenticated user, including total URL count, total clicks, unique user counts, and detailed breakdowns.
Response Example
json
Copy
Edit
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
Error Responses:
401 Unauthorized: User is not authenticated.
Rate Limiting & Error Handling
Rate Limiting
Applied To: Create Short URL (POST /api/shorten)

Description: Limits the number of short URLs a user can create within a specified time window.

Error Response Example (429 Too Many Requests):

json
Copy
Edit
{
  "error": "Rate limit exceeded. Please try again later."
}
General Error Codes
400 Bad Request: Missing or invalid request parameters.
401 Unauthorized: User authentication failure or invalid token.
404 Not Found: The requested resource (short URL, topic, etc.) does not exist.
429 Too Many Requests: Exceeded rate limits.
500 Internal Server Error: Unexpected server-side errors.
Deployment & Scalability
Dockerized: The application is containerized using Docker to simplify deployment and scaling on cloud hosting services.
Scalability: The containerized architecture supports horizontal scaling and efficient load management.
Conclusion
This API delivers a robust solution for creating, managing, and analyzing custom short URLs. With built-in Google Sign-In authentication, advanced analytics tracking, and rate limiting, the system is designed to handle both small-scale and high-traffic scenarios while ensuring security and performance.

Feel free to adapt and extend this documentation based on your implementation details and additional features.