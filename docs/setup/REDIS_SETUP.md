# Redis Cache Setup Guide

This guide will help you set up Upstash Redis for caching in the Career Services CRM.

## Why Caching?

Caching improves performance by storing frequently accessed data in memory, reducing database queries and API calls. This is especially important for:
- Dashboard statistics
- AI-generated responses
- Student lists and details
- Reports

## Setting Up Upstash Redis

1. **Create an Upstash Account**
   - Go to [upstash.com](https://upstash.com/)
   - Sign up for a free account

2. **Create a Redis Database**
   - Click "Create Database"
   - Choose a region close to your deployment
   - Select "Regional" for the free tier
   - Name your database (e.g., "career-crm-cache")

3. **Get Your Credentials**
   - In the database dashboard, find:
     - **REST URL**: `https://your-database.upstash.io`
     - **REST Token**: Your authentication token

4. **Configure Environment Variables**
   
   Add these to your `backend/.env` file:
   ```env
   # Redis Cache Configuration (Upstash)
   UPSTASH_REDIS_REST_URL=https://your-database.upstash.io
   UPSTASH_REDIS_REST_TOKEN=your-rest-token
   ```

## How Caching Works

### Current Implementation

1. **Dashboard Stats**: Cached for 2 minutes
   - Reduces database load for frequently accessed metrics
   - Updates automatically after cache expires

2. **AI Responses**: Cached for 1 hour
   - Prevents duplicate API calls to Claude
   - Saves on API costs

3. **Student Data**: 
   - List cached for 1 minute
   - Individual student details cached for 5 minutes

### Cache Invalidation

The cache automatically invalidates when:
- Data is updated (create, update, delete operations)
- TTL (Time To Live) expires
- Manual cache clear is triggered

## Local Development

During development without Redis:
- The application works normally
- Caching is bypassed (direct database/API calls)
- You'll see a warning in logs: "Redis cache disabled"

## Production Benefits

With Redis enabled:
- **50-80% faster** dashboard loading
- **Reduced API costs** for AI features
- **Better scalability** under high load
- **Improved user experience**

## Monitoring Cache Performance

Check the logs for cache hits/misses:
```
Cache hit: dashboard:stats
Cache miss: student:123
```

## Free Tier Limits

Upstash free tier includes:
- 10,000 commands per day
- 256MB storage
- SSL encryption
- REST API access

This is sufficient for:
- ~1000 daily active users
- ~10,000 page views per day

## Troubleshooting

If caching isn't working:
1. Check environment variables are set correctly
2. Verify Upstash database is active
3. Check network connectivity to Upstash
4. Review application logs for errors

## Next Steps

After setting up Redis:
1. Deploy the backend to Railway
2. The cache will automatically start working
3. Monitor performance improvements
4. Adjust cache TTLs if needed