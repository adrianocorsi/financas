import { Router } from "express";
import authRoutes from "../modules/auth/auth.routes";
import accountsRoutes from "../modules/accounts/accounts.routes";
import categoriesRoutes from "../modules/categories/categories.routes";
import entriesRoutes from "../modules/entries/entries.routes";
import recurrencesRoutes from "../modules/recurrences/recurrences.routes";
import dashboardRoutes from "../modules/dashboard/dashboard.routes";
import budgetsRoutes from "../modules/budgets/budgets.routes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/accounts", accountsRoutes);
router.use("/categories", categoriesRoutes);
router.use("/entries", entriesRoutes);
router.use("/recurrences", recurrencesRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/budgets", budgetsRoutes);

export default router;
