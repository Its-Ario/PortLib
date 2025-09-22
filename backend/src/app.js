import express, { json } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import logger from './logger.js';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';

import mainRoutes from './routes/mainRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import authRoutes from './routes/authRoutes.js';
import bookRoutes from './routes/bookRoutes.js';
import transactionRoutes from './routes/transactionRoutes.js';

const app = express();
const swaggerDocument = YAML.load('../docs/api/openapi.yaml');

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.use(helmet());
app.use(cors());
app.use(json());

app.use(
    morgan('combined', {
        stream: {
            write: (message) => logger.info(message.trim()),
        },
    })
);

app.use(express.static('public'));

app.use('/api', mainRoutes);
app.use('/api', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/book', bookRoutes);
app.use('/api/transaction', transactionRoutes);

export default app;
