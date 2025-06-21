import * as fs from 'fs';
import { execSync } from 'child_process';
import * as dotenv from 'dotenv';

dotenv.config();

function deploy() {
    const { VERCEL_TOKEN, VERCEL_ORG_ID, VERCEL_PROJECT_ID } = process.env;

    if (!VERCEL_TOKEN) return console.error('Missing Vercel token');
    if (!VERCEL_ORG_ID) return console.error('Missing Vercel organization ID');
    if (!VERCEL_PROJECT_ID) return console.error('Missing Vercel project ID');

    replaceVercelProjectJson(VERCEL_PROJECT_ID, VERCEL_ORG_ID);
    execSync(
        `vercel pull --yes --environment=production --token=${VERCEL_TOKEN}`,
        {
            stdio: 'inherit',
        },
    );

    execSync(`vercel build --prod --token=${VERCEL_TOKEN}`, {
        stdio: 'inherit',
    });

    execSync(`vercel deploy --prebuilt --prod --token=${VERCEL_TOKEN}`, {
        stdio: 'inherit',
    });
}

deploy();

function replaceVercelProjectJson(projectId, orgId) {
    execSync('rm -f ./.vercel/project.json');
    execSync('mkdir -p ./.vercel');
    execSync('touch ./.vercel/project.json');
    fs.writeFileSync(
        './.vercel/project.json',
        JSON.stringify({ projectId, orgId }),
        'utf8',
    );
}
