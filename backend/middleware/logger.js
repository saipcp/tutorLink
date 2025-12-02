import morgan from 'morgan';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Create write stream for access log
const accessLogStream = fs.createWriteStream(
  path.join(logsDir, 'access.log'),
  { flags: 'a' }
);

// Custom log format
const logFormat = ':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent"';

export const accessLogger = morgan(logFormat, {
  stream: accessLogStream,
  skip: (req, res) => process.env.NODE_ENV === 'test'
});

export const consoleLogger = morgan('dev');

// Custom logger for application logs
export const logger = {
  info: (message, data) => {
    const log = `[INFO] ${new Date().toISOString()} - ${message}`;
    console.log(log, data || '');
    fs.appendFileSync(
      path.join(logsDir, 'app.log'),
      log + (data ? ' ' + JSON.stringify(data) : '') + '\n'
    );
  },
  error: (message, error) => {
    const log = `[ERROR] ${new Date().toISOString()} - ${message}`;
    console.error(log, error || '');
    fs.appendFileSync(
      path.join(logsDir, 'error.log'),
      log + (error ? ' ' + (error.stack || JSON.stringify(error)) : '') + '\n'
    );
  },
  warn: (message, data) => {
    const log = `[WARN] ${new Date().toISOString()} - ${message}`;
    console.warn(log, data || '');
    fs.appendFileSync(
      path.join(logsDir, 'app.log'),
      log + (data ? ' ' + JSON.stringify(data) : '') + '\n'
    );
  }
};

