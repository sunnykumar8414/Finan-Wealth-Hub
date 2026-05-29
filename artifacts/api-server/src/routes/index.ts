import { Router, type IRouter } from "express";
import healthRouter from "./health";
import expensesRouter from "./expenses";
import investmentsRouter from "./investments";
import transactionsRouter from "./transactions";
import budgetsRouter from "./budgets";
import dashboardRouter from "./dashboard";

const router: IRouter = Router();

router.use(healthRouter);
router.use(expensesRouter);
router.use(investmentsRouter);
router.use(transactionsRouter);
router.use(budgetsRouter);
router.use(dashboardRouter);

export default router;
