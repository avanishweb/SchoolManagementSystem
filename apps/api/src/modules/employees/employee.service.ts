import { Types } from 'mongoose';
import { Employee, EmployeeDocument } from './employee.model.js';
import { CreateEmployeeInput, UpdateEmployeeInput } from '@smart-school/validation';
import { AppError } from '../../utils/appError.js';

export class EmployeeService {
  async generateNextEmployeeId(schoolId: string, role: string = 'EMP'): Promise<string> {
    const prefix = role.toUpperCase().slice(0, 3);
    const count = await Employee.countDocuments({ schoolId: new Types.ObjectId(schoolId) });
    return `${prefix}-${String(count + 1).padStart(4, '0')}`;
  }

  async listEmployees(
    schoolId: string,
    role?: string,
    department?: string,
    status?: string
  ): Promise<EmployeeDocument[]> {
    const filter: Record<string, unknown> = {
      schoolId: new Types.ObjectId(schoolId),
    };

    if (role) filter.role = role;
    if (department) filter.department = department;
    if (status) filter.status = status;

    return Employee.find(filter).sort({ firstName: 1 });
  }

  async getEmployeeById(schoolId: string, employeeId: string): Promise<EmployeeDocument> {
    if (!Types.ObjectId.isValid(employeeId)) {
      throw AppError.badRequest('Invalid employee ID');
    }

    const employee = await Employee.findOne({
      _id: new Types.ObjectId(employeeId),
      schoolId: new Types.ObjectId(schoolId),
    });

    if (!employee) {
      throw AppError.notFound('Employee not found in this institution');
    }

    return employee;
  }

  async createEmployee(schoolId: string, input: CreateEmployeeInput): Promise<EmployeeDocument> {
    let empId = input.employeeId?.trim().toUpperCase();
    if (!empId) {
      empId = await this.generateNextEmployeeId(schoolId, input.role);
    } else {
      const existing = await Employee.findOne({
        schoolId: new Types.ObjectId(schoolId),
        employeeId: empId,
      });
      if (existing) {
        throw AppError.conflict(`Employee ID '${empId}' is already registered in this school.`);
      }
    }

    const employee = new Employee({
      ...input,
      schoolId: new Types.ObjectId(schoolId),
      employeeId: empId,
      joiningDate: new Date(input.joiningDate),
    });

    await employee.save();
    return employee;
  }

  async updateEmployee(
    schoolId: string,
    id: string,
    input: UpdateEmployeeInput
  ): Promise<EmployeeDocument> {
    const employee = await this.getEmployeeById(schoolId, id);

    if (input.firstName !== undefined) employee.firstName = input.firstName;
    if (input.lastName !== undefined) employee.lastName = input.lastName;
    if (input.email !== undefined) employee.email = input.email;
    if (input.phone !== undefined) employee.phone = input.phone;
    if (input.designation !== undefined) employee.designation = input.designation;
    if (input.department !== undefined) employee.department = input.department;
    if (input.role !== undefined) employee.role = input.role;
    if (input.qualification !== undefined) employee.qualification = input.qualification;
    if (input.basicSalary !== undefined) employee.basicSalary = input.basicSalary;
    if (input.assignedClasses !== undefined) employee.assignedClasses = input.assignedClasses;
    if (input.assignedSubjects !== undefined) employee.assignedSubjects = input.assignedSubjects;
    if (input.status !== undefined) employee.status = input.status;

    await employee.save();
    return employee;
  }
}

export const employeeService = new EmployeeService();
