import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv'
import authRouter from './routes/auth'
import productRouter from './routes/product'

dotenv.config()
const app = express();
const PORT = process.env.PORT || 5001

const corsOptions = {
    origin: process.env.CORS_ORIGIN,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
}

// Enable CORS
app.use(cors(corsOptions));

app.use(express.json());

// Auth route
app.use('/api/v1/auth', authRouter)
app.use('/api/v1/product', productRouter)

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});