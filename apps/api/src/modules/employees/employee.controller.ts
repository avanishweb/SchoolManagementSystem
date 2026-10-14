import { Request, Response, NextFunction } from 'express';
import { employeeService } from './employee.service.js';

export class EmployeeController {
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { role, department, status } = req.query as {
        role?: string;
        department?: string;
        status?: string;
      };
      const employees = await employeeService.listEmployees(req.tenantId!, role, department, status);
      res.json({ success: true, data: employees });
    } catch (err) {
      next(err);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const employee = await employeeService.getEmployeeById(req.tenantId!, req.params.id);
      res.json({ success: true, data: employee });
    } catch (err) {
      next(err);
    }
  }

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const employee = await employeeService.createEmployee(req.tenantId!, req.body);
      res.status(201).json({ success: true, data: employee });
    } catch (err) {
      next(err);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const employee = await employeeService.updateEmployee(req.tenantId!, req.params.id, req.body);
      res.json({ success: true, data: employee });
    } catch (err) {
      next(err);
    }
  }
}

export const employeeController = new EmployeeController();
