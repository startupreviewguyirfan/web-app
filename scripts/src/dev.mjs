import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';

const rootDir = path.resolve(import.meta.dirname, '..', '..');
const envPath = path.join(rootDir, '.env');

if (existsSync(envPath)) {
  process.loadEnvFile(envPath);
} else {
  console.warn(
    `[dev] No .env file found at ${envPath} — copy .env.example to .env and fill in real values.`,
  );
}

const frontendPort = process.env.FRONTEND_PORT ?? '5100';
const apiPort = process.env.API_PORT ?? '8080';

const children = [];

function run(name, filterName, extraEnv) {
  const child = spawn(
    'pnpm',
    ['--filter', filterName, 'run', 'dev'],
    {
      cwd: rootDir,
      stdio: 'inherit',
      env: { ...process.env, ...extraEnv },
    },
  );

  child.on('exit', (code) => {
    console.log(`[dev] ${name} exited with code ${code}`);
    for (const other of children) {
      if (other !== child) other.kill();
    }
    process.exit(code ?? 0);
  });

  children.push(child);
  return child;
}

run('api-server', '@workspace/api-server', { PORT: apiPort });
run('frontend', '@workspace/startup-review-guy', {
  PORT: frontendPort,
  BASE_PATH: '/',
  API_PORT: apiPort,
});

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    for (const child of children) child.kill(signal);
    process.exit(0);
  });
}
