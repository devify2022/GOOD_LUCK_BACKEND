import express from "express";
import {
  createDakshina,
  deleteDakshinaById,
  getAllDakshinas,
  getDakshinasByDay,
  updateDakshinaById,
} from "../../controllers/Dakshina/dakshina.controller.js";

const router = express.Router();

router.post("/create", createDakshina);
router.get("/getAll", getAllDakshinas);
router.get("/get/:day", getDakshinasByDay);
router.patch("/update/:id", updateDakshinaById);
router.delete("/delete/:id", deleteDakshinaById);

export default router;
