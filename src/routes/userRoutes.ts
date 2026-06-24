import HyperExpress from 'hyper-express';
import UserController from '../controllers/UserController';
import { authMiddleware } from '../middlewares/auth';

const router = new HyperExpress.Router();

router.get('/profile', authMiddleware, UserController.getProfile);

export default router;
