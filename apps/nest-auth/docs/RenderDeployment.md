# Render Deployment Documentation

## Overview

This document outlines the deployment setup for the lil-frankenstack NestJS backend application on Render's hosting platform.

## Deployment Information

| Item | Value |
|------|-------|
| Service Name | lil-frankenstack-nest |
| URL | https://lil-frankenstack-nest.onrender.com |
| Service Type | Web Service |
| Tier | Free |
| Region | Oregon (US West) |

## Service Configuration

### Build & Deploy Settings

- **Runtime Environment**: Node.js
- **Build Command**: `pnpm install --frozen-lockfile; pnpm run build`
- **Start Command**: `pnpm db:migrate; NODE_OPTIONS="--max_old_space_size=512" pnpm start`

## Free Tier Considerations

### Automatic Spin-Down

**Important**: Render's free tier services automatically spin down after 15 minutes of inactivity. This means the service will stop running if it doesn't receive any HTTP traffic for 15 minutes.

### Keep-Alive Solution

To prevent the service from spinning down, we've implemented a cron job solution:

- **Cron Job Service**: [cron-job.org](https://console.cron-job.org/)
- **Job ID**: 6251935
- **URL Pinged**: https://lil-frankenstack-nest.onrender.com
- **Frequency**: Every 10 minutes
- **Purpose**: Sends HTTP requests to keep the service active continuously

#### How It Works

1. The cron job at cron-job.org sends a request to our backend every 10 minutes
2. These regular requests prevent Render from spinning down the service due to inactivity
3. This ensures our service remains responsive to real user requests without cold-start delays

## Monitoring

- Regular monitoring of service uptime is recommended through Render's dashboard
- Check [cron-job.org](https://console.cron-job.org/jobs/6251935) periodically to ensure the keep-alive job is running correctly

## Scaling Considerations

When ready to upgrade from the free tier:
- Consider moving to Render's paid tiers to eliminate the need for keep-alive pings
- Paid tiers provide additional resources and eliminate automatic spin-downs

## Troubleshooting

If the service appears to be experiencing cold-starts despite the keep-alive solution:
1. Verify the cron job is active on cron-job.org
2. Check Render logs for any indications of forced restarts or errors
3. Consider decreasing the interval between keep-alive requests (e.g., from 10 minutes to 8 minutes)
