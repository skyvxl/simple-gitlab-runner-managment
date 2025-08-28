---
description: "SvelteKit with TypeScript and Svelte 5 Runes development standards and best practices"
applyTo: "**/*.svelte, **/*.ts, **/*.js, **/*.scss, **/*.css"
---

# SvelteKit + TypeScript + Svelte 5 Runes Development Instructions

Instructions for building high-quality SvelteKit applications with TypeScript and Svelte 5's modern Runes reactivity system, following current patterns and best practices.

## Project Context

- SvelteKit 2.x+ with TypeScript
- Svelte 5+ with Runes reactivity system
- TypeScript for type safety across the entire application
- File-based routing with SvelteKit's conventions
- Modern build tooling (Vite as default)
- Server-side rendering (SSR) and static site generation (SSG) capabilities
- Progressive enhancement and accessibility-first approach
- Runes-based state management replacing traditional reactive statements

## Development Standards

### Architecture

- Use SvelteKit's file-based routing system
- Organize routes by feature or domain for scalability
- Separate UI components from business logic
- Implement proper separation of concerns between client and server code
- Use load functions for data fetching and page initialization
- Leverage SvelteKit's form actions for data mutations
- Structure stores by domain and responsibility

### TypeScript Integration

- Enable strict mode in `tsconfig.json` for maximum type safety
- Use `$types` imports for auto-generated types from load functions
- Define proper types for component props using `ComponentProps<T>`
- Implement generic components where appropriate
- Type all rune state and derived values with proper TypeScript types
- Use `PageData`, `LayoutData`, and `ActionData` types consistently
- Define interfaces for API responses and external data
- Type rune functions (`$state`, `$derived`, `$effect`) with explicit types
- Use branded types for better type safety in complex applications

### Component Design

- Follow the single responsibility principle for components
- Use PascalCase for component names and kebab-case for file names
- Keep components small and focused on one concern
- Implement proper prop validation with TypeScript
- Use slots for flexible composition patterns
- Design components to be testable and reusable
- Follow Svelte 5's runes-based reactivity patterns
- Use `$state` for component-local reactive state
- Use `$derived` for computed values instead of reactive statements
- Implement proper prop destructuring with runes syntax

### State Management with Svelte 5 Runes

- Use `$state` for reactive local component state
- Use `$derived` for computed values that depend on other state
- Use `$effect` for side effects and lifecycle management
- Implement `$state.frozen` for immutable state objects
- Use `$state.snapshot` for non-reactive snapshots of state
- Create custom runes for reusable reactive logic
- Use `$bindable` for two-way prop binding
- Leverage context API (`setContext`, `getContext`) with runes
- Keep state focused and avoid large monolithic state objects
- Migrate from traditional stores to runes-based patterns where appropriate
- Use traditional Svelte stores only for global state that needs to be shared across disconnected components

### Svelte 5 Runes Patterns

**State Rune (`$state`)**

```typescript
// Component state
let count = $state(0);
let user = $state<User | null>(null);

// Object state with proper typing
let form = $state({
  name: "",
  email: "",
  age: 0,
});

// Frozen state for immutable objects
let config = $state.frozen({ theme: "dark", locale: "en" });
```

**Derived Rune (`$derived`)**

```typescript
// Simple derived value
let doubled = $derived(count * 2);

// Complex derived with proper typing
let isValidForm = $derived(() => {
  return form.name.length > 0 && form.email.includes("@") && form.age >= 18;
});

// Async derived (use with caution)
let userData = $derived.by(async () => {
  if (!userId) return null;
  return await fetchUser(userId);
});
```

**Effect Rune (`$effect`)**

```typescript
// Basic effect for side effects
$effect(() => {
  document.title = `Count: ${count}`;
});

// Effect with cleanup
$effect(() => {
  const interval = setInterval(() => {
    count++;
  }, 1000);

  return () => clearInterval(interval);
});

// Pre-effect for DOM manipulation before updates
$effect.pre(() => {
  // Runs before DOM updates
  console.log("About to update DOM");
});
```

**Bindable Props (`$bindable`)**

```typescript
// Component with bindable prop
interface Props {
  value: string;
}

let { value = $bindable() }: Props = $props();

// Two-way binding usage
// <Input bind:value={inputValue} />
```

**Custom Runes**

```typescript
// Custom rune for localStorage
function useLocalStorage<T>(key: string, defaultValue: T) {
  let storedValue = $state(defaultValue);

  // Initialize from localStorage
  $effect(() => {
    const stored = localStorage.getItem(key);
    if (stored) {
      storedValue = JSON.parse(stored);
    }
  });

  // Save to localStorage when value changes
  $effect(() => {
    localStorage.setItem(key, JSON.stringify(storedValue));
  });

  return {
    get value() {
      return storedValue;
    },
    set value(newValue: T) {
      storedValue = newValue;
    },
  };
}

// Custom rune for API data
function useApiData<T>(url: string) {
  let data = $state<T | null>(null);
  let loading = $state(false);
  let error = $state<string | null>(null);

  $effect(() => {
    loading = true;
    error = null;

    fetch(url)
      .then((res) => res.json())
      .then((result) => {
        data = result;
        loading = false;
      })
      .catch((err) => {
        error = err.message;
        loading = false;
      });
  });

  return {
    get data() {
      return data;
    },
    get loading() {
      return loading;
    },
    get error() {
      return error;
    },
  };
}
```

