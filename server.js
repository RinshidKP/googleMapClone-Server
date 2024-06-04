import 'dotenv/config';
import express from 'express'
import { connectToDatabase } from './utils/connectDB.js';
import authRoutes from './routes/authRoutes.js';
import cors from 'cors';

const app = express();

const corsOptions = {
  origin: ['https://google-map-clone-client.vercel.app', 'https://google-map-clone-client.vercel.app/'],
  methods: ['GET', 'POST'], 
  credentials: true 
};

connectToDatabase();
app.use(express.json());
app.use(cors(corsOptions));

app.use('/', authRoutes);

const PORT = process.env.PORT
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});