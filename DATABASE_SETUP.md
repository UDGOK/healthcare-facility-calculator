# 🗄️ Database Setup Instructions

## Overview

The DS Arch Medical Cost Estimator now includes a **comprehensive PostgreSQL database** with enterprise-grade features:

✅ **Professional Data Storage**
- Estimates, rooms, equipment, templates
- User authentication and profiles
- Client project management
- Audit trails and version control

✅ **Enterprise Features**
- Multi-user authentication
- Role-based access control
- Session management
- Data migration from localStorage

## 🚀 Quick Setup Options

### Option 1: Local Development (Recommended for Testing)

1. **Install PostgreSQL locally:**
   ```bash
   # macOS with Homebrew
   brew install postgresql
   brew services start postgresql

   # Ubuntu/Debian
   sudo apt update
   sudo apt install postgresql postgresql-contrib
   sudo systemctl start postgresql

   # Windows - Download from postgresql.org
   ```

2. **Create database:**
   ```bash
   sudo -u postgres psql
   CREATE DATABASE ds_arch_medical_estimator;
   CREATE USER dsarch WITH PASSWORD 'your_secure_password';
   GRANT ALL PRIVILEGES ON DATABASE ds_arch_medical_estimator TO dsarch;
   \q
   ```

3. **Update environment variables:**
   ```bash
   # Copy the example
   cp .env .env.local

   # Edit .env.local
   DATABASE_URL="postgresql://dsarch:your_secure_password@localhost:5432/ds_arch_medical_estimator"
   JWT_SECRET="your-super-secret-jwt-key-minimum-32-characters"
   ```

### Option 2: Cloud Database (Recommended for Production)

#### Supabase (Free tier available)
1. Go to [supabase.com](https://supabase.com)
2. Create new project
3. Get connection string from Settings > Database
4. Update `.env`:
   ```
   DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@[YOUR-PROJECT-REF].supabase.co:5432/postgres"
   ```

#### Railway (Simple deployment)
1. Go to [railway.app](https://railway.app)
2. Create PostgreSQL database
3. Copy connection string
4. Update `.env`

#### PlanetScale (MySQL alternative)
1. Go to [planetscale.com](https://planetscale.com)
2. Create database
3. Get connection string
4. Update schema.prisma to use mysql provider

## 📦 Installation Steps

1. **Install dependencies:**
   ```bash
   bun install
   # or
   npm install
   ```

2. **Setup environment:**
   ```bash
   cp .env .env.local
   # Edit .env.local with your database credentials
   ```

3. **Generate Prisma client:**
   ```bash
   bun db:generate
   ```

4. **Run database migrations:**
   ```bash
   bun db:push
   ```

5. **Seed initial data:**
   ```bash
   bun db:seed
   ```

6. **Start the application:**
   ```bash
   bun dev
   ```

## 🔐 Demo Accounts

After seeding, these accounts are available:

| Role | Email | Password | Access |
|------|--------|----------|---------|
| Admin | admin@dsarch.org | admin123 | Full system access |
| User | demo@dsarch.org | demo123 | Estimate creation |
| Client | client@healthcare.com | client123 | Client portal |

## 🛠️ Database Commands

```bash
# Generate Prisma client
bun db:generate

# Push schema changes
bun db:push

# Run migrations (production)
bun db:migrate

# Seed database
bun db:seed

# View database in browser
bun db:studio
```

## 📊 Database Schema Features

### Core Entities
- **Users**: Authentication, profiles, roles
- **Estimates**: Projects with rooms and equipment
- **Templates**: Professional facility templates
- **Audit Logs**: Complete activity tracking

### Enterprise Features
- **Client Portal**: Project management for healthcare organizations
- **Version Control**: Track all estimate changes
- **Notifications**: System and user notifications
- **Sessions**: Secure JWT-based authentication

### Compliance & Professional Features
- **NFPA 99 Compliance**: Built-in medical gas standards
- **Professional Templates**: OR Suite, ICU, Emergency Dept
- **Cost Calculations**: Industry-standard pricing models
- **Audit Trails**: Full change tracking for accountability

## 🔄 Migration from localStorage

The system automatically detects localStorage data and offers migration:

1. **User signs in** → System checks for local estimates
2. **Migration prompt** → User can transfer data to database
3. **Automatic cleanup** → localStorage cleared after successful migration

## 🚨 Troubleshooting

### Common Issues

**Database connection errors:**
```bash
# Check database is running
sudo systemctl status postgresql

# Test connection
psql postgresql://username:password@localhost:5432/database_name
```

**Prisma errors:**
```bash
# Reset Prisma client
rm -rf node_modules/.prisma
bun db:generate

# Reset database (development only)
bun db:push --force-reset
bun db:seed
```

**Environment issues:**
- Ensure `.env.local` has correct DATABASE_URL
- JWT_SECRET must be at least 32 characters
- Check all required environment variables

### Production Deployment

**Netlify/Vercel with External Database:**
1. Set up cloud database (Supabase, Railway, etc.)
2. Add environment variables to deployment platform
3. Database should auto-deploy with migrations

**Docker Deployment:**
```bash
# Coming soon - Docker configuration
```

## 📈 Performance Considerations

- **Indexes**: Automatically applied to common query patterns
- **Connection Pooling**: Prisma handles connection management
- **Transactions**: Critical operations wrapped in transactions
- **Pagination**: Built-in pagination for large datasets

## 🔒 Security Features

- **Password Hashing**: bcrypt with configurable rounds
- **JWT Tokens**: Secure session management
- **HTTP-Only Cookies**: Token storage best practices
- **Audit Logging**: Track all significant actions
- **Role-Based Access**: Admin, User, Client roles

## 🆘 Support

If you encounter issues:
1. Check the troubleshooting section above
2. Verify environment variables
3. Check database connectivity
4. Review Prisma documentation
5. Contact DS Arch support

---

**✅ Ready to go!** Your enterprise-grade medical cost estimation platform with professional database storage is ready for production use.
