# STIerFinds Manager - .NET MAUI Conversion

This directory contains the complete .NET MAUI conversion of the React-based STIerFinds Manager application.

## 📋 Project Structure

```
STIerFinds.MAUI/
├── Services/
│   ├── SupabaseService.cs       # Supabase client management
│   ├── AuthService.cs           # Authentication operations
│   ├── ItemService.cs           # Lost & found items management
│   └── MessagingService.cs      # Real-time messaging
├── ViewModels/
│   ├── WelcomeViewModel.cs
│   ├── LoginViewModel.cs
│   ├── SignupViewModel.cs
│   ├── AdminLoginViewModel.cs
│   ├── DashboardViewModel.cs
│   ├── AdminDashboardViewModel.cs
│   └── MessagesViewModel.cs
├── Views/
│   ├── WelcomePage.xaml & WelcomePage.xaml.cs
│   ├── LoginPage.xaml & LoginPage.xaml.cs
│   ├── SignupPage.xaml & SignupPage.xaml.cs
│   ├── AdminLoginPage.xaml & AdminLoginPage.xaml.cs
│   ├── DashboardPage.xaml & DashboardPage.xaml.cs
│   ├── AdminDashboardPage.xaml & AdminDashboardPage.xaml.cs
│   └── MessagesPage.xaml & MessagesPage.xaml.cs
├── AppShell.xaml & AppShell.xaml.cs
├── App.xaml & App.xaml.cs
├── MauiProgram.cs
└── STIerFinds.MAUI.csproj
```

## 🛠️ Technology Stack

- **.NET 8.0** - Target framework
- **MAUI** - Cross-platform UI framework
- **Supabase** - Backend (Auth, Database, Realtime)
- **Community Toolkit MVVM** - MVVM patterns and reactive data binding
- **C#** - Primary language

## 🔄 React to MAUI Conversion Mapping

| React/TypeScript | .NET MAUI |
|---|---|
| React Router | Shell Navigation |
| React Hooks + useState | MVVM ViewModels + ObservableProperty |
| shadcn/ui Components | MAUI Built-in Controls |
| Tailwind CSS | XAML Styles (ResourceDictionary) |
| TypeScript Interfaces | C# Classes |
| Supabase JS SDK | Supabase.Net NuGet Package |
| TanStack Query (React Query) | Service Layer with async/await |
| Redux/Context API | MVVM with IMessenger |

## ✨ Key Features

### 🔐 Authentication
- User sign-up with profile metadata
- User sign-in with email/password validation
- Admin role verification
- Secure sign-out functionality

### 📦 Items Management
- List all lost and found items
- Create new item postings
- Update item status
- Delete items (admin only)
- Image upload support (via Supabase Storage)
- Search and filter capabilities

### 💬 Real-time Messaging
- View user conversations
- Send and receive messages
- Real-time updates via Supabase Realtime
- Message history

### 👨‍💼 Admin Dashboard
- Manage all items in the system
- Delete inappropriate or resolved items
- View all user activities
- User management interface

## 🏗️ Architecture

```
┌─────────────────────────────────────┐
│         XAML Views Layer            │
│  (WelcomePage, LoginPage, etc)      │
└────────────────┬────────────────────┘
                 │
┌────────────────▼────────────────────┐
│    MVVM ViewModels Layer            │
│  (Observable + RelayCommands)       │
└────────────────┬────────────────────┘
                 │
┌────────────────▼────────────────────┐
│      Services Layer                 │
│  (Auth, Items, Messaging)           │
└────────────────┬────────────────────┘
                 │
┌────────────────▼────────────────────┐
│     Supabase Backend                │
│  (PostgreSQL + Auth + Realtime)     │
└─────────────────────────────────────┘
```

## 📱 Platform Support

| Platform | Minimum Version |
|----------|-----------------|
| Android  | API 21+ |
| iOS      | 14.2+ |
| macOS    | 13.1+ (Catalyst) |
| Windows  | 10.0.17763+ |

## 🚀 Quick Start

### Prerequisites
- .NET 8.0 SDK or later
- Visual Studio 2022 or VS Code with MAUI extension
- For iOS: macOS with Xcode 14+
- For Android: Android SDK 21+

### Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/KRATOS677/stierfindstest.git
   cd stierfindstest
   git checkout maui-conversion
   ```

2. **Restore NuGet packages:**
   ```bash
   dotnet restore
   ```

3. **Configure Supabase credentials:**
   
   Create or update `appsettings.json`:
   ```json
   {
     "Supabase": {
       "Url": "YOUR_SUPABASE_URL",
       "Key": "YOUR_SUPABASE_PUBLISHABLE_KEY",
       "ProjectId": "YOUR_PROJECT_ID"
     }
   }
   ```

4. **Build and run:**

   **Android:**
   ```bash
   dotnet build -f net8.0-android -c Release
   dotnet run -f net8.0-android
   ```

   **iOS:**
   ```bash
   dotnet build -f net8.0-ios -c Release
   dotnet run -f net8.0-ios
   ```

   **macOS Catalyst:**
   ```bash
   dotnet build -f net8.0-maccatalyst -c Release
   dotnet run -f net8.0-maccatalyst
   ```

   **Windows:**
   ```bash
   dotnet build -f net8.0-windows10.0.19041.0
   dotnet run -f net8.0-windows10.0.19041.0
   ```

## 💾 Database Schema

### Items Table
```sql
CREATE TABLE items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  item_type TEXT NOT NULL CHECK (item_type IN ('lost', 'found')),
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  is_resolved BOOLEAN DEFAULT FALSE
);
```

### Messages Table
```sql
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id),
  sender_id UUID NOT NULL REFERENCES auth.users(id),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  is_read BOOLEAN DEFAULT FALSE
);
```

### Conversations Table
```sql
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_ids UUID[] NOT NULL,
  last_message TEXT,
  last_message_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

### User Roles Table
```sql
CREATE TABLE user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

## 📚 Development Guide

### Adding a New View

1. Create XAML file in `Views/` folder
2. Create ViewModel in `ViewModels/` folder
3. Add navigation route in `AppShell.xaml`
4. Register in `MauiProgram.cs`

### Creating a New Service

1. Create service class in `Services/` folder
2. Register as singleton in `MauiProgram.cs`
3. Inject into ViewModels via constructor DI

### Testing

```bash
dotnet test
```

## 🐛 Troubleshooting

### Android Build Fails
- Ensure Android SDK is installed: `dotnet workload restore android`
- Set ANDROID_HOME environment variable
- Clear cache: `dotnet clean`

### iOS Build Fails
- Run on macOS only
- Ensure Xcode is up to date: `xcode-select --install`
- Clear derived data: `rm -rf ~/Library/Developer/Xcode/DerivedData/*`

### Supabase Connection Issues
- Verify network connectivity
- Check URL and API key in configuration
- Ensure Row Level Security (RLS) policies allow access
- Test connection with `dotnet run`

### MAUI Workload Issues
```bash
dotnet workload restore
dotnet workload repair
```

## 🔐 Security Best Practices

- Never commit `.env` or `appsettings.json` with real secrets
- Use GitHub Secrets for CI/CD
- Enable Row Level Security (RLS) in Supabase
- Use environment-specific configurations
- Validate all user inputs server-side

## 📦 NuGet Dependencies

- `Supabase` - Backend integration
- `CommunityToolkit.Mvvm` - MVVM framework
- `System.Text.Json` - JSON serialization
- Standard .NET libraries

## 🚢 Deployment

### App Store (iOS)
```bash
dotnet publish -f net8.0-ios -c Release
# Then submit to App Store via Xcode/App Store Connect
```

### Google Play (Android)
```bash
dotnet publish -f net8.0-android -c Release
# Then submit to Google Play Console
```

### Microsoft Store (Windows)
```bash
dotnet publish -f net8.0-windows10.0.19041.0 -c Release
# Submit to Microsoft Store
```

## 📄 License

Same as the original repository

## 🔗 Resources

- [MAUI Documentation](https://learn.microsoft.com/en-us/dotnet/maui/)
- [Supabase .NET Client](https://github.com/supabase-community/supabase-csharp)
- [Community MVVM Toolkit](https://github.com/CommunityToolkit/dotnet)
- [Original Repository](https://github.com/KRATOS677/stierfindstest)

---

**Conversion completed:** May 28, 2026
**Original Tech Stack:** React 18 + Vite + TypeScript + Tailwind
**New Tech Stack:** .NET MAUI + C# + MVVM + Supabase
**Status:** ✅ Production Ready
