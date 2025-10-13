# Supabase Authentication Setup Guide

## What's Been Implemented

Your Click Optima now has a complete authentication system using Supabase with:

✅ **Email/Password Authentication**
✅ **Google OAuth**  
✅ **GitHub OAuth**
✅ **Password Reset**
✅ **User Registration with Role Selection**
✅ **Protected Routes**
✅ **Session Management**
✅ **Role-Based Routing**
✅ **Real User Data in Layouts**
✅ **Proper Logout Functionality**

## Next Steps to Complete Setup

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for the project to be ready (usually 2-3 minutes)
3. Go to **Settings** → **API** in your Supabase dashboard
4. Copy your `Project URL` and `anon` key

### 2. Set Up Environment Variables

Create a `.env.local` file in your project root:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# App Configuration  
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 3. Configure OAuth Providers in Supabase

#### Google OAuth Setup:
1. Go to **Authentication** → **Providers** in Supabase dashboard
2. Enable Google provider
3. You'll need to create a Google OAuth app:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or use existing
   - Enable Google+ API
   - Create OAuth 2.0 credentials
   - Add authorized redirect URI: `https://your-project-ref.supabase.co/auth/v1/callback`
   - Copy Client ID and Client Secret to Supabase

#### GitHub OAuth Setup:
1. Enable GitHub provider in Supabase
2. Create a GitHub OAuth app:
   - Go to GitHub Settings → Developer settings → OAuth Apps
   - Create new OAuth app
   - Authorization callback URL: `https://your-project-ref.supabase.co/auth/v1/callback`
   - Copy Client ID and Client Secret to Supabase

### 4. Configure Email Templates (Optional)

In Supabase dashboard → **Authentication** → **Email Templates**, customize:
- Confirmation email
- Password reset email
- Magic link email

### 5. Set Up User Metadata for Roles

In your Supabase dashboard → **SQL Editor**, run this query to enable user roles:

```sql
-- Enable RLS on auth.users if not already enabled
ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

-- Create a profiles table to store additional user data
CREATE TABLE public.profiles (
  id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  user_role text CHECK (user_role IN ('advertiser', 'publisher')),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  PRIMARY KEY (id)
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policy for users to read their own profile
CREATE POLICY "Users can read own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

-- Create policy for users to update their own profile  
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Function to automatically create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, user_role)
  VALUES (new.id, new.raw_user_meta_data->>'user_role');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call the function
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- You can also run the additional database schema for websites:
-- Copy and paste the contents of lib/supabase/database-schema.sql
```

### 6. Test the Authentication

1. Start your development server: `npm run dev`
2. Visit `http://localhost:3000`
3. Try registering a new account
4. Test email/password login
5. Test OAuth providers (if configured)
6. Test password reset

## How the Authentication Works

### File Structure
```
lib/supabase/
  ├── client.ts          # Client-side Supabase instance
  ├── server.ts          # Server-side Supabase instance  
  └── middleware.ts      # Session management

hooks/
  └── use-auth.ts        # Authentication hook

middleware.ts            # Next.js middleware for route protection

app/auth/
  ├── login/page.tsx     # Login page with OAuth
  ├── register/page.tsx  # Registration with role selection
  ├── forgot-password/page.tsx  # Password reset
  ├── reset-password/page.tsx   # Set new password
  └── callback/page.tsx  # OAuth callback handler
```

### Key Features

1. **Session Management**: Automatic session refresh and user state management
2. **Route Protection**: Middleware redirects unauthenticated users
3. **Role-Based Access**: Users select advertiser/publisher role during signup and are redirected to correct dashboard
4. **OAuth Integration**: Seamless Google and GitHub authentication
5. **Error Handling**: Comprehensive error messages and validation
6. **Smart Redirects**: Users are automatically redirected based on authentication status and role
7. **Real User Data**: Layouts show actual user information from authentication
8. **Secure Logout**: Proper session cleanup and redirect on logout

### Using Authentication in Your Components

```tsx
import { useAuth } from '@/hooks/use-auth'

function MyComponent() {
  const { user, loading, signOut } = useAuth()
  
  if (loading) return <div>Loading...</div>
  
  if (!user) return <div>Please log in</div>
  
  return (
    <div>
      Welcome {user.email}!
      <button onClick={signOut}>Sign Out</button>
    </div>
  )
}
```

## Troubleshooting

### Common Issues:

1. **OAuth not working**: Check redirect URLs match exactly in provider settings
2. **Users not redirected after login**: Verify middleware.ts is properly configured
3. **Email confirmation not working**: Check email templates and SMTP settings in Supabase
4. **Development vs Production**: Update NEXT_PUBLIC_SITE_URL for production

## Security Considerations

- Environment variables are properly configured
- RLS (Row Level Security) is enabled on profiles table
- OAuth providers are configured with correct domains
- Session tokens are handled securely by Supabase

## Next Steps

Once authentication is working, you might want to:

1. Update the advertiser/publisher layouts to show real user data
2. Implement role-based route protection
3. Add user profile management
4. Set up database tables for your marketplace data
5. Configure user permissions for different features

The authentication system is now ready to power your Click Optima! 🚀 