### Migration from Svelte 4 to Svelte 5

**Reactive Statements → Derived Runes**

```typescript
// Svelte 4
let count = 0;
$: doubled = count * 2;
$: if (count > 10) console.log("High count!");

// Svelte 5
let count = $state(0);
let doubled = $derived(count * 2);
$effect(() => {
  if (count > 10) console.log("High count!");
});
```

**Component State → State Runes**

```typescript
// Svelte 4
let name = "";
let items = [];

// Svelte 5
let name = $state("");
let items = $state<Item[]>([]);
```

**Props with Binding → Bindable Props**

```typescript
// Svelte 4
export let value;

// Svelte 5
let { value = $bindable() } = $props();
```

**Stores → Runes (for local state)**

```typescript
// Svelte 4 (component-level store)
import { writable } from "svelte/store";
const count = writable(0);

// Svelte 5 (use runes instead)
let count = $state(0);
```

**Event Handlers and Lifecycle**

```typescript
// Svelte 4
import { onMount, onDestroy } from "svelte";

onMount(() => {
  // initialization
});

onDestroy(() => {
  // cleanup
});

// Svelte 5 (use effects)
$effect(() => {
  // initialization

  return () => {
    // cleanup
  };
});
```

### Svelte 5 Advanced Patterns

**Event Handling with Runes**

```typescript
// Event handler with state update
let count = $state(0);

function handleClick() {
  count++;
}

// Event handler with derived validation
let email = $state("");
let isValidEmail = $derived(email.includes("@") && email.includes("."));

function handleSubmit() {
  if (isValidEmail) {
    // Submit logic
  }
}
```

**Component Communication**

```typescript
// Parent component
let parentState = $state({ items: [], loading: false });

// Child component with bindable props
interface ChildProps {
  items: Item[];
  onAdd: (item: Item) => void;
}

let { items, onAdd }: ChildProps = $props();

// Two-way binding with transformation
let { value = $bindable("") } = $props();
let transformedValue = $derived(value.toUpperCase());

$effect(() => {
  value = transformedValue.toLowerCase();
});
```

**Performance Optimization with Runes**

```typescript
// Memoized expensive computation
let input = $state("");
let expensiveResult = $derived.by(() => {
  if (!input) return null;
  return expensiveComputation(input);
});

// Debounced state updates
let searchTerm = $state("");
let debouncedSearch = $state("");

$effect(() => {
  const timeoutId = setTimeout(() => {
    debouncedSearch = searchTerm;
  }, 300);

  return () => clearTimeout(timeoutId);
});
```

**Context with Runes**

```typescript
// Context provider
import { setContext, getContext } from "svelte";

interface AppContext {
  theme: string;
  setTheme: (theme: string) => void;
}

function createAppContext() {
  let theme = $state("light");

  const context: AppContext = {
    get theme() {
      return theme;
    },
    setTheme: (newTheme: string) => {
      theme = newTheme;
    },
  };

  setContext("app", context);
  return context;
}

// Context consumer
function getAppContext(): AppContext {
  return getContext("app");
}
```

### Routing and Navigation

- Use SvelteKit's file-based routing conventions
- Implement proper error pages (`+error.svelte`)
- Use layout files (`+layout.svelte`) for shared UI structure
- Leverage route parameters and optional parameters effectively
- Implement proper loading states with `+page.ts` or `+page.server.ts`
- Use `goto` and `invalidate` functions for programmatic navigation
- Handle route transitions and page lifecycle properly

### Data Loading and API Integration

- Use `+page.server.ts` for server-side data loading
- Implement `+page.ts` for universal (client/server) data loading
- Use form actions in `+page.server.ts` for data mutations
- Leverage `fetch` with proper error handling in load functions
- Implement proper data validation using libraries like Zod
- Use `depends` for cache invalidation strategies
- Handle loading states and error boundaries appropriately

### Server-Side Features

- Implement API routes using `+server.ts` files
- Use proper HTTP methods and status codes
- Implement request validation and sanitization
- Use environment variables for configuration
- Implement proper authentication and authorization
- Use database connections and ORM integrations appropriately
- Handle file uploads and static asset serving

### Forms and Validation

- Use SvelteKit's progressive enhancement with form actions
- Implement proper client-side and server-side validation
- Use `enhance` action for better form UX
- Handle form errors and success states appropriately
- Implement proper CSRF protection
- Use TypeScript for form data validation
- Provide accessible form feedback and error messages

### Performance Optimization

