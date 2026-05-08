import 'dotenv/config';
import app from './app';
import { config } from './config';

app.listen(config.port, () => {
  console.log(`apiFakeAvig listening on port ${config.port}`);
  console.log(`Target: ${config.targetUrl}`);
});
