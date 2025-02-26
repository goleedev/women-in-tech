import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import userRoutes from './routes/users';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8008;

app.use(cors());
app.use(express.json());

app.use('/api/users', userRoutes);

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