- Leverage SvelteKit's automatic code splitting
- Use proper preloading strategies with `data-sveltekit-preload-data`
- Implement lazy loading for non-critical components
- Optimize bundle size with proper imports
- Use Svelte's compile-time optimizations
- Implement proper caching strategies
- Monitor and optimize Core Web Vitals

### Testing

- Use Vitest for unit testing components and utilities
- Implement Playwright for end-to-end testing
- Use `@testing-library/svelte` for component testing
- Test user interactions and accessibility
- Mock external dependencies and API calls
- Write tests for load functions and form actions
- Test both client-side and server-side functionality

### Security

- Implement proper input validation and sanitization
- Use HTTPS in production environments
- Implement Content Security Policy (CSP)
- Handle authentication securely with sessions or JWTs
- Protect against common vulnerabilities (XSS, CSRF, injection)
- Validate and sanitize all user inputs
- Use environment variables for sensitive configuration

### Accessibility

- Use semantic HTML elements appropriately
- Implement proper ARIA attributes and roles
- Ensure keyboard navigation support
- Provide screen reader support
- Test with accessibility tools and screen readers
- Follow WCAG guidelines for color contrast and design
- Implement proper focus management

## Implementation Process

1. Plan application architecture and routing structure
2. Set up project structure with proper TypeScript and Svelte 5 configuration
3. Define types and interfaces for data models and rune state
4. Implement core layout and routing structure
5. Create reusable UI components with runes and proper typing
6. Implement data loading with load functions
7. Add form handling with actions and validation
8. Implement authentication and authorization
9. Add error handling and loading states with runes
10. Optimize performance and bundle size
11. Ensure accessibility compliance
12. Add comprehensive testing coverage for runes-based components
13. Document components, runes, and API endpoints
14. Consider migration strategy for existing Svelte 4 components

## Best Practices

### File Structure

```
src/
├── lib/
│   ├── components/     # Reusable UI components
│   ├── stores/         # Global state stores
│   ├── utils/          # Utility functions
│   ├── types/          # TypeScript type definitions
│   └── server/         # Server-only utilities
├── routes/
│   ├── (app)/          # Route groups
│   ├── api/            # API endpoints
│   └── +layout.svelte  # Root layout
├── app.html            # HTML template
└── app.d.ts            # Global type definitions
```

### Naming Conventions

- Routes: Use kebab-case for file and folder names
- Components: Use PascalCase for component names, kebab-case for files
- Stores: Use camelCase with descriptive names
- Types: Use PascalCase for interfaces and types
- Functions: Use camelCase for function names
- Constants: Use UPPER_SNAKE_CASE for constants

### Import Patterns

- Use `$lib` alias for library imports
- Use relative imports for route-specific files
- Group imports by type (external, internal, types)
- Use `$types` for auto-generated SvelteKit types

### Error Handling

- Implement proper error boundaries with `+error.svelte`
- Use `fail` action for form validation errors
- Handle network errors gracefully
- Provide meaningful error messages to users
- Log errors appropriately for debugging

### Code Style

- Use Prettier for consistent formatting
- Implement ESLint with Svelte-specific rules and Svelte 5 support
- Use TypeScript strict mode
- Follow Svelte 5's runes-based reactivity patterns
- Keep rune functions (`$derived`, `$effect`) simple and focused
- Avoid complex logic in rune functions - extract to separate functions
- Use proper TypeScript typing for all runes
- Prefer runes over traditional reactive statements for new components

## Common Patterns

- Page data loading with proper TypeScript types
- Form actions with validation and error handling
- Runes-based state management for component state
- Component composition with slots and props
- Authentication flows with load functions
- API integration with proper error handling
- Progressive enhancement patterns
- Responsive design with Svelte transitions
- Custom runes for reusable reactive logic
- Migration patterns from Svelte 4 to Svelte 5

## Tools and Libraries

- **Development**: SvelteKit 2.x+, Svelte 5+, TypeScript, Vite
- **Styling**: Tailwind CSS, PostCSS, SCSS
- **State**: Svelte 5 Runes (`$state`, `$derived`, `$effect`), Svelte stores for global state
- **Validation**: Zod, Yup, or similar schema validation
- **Testing**: Vitest, Playwright, Testing Library with Svelte 5 support
- **Linting**: ESLint with Svelte 5 support, Prettier, svelte-check
- **Database**: Prisma, Drizzle, or similar ORM
- **Auth**: lucia-auth, Auth.js, or custom implementation

## Additional Guidelines

- Follow SvelteKit's conventions and best practices
- Use meaningful commit messages with conventional commits
- Implement proper logging and monitoring
- Keep dependencies minimal and up to date
- Document complex components and functions
- Use TypeScript features like branded types where appropriate
- Implement proper error recovery mechanisms
- Consider performance implications of rune functions
- Prioritize Svelte 5 runes for new development
- Migrate existing components to runes when feasible
- Use traditional stores only for global state management
- Leverage custom runes for reusable reactive patterns
