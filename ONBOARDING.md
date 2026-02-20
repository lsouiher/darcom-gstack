# DaryWin - Developer Onboarding Guide

**For developers with C#, JavaScript, and Angular experience**

This document explains how the codebase works, including all flows, dependencies, and architectural patterns. Concepts are mapped to C#/Angular equivalents where applicable.

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Technology Stack Comparison](#2-technology-stack-comparison)
3. [Repository Structure](#3-repository-structure)
4. [Backend Deep Dive](#4-backend-deep-dive)
5. [Frontend Deep Dive](#5-frontend-deep-dive)
6. [Admin Panel](#6-admin-panel)
7. [Mobile App](#7-mobile-app)
8. [Shared Packages](#8-shared-packages)
9. [Data Flow & API Communication](#9-data-flow--api-communication)
10. [Authentication Flow](#10-authentication-flow)
11. [Payment Integration](#11-payment-integration)
12. [Key Patterns Reference](#12-key-patterns-reference)
13. [Development Workflow](#13-development-workflow)

---

## 1. Architecture Overview

DaryWin is a **rental property management platform** built as a TypeScript monorepo with four client applications sharing a common backend:

```
┌─────────────────────────────────────────────────────────────────────┐
│                           CLIENTS                                    │
├──────────────┬──────────────┬──────────────┬───────────────────────┤
│   Frontend   │    Admin     │    Mobile    │   (Future clients)    │
│   (React)    │   (React)    │(React Native)│                       │
│   Port 3004  │  Port 3003   │  Port 8081   │                       │
└──────┬───────┴──────┬───────┴──────┬───────┴───────────────────────┘
       │              │              │
       └──────────────┼──────────────┘
                      │ REST API (JSON)
                      ▼
       ┌──────────────────────────────┐
       │      Backend (Express.js)    │
       │         Port 4004            │
       └──────────────┬───────────────┘
                      │
       ┌──────────────┴───────────────┐
       │                              │
       ▼                              ▼
┌─────────────┐              ┌─────────────────┐
│   MongoDB   │              │ External Services│
│  (Database) │              │ - Stripe/PayPal │
│             │              │ - SMTP (Email)  │
│             │              │ - Sentry        │
└─────────────┘              └─────────────────┘
```

### C#/Angular Equivalent Architecture

| This Project | C# Equivalent |
|--------------|---------------|
| Express.js Backend | ASP.NET Core Web API |
| React Frontend/Admin | Angular SPA |
| React Native Mobile | Xamarin/MAUI |
| MongoDB + Mongoose | Entity Framework + SQL Server |
| JWT Authentication | ASP.NET Core Identity with JWT |

---

## 2. Technology Stack Comparison

### Backend

| Concept | Node.js/Express | C#/ASP.NET Equivalent |
|---------|-----------------|----------------------|
| Web Framework | Express.js | ASP.NET Core |
| ORM/ODM | Mongoose | Entity Framework Core |
| Database | MongoDB (NoSQL) | SQL Server (typically) |
| Dependency Injection | Manual/Constructor | Built-in DI Container |
| Middleware | `app.use()` | Middleware pipeline |
| Controllers | Route handlers | Controller classes |
| Models | Mongoose Schemas | Entity classes |
| Authentication | JWT (jose library) | ASP.NET Identity |
| Configuration | `.env` files | `appsettings.json` |

### Frontend

| Concept | React | Angular Equivalent |
|---------|-------|-------------------|
| Component | Function with hooks | @Component class |
| Template | JSX (inline) | Separate HTML template |
| Styling | CSS files + MUI | SCSS + Angular Material |
| Routing | React Router | Angular Router |
| State Management | Context API | Services + RxJS |
| HTTP Client | Axios | HttpClient |
| Forms | Controlled/Uncontrolled | Reactive Forms |
| Lifecycle | useEffect hook | ngOnInit, ngOnDestroy |
| DI | Context/Props | Constructor injection |

---

## 3. Repository Structure

```
darywin/
├── backend/                 # Node.js REST API
│   ├── src/
│   │   ├── index.ts        # Entry point (like Program.cs)
│   │   ├── app.ts          # Express config (like Startup.cs)
│   │   ├── controllers/    # Business logic (like Controllers/)
│   │   ├── models/         # MongoDB schemas (like Entities/)
│   │   ├── routes/         # Route definitions (like endpoint mapping)
│   │   ├── middlewares/    # Request pipeline (like middleware)
│   │   ├── utils/          # Helper functions
│   │   ├── config/         # Environment config
│   │   ├── payment/        # Stripe/PayPal integration
│   │   └── lang/           # i18n translations
│   └── __tests__/          # Jest tests
│
├── frontend/                # Customer-facing React app
│   ├── src/
│   │   ├── main.tsx        # Entry point
│   │   ├── App.tsx         # Router setup
│   │   ├── pages/          # Route components (like Angular pages)
│   │   ├── components/     # Reusable UI components
│   │   ├── services/       # API service layer (like Angular services)
│   │   ├── context/        # State management (like Angular services)
│   │   ├── lang/           # i18n translations
│   │   └── assets/css/     # Stylesheets
│   └── vite.config.ts      # Build config
│
├── admin/                   # Agency admin React app
│   └── (same structure as frontend)
│
├── mobile/                  # React Native Expo app
│   ├── App.tsx             # Entry point
│   ├── screens/            # Screen components
│   ├── components/         # Reusable components
│   ├── services/           # API layer
│   └── context/            # State management
│
└── packages/                # Shared npm packages
    ├── darywin-types/      # TypeScript interfaces & enums
    ├── darywin-helper/     # Utility functions
    ├── currency-converter/ # Currency conversion
    ├── disable-react-devtools/
    └── reactjs-social-login/
```

---

## 4. Backend Deep Dive

### 4.1 Entry Points

**`backend/src/index.ts`** - Server bootstrap (like `Program.cs`):
```typescript
// 1. Load environment variables
import 'dotenv/config'

// 2. Connect to database
await databaseHelper.connect(env.DB_URI, env.DB_SSL, env.DB_DEBUG)

// 3. Initialize database (indexes, collections)
await databaseHelper.initialize()

// 4. Start HTTP/HTTPS server
const server = env.HTTPS
  ? https.createServer({ key, cert }, app)
  : http.createServer(app)

server.listen(env.PORT)

// 5. Graceful shutdown handlers
process.on('SIGINT', gracefulShutdown)
```

**`backend/src/app.ts`** - Express configuration (like `Startup.cs`):
```typescript
const app = express()

// Middleware pipeline (like ASP.NET middleware)
app.use(helmet())                    // Security headers
app.use(compression())               // Response compression
app.use(express.json({ limit: '50mb' }))
app.use(cookieParser(env.COOKIE_SECRET))
app.use(cors(corsOptions))           // CORS policy
app.use(allowedMethods)              // HTTP method validation

// Route registration (like app.MapControllers())
app.use('/', userRoutes)
app.use('/', propertyRoutes)
app.use('/', bookingRoutes)
app.use('/', countryRoutes)
app.use('/', locationRoutes)
app.use('/', notificationRoutes)
app.use('/', stripeRoutes)
app.use('/', paypalRoutes)
app.use('/', agencyRoutes)
app.use('/', ipinfoRoutes)

// Error tracking
Sentry.setupExpressErrorHandler(app)
```

### 4.2 Request Flow

```
HTTP Request
     │
     ▼
┌─────────────────────────────────────┐
│ Middleware Stack (app.ts)           │
│ - Helmet (security)                 │
│ - CORS (cross-origin)               │
│ - JSON parser                       │
│ - Cookie parser                     │
└─────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────┐
│ Route Handler (routes/*.ts)         │
│ router.post('/api/sign-up', ...)    │
└─────────────────────────────────────┘
     │
     ▼ (if protected route)
┌─────────────────────────────────────┐
│ Auth Middleware (authJwt.ts)        │
│ - Extract JWT from cookie/header   │
│ - Verify signature with jose        │
│ - Attach user to request            │
└─────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────┐
│ Controller Function                  │
│ - Parse request body                 │
│ - Query/mutate MongoDB via Mongoose │
│ - Handle business logic              │
│ - Send JSON response                 │
└─────────────────────────────────────┘
```

### 4.3 Controllers (Like C# Controllers)

Controllers are exported functions that handle HTTP requests:

```typescript
// backend/src/controllers/userController.ts

// C# equivalent: [HttpPost("api/sign-up")]
export const signup = async (req: Request, res: Response) => {
  try {
    const { email, password, fullName } = req.body

    // Hash password (like ASP.NET Identity)
    const passwordHash = await bcrypt.hash(password, 10)

    // Create user (like DbContext.Users.Add())
    const user = new User({
      email: email.toLowerCase(),
      password: passwordHash,
      fullName,
      type: UserType.User,
      verified: false
    })
    await user.save()

    // Create verification token
    const token = new Token({ user: user._id, token: nanoid() })
    await token.save()

    // Send verification email
    await mailHelper.sendMail({
      to: user.email,
      subject: i18n.t('ACCOUNT_ACTIVATION_SUBJECT'),
      html: `...activation link...`
    })

    res.sendStatus(200)
  } catch (err) {
    logger.error('Signup error:', err)
    res.status(400).send(err)
  }
}
```

**C# Comparison:**
```csharp
// ASP.NET equivalent
[HttpPost("api/sign-up")]
public async Task<IActionResult> Signup([FromBody] SignupDto dto)
{
    var passwordHash = _passwordHasher.HashPassword(dto.Password);
    var user = new User { Email = dto.Email, Password = passwordHash };
    await _context.Users.AddAsync(user);
    await _context.SaveChangesAsync();
    await _emailService.SendVerificationEmail(user);
    return Ok();
}
```

### 4.4 Models (Like Entity Classes)

Mongoose schemas define MongoDB document structure:

```typescript
// backend/src/models/User.ts

import mongoose from 'mongoose'
import * as darywinTypes from ':darywin-types'

const userSchema = new mongoose.Schema({
  // Like C# property with [Required] attribute
  email: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  fullName: {
    type: String,
    required: true,
    index: true
  },
  password: {
    type: String,
    required: true
  },
  // Like C# enum
  type: {
    type: String,
    enum: [
      darywinTypes.UserType.Admin,
      darywinTypes.UserType.Agency,
      darywinTypes.UserType.User
    ],
    default: darywinTypes.UserType.User
  },
  // Foreign key reference (like EF navigation property)
  agency: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'  // References another User document
  },
  verified: { type: Boolean, default: false },
  avatar: String,
  // TTL index - auto-delete after expiration
  expireAt: { type: Date, index: { expires: 0 } }
}, { timestamps: true })  // Adds createdAt, updatedAt

// Create compound indexes for queries
userSchema.index({ type: 1, expireAt: 1, email: 1 })

export const User = mongoose.model('User', userSchema)
```

**C# Comparison:**
```csharp
// Entity Framework equivalent
public class User
{
    [Key]
    public string Id { get; set; }

    [Required, EmailAddress]
    public string Email { get; set; }

    [Required]
    public string FullName { get; set; }

    [Required]
    public string Password { get; set; }

    public UserType Type { get; set; } = UserType.User;

    // Navigation property
    public User? Agency { get; set; }
    public string? AgencyId { get; set; }

    public bool Verified { get; set; }
    public string? Avatar { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
```

### 4.5 Database Relationships

```
┌─────────────┐     ┌─────────────────┐     ┌───────────────┐
│   Country   │◄────│    Location     │◄────│   Property    │
└─────────────┘     └─────────────────┘     └───────┬───────┘
                           │                        │
                           │                        │
                    ┌──────┴──────┐                │
                    │LocationValue│                │
                    │ (per lang)  │                │
                    └─────────────┘                │
                                                   │
┌─────────────┐                            ┌──────┴───────┐
│    User     │◄───────────────────────────│   Booking    │
│ (renter)    │                            └──────────────┘
└──────┬──────┘                                    │
       │                                           │
       │ (if agency)                               │
       ▼                                           │
┌─────────────┐                                    │
│    User     │◄───────────────────────────────────┘
│  (agency)   │
└─────────────┘
```

### 4.6 Routes (Like Endpoint Mapping)

```typescript
// backend/src/routes/userRoutes.ts
import express from 'express'
import * as userController from '../controllers/userController'
import * as authJwt from '../middlewares/authJwt'

const router = express.Router()

// Public routes (no auth required)
router.post('/api/sign-up', userController.signup)
router.post('/api/sign-in/:type', userController.signin)
router.get('/api/confirm-email/:email/:token', userController.confirmEmail)

// Protected routes (require valid JWT)
router.get('/api/user/:id', authJwt.verifyToken, userController.getUser)
router.put('/api/update-user', authJwt.verifyToken, userController.update)
router.post('/api/change-password', authJwt.verifyToken, userController.changePassword)

// Admin-only routes
router.delete('/api/delete-user/:id', authJwt.verifyToken, userController.deleteUser)

export default router
```

**C# Comparison:**
```csharp
// ASP.NET equivalent
[ApiController]
[Route("api")]
public class UserController : ControllerBase
{
    [HttpPost("sign-up")]
    public Task<IActionResult> Signup(...) { }

    [HttpPost("sign-in/{type}")]
    public Task<IActionResult> Signin(...) { }

    [Authorize]  // Requires authentication
    [HttpGet("user/{id}")]
    public Task<IActionResult> GetUser(string id) { }

    [Authorize(Roles = "Admin")]  // Admin only
    [HttpDelete("delete-user/{id}")]
    public Task<IActionResult> DeleteUser(string id) { }
}
```

### 4.7 Middleware (Like ASP.NET Middleware)

```typescript
// backend/src/middlewares/authJwt.ts

export const verifyToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // 1. Detect client type by origin header
  const isAdmin = req.headers.origin === env.ADMIN_HOST
  const isFrontend = req.headers.origin === env.FRONTEND_HOST

  // 2. Extract token from appropriate location
  let token: string
  if (isAdmin) {
    token = req.signedCookies[env.ADMIN_AUTH_COOKIE_NAME]
  } else if (isFrontend) {
    token = req.signedCookies[env.FRONTEND_AUTH_COOKIE_NAME]
  } else {
    // Mobile app uses header
    token = req.headers[env.X_ACCESS_TOKEN] as string
  }

  if (!token) {
    return res.sendStatus(403)  // Forbidden
  }

  // 3. Decrypt and verify JWT
  try {
    const sessionData = await authHelper.decryptJWT(token)

    // 4. Verify user exists in database
    const user = await User.findById(sessionData.id)
    if (!user) {
      return res.sendStatus(401)  // Unauthorized
    }

    // 5. Attach user to request for use in controllers
    req.user = user
    next()  // Continue to controller
  } catch (err) {
    return res.sendStatus(401)
  }
}
```

**C# Comparison:**
```csharp
// ASP.NET middleware equivalent
public class JwtMiddleware
{
    private readonly RequestDelegate _next;

    public async Task InvokeAsync(HttpContext context)
    {
        var token = context.Request.Cookies["auth_token"];
        if (token != null)
        {
            var userId = ValidateToken(token);
            context.Items["User"] = await _userService.GetById(userId);
        }
        await _next(context);
    }
}
```

---

## 5. Frontend Deep Dive

### 5.1 React vs Angular Concepts

| Angular | React Equivalent | Example |
|---------|------------------|---------|
| `@Component()` | Function component | `function Header() {}` |
| `@Injectable()` Service | Context + Hooks | `UserContext`, `useContext()` |
| `ngOnInit` | `useEffect(() => {}, [])` | Run once on mount |
| `ngOnDestroy` | `useEffect` cleanup | `return () => cleanup()` |
| `@Input()` | Props | `function Card({ title })` |
| `@Output()` EventEmitter | Callback props | `onChange={(val) => ...}` |
| `*ngFor` | `.map()` | `{items.map(i => <Item />)}` |
| `*ngIf` | Conditional | `{show && <Component />}` |
| `[(ngModel)]` | useState | `const [val, setVal] = useState()` |
| RxJS Observable | Promise/async-await | `await service.getData()` |
| HttpClient | Axios | `axios.get('/api/data')` |
| Router | React Router | `<Route path="/" element={<Home />}>` |
| Route Guards | Layout component | Wrapper checks auth before render |

### 5.2 Entry Point

**`frontend/src/main.tsx`**:
```typescript
import { createRoot } from 'react-dom/client'
import { createTheme, ThemeProvider } from '@mui/material/styles'
import App from './App'

// Configure Material-UI theme (like Angular Material theming)
const theme = createTheme({
  palette: {
    primary: { main: '#1a1a1a' }
  },
  components: {
    // Component overrides
  }
})

// Initialize language from URL, localStorage, or IP detection
const lang = getInitialLanguage()
setLanguage(lang)

// Mount React app
createRoot(document.getElementById('root')!)
  .render(
    <ThemeProvider theme={theme}>
      <App />
    </ThemeProvider>
  )
```

### 5.3 Routing

**`frontend/src/App.tsx`**:
```typescript
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { lazy, Suspense } from 'react'

// Lazy load pages for code splitting
const Home = lazy(() => import('./pages/Home'))
const Search = lazy(() => import('./pages/Search'))
const SignIn = lazy(() => import('./pages/SignIn'))

// Define routes (like Angular RouterModule.forRoot([...]))
const router = createBrowserRouter([
  {
    element: <AppLayout />,  // Like Angular's layout component
    children: [
      { path: '/', element: <Home /> },
      { path: '/search', element: <Search /> },
      { path: '/sign-in', element: <SignIn /> },
      { path: '/property', element: <Property /> },
      { path: '/checkout', element: <Checkout /> },
      { path: '/bookings', element: <Bookings /> },
      { path: '*', element: <NoMatch /> }  // 404
    ]
  }
])

export default function App() {
  return (
    <Suspense fallback={<Loading />}>
      <RouterProvider router={router} />
    </Suspense>
  )
}
```

**Angular Comparison:**
```typescript
// Angular routing equivalent
const routes: Routes = [
  {
    path: '',
    component: AppLayoutComponent,
    children: [
      { path: '', component: HomeComponent },
      { path: 'search', component: SearchComponent },
      { path: 'sign-in', component: SignInComponent },
      { path: '**', component: NotFoundComponent }
    ]
  }
];
```

### 5.4 Components

**React Component Pattern:**
```typescript
// frontend/src/components/Header.tsx

import { useState, useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { UserContext } from '../context/UserContext'
import * as UserService from '../services/UserService'

// Interface for props (like Angular @Input)
interface HeaderProps {
  title?: string
  onMenuClick?: () => void
}

// Functional component (like Angular @Component)
function Header({ title, onMenuClick }: HeaderProps) {
  // State (like Angular class properties)
  const [menuOpen, setMenuOpen] = useState(false)

  // Context (like Angular injected service)
  const { user, setUser } = useContext(UserContext)

  // Router (like Angular Router)
  const navigate = useNavigate()

  // Event handler (like Angular methods)
  const handleLogout = async () => {
    await UserService.signout()
    setUser(null)
    navigate('/')
  }

  // JSX template (like Angular template, but inline)
  return (
    <header className="header">
      <h1>{title}</h1>

      {/* Conditional rendering (like *ngIf) */}
      {user ? (
        <button onClick={handleLogout}>Logout</button>
      ) : (
        <button onClick={() => navigate('/sign-in')}>Login</button>
      )}
    </header>
  )
}

export default Header
```

**Angular Comparison:**
```typescript
// Angular equivalent
@Component({
  selector: 'app-header',
  template: `
    <header class="header">
      <h1>{{title}}</h1>
      <button *ngIf="user" (click)="handleLogout()">Logout</button>
      <button *ngIf="!user" (click)="goToLogin()">Login</button>
    </header>
  `
})
export class HeaderComponent {
  @Input() title: string;
  @Output() menuClick = new EventEmitter<void>();

  user: User;

  constructor(
    private userService: UserService,
    private router: Router
  ) {}

  async handleLogout() {
    await this.userService.signout();
    this.router.navigate(['/']);
  }
}
```

### 5.5 State Management (Context = Angular Services)

**`frontend/src/context/UserContext.tsx`**:
```typescript
import { createContext, useState, useEffect, useCallback } from 'react'
import * as UserService from '../services/UserService'

// Define context shape (like Angular service interface)
interface UserContextType {
  user: User | null
  setUser: (user: User | null) => void
  userLoaded: boolean
}

// Create context (like Angular @Injectable service)
export const UserContext = createContext<UserContextType>(null!)

// Provider component (wraps app to provide state)
export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [userLoaded, setUserLoaded] = useState(false)

  // Check authentication on mount (like Angular APP_INITIALIZER)
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const status = await UserService.validateAccessToken()
        if (status === 200) {
          const userData = await UserService.getUser()
          setUser(userData)
        }
      } catch {
        setUser(null)
      } finally {
        setUserLoaded(true)
      }
    }
    checkAuth()
  }, [])

  // Memoized value to prevent unnecessary re-renders
  const value = useMemo(() => ({
    user,
    setUser,
    userLoaded
  }), [user, userLoaded])

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  )
}
```

**Usage in Components:**
```typescript
// Like Angular's constructor injection
function SomeComponent() {
  const { user, setUser } = useContext(UserContext)

  if (!user) return <Navigate to="/sign-in" />
  return <div>Welcome, {user.fullName}</div>
}
```

### 5.6 Services (API Layer)

**`frontend/src/services/UserService.ts`**:
```typescript
import axiosInstance from './axiosInstance'
import * as darywinTypes from ':darywin-types'

// Like Angular HttpClient service methods

export const signup = (data: darywinTypes.SignUpPayload): Promise<number> =>
  axiosInstance
    .post('/api/sign-up', data)
    .then(res => res.status)

export const signin = (data: darywinTypes.SignInPayload): Promise<{ status: number; data: darywinTypes.User }> =>
  axiosInstance
    .post('/api/sign-in/frontend', data, { withCredentials: true })
    .then(res => ({ status: res.status, data: res.data }))

export const signout = (): Promise<number> =>
  axiosInstance
    .post('/api/sign-out', null, { withCredentials: true })
    .then(res => res.status)

export const getUser = (id: string): Promise<darywinTypes.User> =>
  axiosInstance
    .get(`/api/user/${id}`, { withCredentials: true })
    .then(res => res.data)

export const validateAccessToken = (): Promise<number> =>
  axiosInstance
    .post('/api/validate-access-token', null, { withCredentials: true })
    .then(res => res.status)
```

**Angular Comparison:**
```typescript
// Angular HttpClient equivalent
@Injectable({ providedIn: 'root' })
export class UserService {
  constructor(private http: HttpClient) {}

  signup(data: SignUpPayload): Observable<number> {
    return this.http.post('/api/sign-up', data)
      .pipe(map(res => res.status));
  }

  signin(data: SignInPayload): Observable<User> {
    return this.http.post<User>('/api/sign-in/frontend', data,
      { withCredentials: true });
  }

  getUser(id: string): Observable<User> {
    return this.http.get<User>(`/api/user/${id}`,
      { withCredentials: true });
  }
}
```

### 5.7 Pages (Like Angular Page Components)

**`frontend/src/pages/Search.tsx`**:
```typescript
import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import Layout from '../components/Layout'
import PropertyList from '../components/PropertyList'
import PropertyFilter from '../components/PropertyFilter'
import * as PropertyService from '../services/PropertyService'

function Search() {
  // Get navigation state (like Angular ActivatedRoute data)
  const location = useLocation()
  const state = location.state as SearchState

  // Local state
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<PropertyFilter>(state?.filter || {})

  // Fetch data on filter change (like Angular ngOnChanges)
  useEffect(() => {
    const fetchProperties = async () => {
      setLoading(true)
      try {
        const data = await PropertyService.getProperties(filter)
        setProperties(data)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchProperties()
  }, [filter])

  // Layout wrapper handles auth check
  return (
    <Layout strict={false}>
      <div className="search-page">
        <PropertyFilter
          value={filter}
          onChange={setFilter}  // Like Angular (filterChange)
        />
        <PropertyList
          properties={properties}
          loading={loading}
        />
      </div>
    </Layout>
  )
}

export default Search
```

### 5.8 Lifecycle Comparison

| Angular | React Hook | When |
|---------|------------|------|
| `constructor` | `useState` initial value | Component creation |
| `ngOnInit` | `useEffect(() => {}, [])` | After first render |
| `ngOnChanges` | `useEffect(() => {}, [dep])` | When dependencies change |
| `ngOnDestroy` | `useEffect` return cleanup | Before unmount |
| `ngAfterViewInit` | `useLayoutEffect` | After DOM update |

```typescript
function MyComponent({ userId }) {
  // Like constructor - initialize state
  const [data, setData] = useState(null)

  // Like ngOnInit - runs once after mount
  useEffect(() => {
    console.log('Component mounted')
    return () => console.log('Component unmounting')  // ngOnDestroy
  }, [])

  // Like ngOnChanges - runs when userId changes
  useEffect(() => {
    if (userId) {
      fetchData(userId)
    }
  }, [userId])

  return <div>{data}</div>
}
```

---

## 6. Admin Panel

The admin panel shares the same architecture as frontend but with additional features for agency management.

### 6.1 Key Differences from Frontend

| Aspect | Frontend | Admin |
|--------|----------|-------|
| **Users** | Customers | Agencies, Super-admins |
| **Purpose** | Book properties | Manage properties, bookings, users |
| **Auth Level** | User role | Agency or Admin role |
| **Unique Pages** | Checkout, Payment | Scheduler, CRUD pages |
| **Port** | 3004 | 3003 |

### 6.2 Admin-Only Pages

```
/agencies              # List all agencies (super-admin)
/create-agency         # Create new agency
/update-agency/:id     # Edit agency
/users                 # User management
/create-user           # Create user
/countries             # Country management
/locations             # Location management
/create-property       # Create property
/update-property/:id   # Edit property
/scheduler             # Booking calendar view
/property-bookings/:id # Bookings for specific property
```

### 6.3 Role-Based Access

```typescript
// Admin Layout checks user role
function Layout({ admin, children }) {
  const { user } = useContext(UserContext)

  useEffect(() => {
    if (admin && user?.type !== UserType.Admin) {
      setUnauthorized(true)  // Show 403 page
    }
  }, [user, admin])

  if (unauthorized) return <Unauthorized />
  return <>{children}</>
}

// Usage
<Layout admin>  {/* Only admins can access */}
  <AgencyManagement />
</Layout>
```

### 6.4 Property Scheduler Component

The admin panel includes a complex calendar scheduler for viewing bookings:

```
scheduler/
├── index.tsx              # Main export with StoreProvider
├── SchedulerComponent.tsx # Core rendering
├── store/                 # Redux-like state management
│   ├── provider.tsx       # Context provider
│   ├── types.ts          # TypeScript interfaces
│   └── default.ts        # Initial state
├── views/                 # Calendar views
│   ├── Month.tsx
│   ├── Week.tsx
│   ├── Day.tsx
│   └── Editor.tsx        # Event editing modal
├── components/           # Sub-components
│   ├── nav/              # Navigation buttons
│   ├── events/           # Event rendering
│   └── common/           # Shared utilities
└── hooks/                # Custom hooks
    ├── useStore.ts
    └── useDragAttributes.ts
```

---

## 7. Mobile App

### 7.1 React Native vs React Web

| React Web | React Native | Notes |
|-----------|--------------|-------|
| `<div>` | `<View>` | Container element |
| `<span>` | `<Text>` | Text must be in Text component |
| `<button>` | `<Pressable>` | Touchable elements |
| `<input>` | `<TextInput>` | Text input |
| `<img>` | `<Image>` | Images |
| CSS files | `StyleSheet.create()` | Styles are JS objects |
| React Router | React Navigation | Different navigation paradigm |
| localStorage | AsyncStorage | Async key-value storage |

### 7.2 Navigation Structure

```typescript
// Mobile uses Drawer navigation (slide-out menu)
// Like Angular sidebar navigation

App.tsx
└── GlobalProvider
    └── AuthProvider
        └── SafeAreaProvider
            └── StripeProvider
                └── NavigationWrapper
                    └── DrawerNavigator
                        ├── HomeScreen
                        ├── SearchScreen
                        ├── BookingsScreen
                        ├── SettingsScreen
                        └── ...more screens
```

### 7.3 Screen Components

```typescript
// mobile/screens/HomeScreen.tsx

import { View, ScrollView, StyleSheet } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import Layout from '../components/Layout'
import SearchForm from '../components/SearchForm'

function HomeScreen() {
  const navigation = useNavigation()

  const handleSearch = (filter: PropertyFilter) => {
    // Navigate with params (like Angular router.navigate)
    navigation.navigate('Search', { filter })
  }

  return (
    <Layout>
      <ScrollView style={styles.container}>
        <SearchForm onSubmit={handleSearch} />
      </ScrollView>
    </Layout>
  )
}

// Styles (like Angular component styles, but as JS)
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff'
  }
})

export default HomeScreen
```

---

## 8. Shared Packages

### 8.1 darywin-types

Central TypeScript definitions shared across all apps:

```typescript
// packages/darywin-types/index.ts

// Enums (like C# enums)
export enum UserType {
  Admin = 'admin',
  Agency = 'agency',
  User = 'user'
}

export enum BookingStatus {
  Void = 'void',
  Pending = 'pending',
  Deposit = 'deposit',
  Paid = 'paid',
  Reserved = 'reserved',
  Cancelled = 'cancelled'
}

export enum PropertyType {
  Apartment = 'apartment',
  House = 'house',
  Commercial = 'commercial',
  // ...more types
}

// Interfaces (like C# DTOs/Models)
export interface User {
  _id: string
  email: string
  fullName: string
  type: UserType
  verified: boolean
  avatar?: string
  agency?: User | string
}

export interface Property {
  _id: string
  name: string
  type: PropertyType
  agency: User | string
  location: Location | string
  price: number
  bedrooms: number
  // ...more fields
}

// API Payloads (like C# request DTOs)
export interface SignUpPayload {
  email: string
  password: string
  fullName: string
  language: string
}

export interface CreatePropertyPayload {
  name: string
  type: PropertyType
  agency: string
  location: string
  // ...more fields
}
```

### 8.2 darywin-helper

Shared utility functions:

```typescript
// packages/darywin-helper/index.ts

// Format price with currency
export const formatPrice = (
  price: number,
  currency: string,
  language: string
): string => {
  const symbol = getCurrencySymbol(currency)
  const formatted = formatNumber(price, language)

  return currencyRTL(symbol)
    ? `${formatted} ${symbol}`
    : `${symbol}${formatted}`
}

// Calculate rental price based on term
export const calculateTotalPrice = (
  property: Property,
  from: Date,
  to: Date
): number => {
  const days = daysBetween(from, to)

  switch (property.rentalTerm) {
    case RentalTerm.Daily:
      return property.price * days
    case RentalTerm.Weekly:
      return property.price * Math.ceil(days / 7)
    case RentalTerm.Monthly:
      return property.price * Math.ceil(days / 30)
    case RentalTerm.Yearly:
      return property.price * Math.ceil(days / 365)
  }
}
```

### 8.3 Package Usage

All apps import shared packages via TypeScript path aliases:

```typescript
// In any app file
import * as darywinTypes from ':darywin-types'
import * as darywinHelper from ':darywin-helper'

// Use types
const user: darywinTypes.User = { ... }
const status: darywinTypes.BookingStatus = darywinTypes.BookingStatus.Paid

// Use helpers
const price = darywinHelper.formatPrice(100, 'USD', 'en')
```

---

## 9. Data Flow & API Communication

### 9.1 Complete Request Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    FRONTEND/ADMIN/MOBILE                        │
├─────────────────────────────────────────────────────────────────┤
│  Component                                                       │
│  ┌─────────────────────────────────────────┐                    │
│  │ const handleSubmit = async () => {      │                    │
│  │   const result = await BookingService   │───┐                │
│  │     .checkout(payload)                  │   │                │
│  │   if (result.status === 200) {...}      │   │                │
│  │ }                                       │   │                │
│  └─────────────────────────────────────────┘   │                │
│                                                │                │
│  Service Layer                                 │                │
│  ┌─────────────────────────────────────────┐   │                │
│  │ // BookingService.ts                    │   │                │
│  │ export const checkout = (data) =>       │◄──┘                │
│  │   axiosInstance.post('/api/checkout',   │                    │
│  │     data, { withCredentials: true })    │──────────┐         │
│  └─────────────────────────────────────────┘          │         │
└───────────────────────────────────────────────────────┼─────────┘
                                                        │
                                                        │ HTTP POST
                                                        │ Cookie: JWT
                                                        ▼
┌───────────────────────────────────────────────────────────────────┐
│                         BACKEND                                    │
├───────────────────────────────────────────────────────────────────┤
│  Route                                                             │
│  ┌──────────────────────────────────────────────────┐             │
│  │ router.post('/api/checkout',                     │             │
│  │   authJwt.verifyToken,  // Middleware           │             │
│  │   bookingController.checkout)                    │             │
│  └──────────────────────────────────────────────────┘             │
│                           │                                        │
│                           ▼                                        │
│  Middleware (authJwt.ts)                                          │
│  ┌──────────────────────────────────────────────────┐             │
│  │ 1. Extract JWT from cookie                       │             │
│  │ 2. Verify signature with jose                    │             │
│  │ 3. Find user in MongoDB                          │             │
│  │ 4. Attach user to req.user                       │             │
│  │ 5. Call next()                                   │             │
│  └──────────────────────────────────────────────────┘             │
│                           │                                        │
│                           ▼                                        │
│  Controller (bookingController.ts)                                │
│  ┌──────────────────────────────────────────────────┐             │
│  │ 1. Parse request body                            │             │
│  │ 2. Validate input                                │             │
│  │ 3. Create Stripe checkout session                │             │
│  │ 4. Create temporary Booking document             │             │
│  │ 5. Return { sessionId, bookingId }               │             │
│  └──────────────────────────────────────────────────┘             │
│                           │                                        │
│                           ▼                                        │
│  Model (Booking.ts)                                               │
│  ┌──────────────────────────────────────────────────┐             │
│  │ const booking = new Booking({ ... })             │             │
│  │ await booking.save() // MongoDB insert           │             │
│  └──────────────────────────────────────────────────┘             │
└───────────────────────────────────────────────────────────────────┘
                                                        │
                                                        │ JSON Response
                                                        ▼
┌───────────────────────────────────────────────────────────────────┐
│  Component receives response, updates UI                          │
│  navigate(`/checkout-session/${result.sessionId}`)                │
└───────────────────────────────────────────────────────────────────┘
```

---

## 10. Authentication Flow

### 10.1 Signup Flow

```
┌────────────┐    ┌─────────────┐    ┌──────────────┐    ┌───────────┐
│  Frontend  │    │   Backend   │    │   MongoDB    │    │   SMTP    │
└─────┬──────┘    └──────┬──────┘    └──────┬───────┘    └─────┬─────┘
      │                  │                   │                  │
      │ POST /api/sign-up                    │                  │
      │ {email, password,│fullName}          │                  │
      │─────────────────>│                   │                  │
      │                  │                   │                  │
      │                  │ Hash password     │                  │
      │                  │ (bcrypt)          │                  │
      │                  │                   │                  │
      │                  │ Insert User       │                  │
      │                  │──────────────────>│                  │
      │                  │                   │                  │
      │                  │ Insert Token      │                  │
      │                  │ (verification)    │                  │
      │                  │──────────────────>│                  │
      │                  │                   │                  │
      │                  │ Send verification email              │
      │                  │────────────────────────────────────>│
      │                  │                   │                  │
      │     200 OK       │                   │                  │
      │<─────────────────│                   │                  │
      │                  │                   │                  │
```

### 10.2 Signin Flow

```
┌────────────┐    ┌─────────────┐    ┌──────────────┐
│  Frontend  │    │   Backend   │    │   MongoDB    │
└─────┬──────┘    └──────┬──────┘    └──────┬───────┘
      │                  │                   │
      │ POST /api/sign-in/frontend           │
      │ {email, password}│                   │
      │─────────────────>│                   │
      │                  │                   │
      │                  │ Find user by email│
      │                  │──────────────────>│
      │                  │                   │
      │                  │ Verify password   │
      │                  │ (bcrypt.compare)  │
      │                  │                   │
      │                  │ Generate JWT      │
      │                  │ (jose sign)       │
      │                  │                   │
      │  200 OK          │                   │
      │  Set-Cookie: auth_token=JWT          │
      │  Body: User object                   │
      │<─────────────────│                   │
      │                  │                   │
      │ Store user in    │                   │
      │ UserContext      │                   │
      │                  │                   │
```

### 10.3 Authenticated Request Flow

```
┌────────────┐    ┌─────────────┐    ┌──────────────┐
│  Frontend  │    │   Backend   │    │   MongoDB    │
└─────┬──────┘    └──────┬──────┘    └──────┬───────┘
      │                  │                   │
      │ GET /api/user/123                    │
      │ Cookie: auth_token=JWT               │
      │─────────────────>│                   │
      │                  │                   │
      │        ┌─────────┴─────────┐         │
      │        │ authJwt.verifyToken         │
      │        │ 1. Extract JWT from cookie  │
      │        │ 2. Verify signature         │
      │        │ 3. Decode payload: {id}     │
      │        │ 4. Find user by id ─────────│──>
      │        │ 5. Attach to req.user       │<──
      │        └─────────┬─────────┘         │
      │                  │                   │
      │                  │ Controller runs   │
      │                  │──────────────────>│
      │                  │                   │
      │     200 OK       │                   │
      │     {user data}  │                   │
      │<─────────────────│                   │
      │                  │                   │
```

---

## 11. Payment Integration

### 11.1 Stripe Checkout Flow

```
┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐
│ Frontend │   │ Backend  │   │  Stripe  │   │ MongoDB  │
└────┬─────┘   └────┬─────┘   └────┬─────┘   └────┬─────┘
     │              │              │              │
     │ POST /api/checkout          │              │
     │ {property, dates, user}     │              │
     │─────────────>│              │              │
     │              │              │              │
     │              │ Create temp booking         │
     │              │────────────────────────────>│
     │              │              │              │
     │              │ Create checkout session     │
     │              │─────────────>│              │
     │              │              │              │
     │              │ {sessionId}  │              │
     │              │<─────────────│              │
     │              │              │              │
     │ {sessionId,  │              │              │
     │  bookingId}  │              │              │
     │<─────────────│              │              │
     │              │              │              │
     │ Redirect to Stripe Checkout │              │
     │────────────────────────────>│              │
     │              │              │              │
     │ (User pays on Stripe)       │              │
     │              │              │              │
     │ Redirect back to app        │              │
     │<────────────────────────────│              │
     │              │              │              │
     │ GET /api/check-checkout-session            │
     │ {sessionId}  │              │              │
     │─────────────>│              │              │
     │              │              │              │
     │              │ Verify session status       │
     │              │─────────────>│              │
     │              │              │              │
     │              │ Update booking status       │
     │              │ (Pending → Paid)            │
     │              │────────────────────────────>│
     │              │              │              │
     │ {success}    │              │              │
     │<─────────────│              │              │
```

### 11.2 Payment Service Code

```typescript
// Backend: controllers/stripeController.ts

export const createCheckoutSession = async (req, res) => {
  const { propertyId, from, to, renter } = req.body

  // Calculate price
  const property = await Property.findById(propertyId)
  const price = darywinHelper.calculateTotalPrice(property, from, to)

  // Create Stripe session
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [{
      price_data: {
        currency: 'usd',
        product_data: { name: property.name },
        unit_amount: price * 100  // Stripe uses cents
      },
      quantity: 1
    }],
    mode: 'payment',
    success_url: `${env.FRONTEND_HOST}/checkout-session/{CHECKOUT_SESSION_ID}`,
    cancel_url: `${env.FRONTEND_HOST}/checkout?cancelled=true`
  })

  // Create temporary booking (expires if not paid)
  const booking = new Booking({
    property: propertyId,
    renter,
    from,
    to,
    status: BookingStatus.Pending,
    sessionId: session.id,
    expireAt: new Date(Date.now() + 3600000)  // 1 hour TTL
  })
  await booking.save()

  res.json({ sessionId: session.id, bookingId: booking._id })
}
```

---

## 12. Key Patterns Reference

### 12.1 Pattern Comparison

| Pattern | Angular | This Codebase |
|---------|---------|---------------|
| Component | `@Component` class | Function with hooks |
| Service | `@Injectable` class | Module with exported functions |
| State | Service + RxJS | Context + useState |
| API calls | HttpClient Observable | Axios Promise |
| Routing | RouterModule | React Router |
| Guards | CanActivate | Layout wrapper component |
| Forms | ReactiveForms | Controlled inputs + useState |
| DI | Constructor injection | useContext hook |

### 12.2 File Naming Convention

```
Backend:
  userController.ts    # Controller functions
  User.ts              # Model (capital first letter)
  userRoutes.ts        # Route definitions
  authJwt.ts           # Middleware

Frontend/Admin:
  SignIn.tsx           # Page components (PascalCase)
  Header.tsx           # Components (PascalCase)
  UserService.ts       # Service modules (PascalCase)
  UserContext.tsx      # Context providers (PascalCase)
  helper.ts            # Utilities (camelCase)
```

### 12.3 Import Patterns

```typescript
// Shared types (all apps)
import * as darywinTypes from ':darywin-types'

// Shared helpers (all apps)
import * as darywinHelper from ':darywin-helper'

// Internal imports (use @ alias)
import Header from '@/components/Header'
import * as UserService from '@/services/UserService'

// React hooks
import { useState, useEffect, useContext, useCallback, useMemo } from 'react'

// React Router
import { useNavigate, useLocation, useParams } from 'react-router-dom'
```

---

## 13. Development Workflow

### 13.1 Running Locally

```bash
# Terminal 1: Backend
cd backend
npm install
npm run dev          # Runs on port 4004

# Terminal 2: Frontend
cd frontend
npm install
npm run dev          # Runs on port 3004

# Terminal 3: Admin
cd admin
npm install
npm run dev          # Runs on port 3003

# Terminal 4: Mobile
cd mobile
npm install
npm run start        # Expo on port 8081
```

### 13.2 Running Tests

```bash
cd backend
npm run test              # All tests
npx jest __tests__/user.test.ts   # Single file
```

### 13.3 Code Style Rules

- **No semicolons** (enforced by ESLint)
- **Single quotes** for strings
- **2 space indentation**
- **No unused variables** (warnings allowed)

### 13.4 Making Changes

1. **Understand the data flow** - Trace from component → service → controller → model
2. **Check shared types** - If changing API contracts, update `darywin-types` first
3. **Run pre-commit** - `npm run pre-commit` at root before committing
4. **Test backend changes** - Run `npm test` in backend folder

### 13.5 Common Tasks

**Adding a new API endpoint:**
1. Define types in `packages/darywin-types/index.ts`
2. Add route in `backend/src/routes/<domain>Routes.ts`
3. Add controller function in `backend/src/controllers/<domain>Controller.ts`
4. Add service function in `frontend/src/services/<Domain>Service.ts`
5. Use in component

**Adding a new page:**
1. Create page component in `frontend/src/pages/NewPage.tsx`
2. Add route in `frontend/src/App.tsx`
3. Add translations in `frontend/src/lang/new-page.ts`
4. Import language strings in `frontend/src/main.tsx`

**Adding a new component:**
1. Create component in `frontend/src/components/NewComponent.tsx`
2. Create CSS file in `frontend/src/assets/css/new-component.css`
3. Import CSS at bottom of component file

---

## Quick Reference Card

### Backend Entry Points
- `backend/src/index.ts` - Server startup
- `backend/src/app.ts` - Express configuration
- `backend/src/routes/*.ts` - API routes
- `backend/src/controllers/*.ts` - Business logic
- `backend/src/models/*.ts` - Database schemas

### Frontend Entry Points
- `frontend/src/main.tsx` - App initialization
- `frontend/src/App.tsx` - Router setup
- `frontend/src/pages/*.tsx` - Page components
- `frontend/src/services/*.ts` - API layer
- `frontend/src/context/*.tsx` - State management

### Key Files to Understand First
1. `packages/darywin-types/index.ts` - All type definitions
2. `backend/src/models/User.ts` - Core user model
3. `backend/src/middlewares/authJwt.ts` - Authentication
4. `frontend/src/context/UserContext.tsx` - Frontend auth state
5. `frontend/src/services/axiosInstance.ts` - HTTP client setup

### Ports
- Backend: 4004
- Frontend: 3004
- Admin: 3003
- Mobile: 8081
- MongoDB: 27017

---

*Document generated for DaryWin v6.7.0*
