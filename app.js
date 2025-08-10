import express, { json } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import logger from './logger.js';

import mainRoutes from './Routes/mainRoutes.js';
import adminRoutes from './Routes/adminRoutes.js';
import authRoutes from './Routes/authRoutes.js';
import bookRoutes from './Routes/bookRoutes.js';
import transactionRoutes from './Routes/transactionRoutes.js';

const app = express();

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

app.use('/', mainRoutes);
app.use('/', authRoutes);
app.use('/admin', adminRoutes);
app.use('/book', bookRoutes);
app.use('/transaction', transactionRoutes);

export default app;
