import HyperExpress from 'hyper-express';
import WebSocketController from "../controllers/WebSocketController";

const router = new HyperExpress.Router();

router.post("/broadcast", WebSocketController.broadcast);

export default router;
