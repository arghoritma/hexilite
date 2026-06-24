import HyperExpress from 'hyper-express';
import authRoutes from './authRoutes'
import userRoutes from './userRoutes';
import websocketRoutes from './websocketRoutes';

const router = new HyperExpress.Router();

router.use('/auth', authRoutes)
router.use('/users', userRoutes);
router.use('/ws', websocketRoutes);

export default router;
