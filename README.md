# Playlist Converter Documentation

## Table of Contents
1. [Project Overview](#project-overview)
2. [Directory Structure](#directory-structure)
3. [Frontend (Client)](#frontend-client)
4. [Backend (Server)](#backend-server)
5. [Authentication Flow](#authentication-flow)
6. [API Endpoints](#api-endpoints)
7. [Component Documentation](#component-documentation)
8. [Styling](#styling)
9. [Environment Variables](#environment-variables)
10. [Setup and Installation](#setup-and-installation)

## Project Overview
The Playlist Converter is a web application that allows users to convert playlists between different music streaming platforms. The application is built using a React frontend and Node.js backend, with Spotify API integration for authentication and playlist management.

## Directory Structure
```
converter/
├── client/                 # Frontend React application
│   ├── build/             # Production build files
│   ├── public/            # Static files
│   ├── src/               # Source files
│   │   ├── App.js         # Main React component
│   │   ├── App.css        # Main stylesheet
│   │   ├── index.js       # React entry point
│   │   └── index.css      # Global styles
│   └── package.json       # Frontend dependencies
└── server/                # Backend Node.js application
    ├── services/          # Backend services
    ├── index.js           # Server entry point
    ├── .env               # Environment variables
    └── package.json       # Backend dependencies
```

## Frontend (Client)

### Main Components

#### App.js
The main React component that handles the application's core functionality.

**State Management:**
- `playlistUrl`: Stores the input URL from the user
- `isLoading`: Tracks conversion process status
- `error`: Stores error messages
- `result`: Stores conversion results
- `isDarkMode`: Manages theme preference
- `user`: Stores user authentication data

**Key Functions:**
```javascript
handleLogin()
- Purpose: Initiates Spotify authentication
- Flow: 
  1. Calls backend /login endpoint
  2. Redirects to Spotify login page
  3. Handles callback with user tokens

handleSubmit(e)
- Purpose: Processes playlist conversion
- Parameters: event object
- Flow:
  1. Validates user authentication
  2. Sends playlist URL to backend
  3. Updates UI with results or errors

toggleTheme()
- Purpose: Switches between light and dark themes
- Updates: isDarkMode state and body class
```

### Styling (App.css)
The application uses CSS variables for theming and responsive design.

**Theme Variables:**
```css
:root {
  /* Dark theme colors */
  --dark-bg: #1a1b1e
  --dark-text: #ffffff
  /* Light theme colors */
  --light-bg: #ffffff
  --light-text: #000000
}
```

**Key Components Styling:**
- `.converter-form`: Flex container for input group
- `.input-group`: Horizontal alignment of input and button
- `.validation-message`: Error and authentication prompts
- `.theme-toggle`: Theme switching controls

## Backend (Server)

### Server Setup (index.js)
The main server file handles API endpoints and middleware configuration.

**Key Features:**
- CORS configuration for frontend communication
- Express middleware for JSON parsing
- Environment variable management
- Error handling middleware

### API Endpoints

#### Authentication Endpoints
```javascript
GET /login
- Purpose: Initiates Spotify OAuth flow
- Returns: Spotify authorization URL

GET /callback
- Purpose: Handles Spotify OAuth callback
- Parameters: code (query parameter)
- Returns: User tokens and profile data
```

#### Conversion Endpoints
```javascript
POST /convert
- Purpose: Converts playlist between platforms
- Parameters: 
  - url: Source playlist URL
  - accessToken: Spotify access token
- Returns: Converted playlist data
```

## Authentication Flow
1. User clicks "Login with Spotify"
2. Backend generates Spotify authorization URL
3. User authenticates with Spotify
4. Spotify redirects to callback URL
5. Backend exchanges code for access tokens
6. Frontend stores user data and tokens

## Environment Variables

### Server (.env)
```
SPOTIFY_CLIENT_ID=your_client_id
SPOTIFY_CLIENT_SECRET=your_client_secret
REDIRECT_URI=http://localhost:4000/callback
FRONTEND_URI=http://localhost:3000
```

## Setup and Installation

### Frontend Setup
```bash
cd client
npm install
npm start
```

### Backend Setup
```bash
cd server
npm install
npm start
```

### Required Dependencies
Frontend:
- react
- react-dom
- react-scripts

Backend:
- express
- cors
- dotenv
- spotify-web-api-node

## Security Considerations
1. Environment variables for sensitive data
2. CORS configuration for API security
3. Token validation for API requests
4. Secure storage of user credentials

## Error Handling
The application implements comprehensive error handling:
1. Frontend validation for playlist URLs
2. Authentication state verification
3. API error responses with meaningful messages
4. User-friendly error displays

## Performance Optimizations
1. Efficient state management
2. Optimized CSS with CSS variables
3. Responsive design for all screen sizes
4. Lazy loading of components
5. Caching of user data

## Best Practices
1. Component-based architecture
2. Separation of concerns
3. Consistent code formatting
4. Comprehensive error handling
5. Secure authentication flow
6. Responsive design principles
7. Theme consistency
