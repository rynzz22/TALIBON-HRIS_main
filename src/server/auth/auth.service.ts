import { Injectable, UnauthorizedException } from "@nestjs/common";
import jwt from "jsonwebtoken";
import type { Role } from "../../types";
import type { LoginDto } from "./auth.dto";

interface UserRecord {
  userId: string;
  email: string;
  password: string;
  role: Role;
}

@Injectable()
export class AuthService {
  private readonly users: UserRecord[] = [
    {
      userId: "U-ADMIN-001",
      email: process.env.ADMIN_EMAIL ?? "admin@talibon.gov.ph",
      password: process.env.ADMIN_PASSWORD ?? "admin123",
      role: "admin",
    },
    {
      userId: "U-HEAD-001",
      email: "dept.head@talibon.gov.ph",
      password: "depthead123",
      role: "dept_head",
    },
    {
      userId: "U-PAYROLL-001",
      email: "payroll@talibon.gov.ph",
      password: "payroll123",
      role: "payroll_officer",
    },
    {
      userId: "U-EMP-001",
      email: "employee@talibon.gov.ph",
      password: "employee123",
      role: "employee",
    },
  ];

  login(dto: LoginDto) {
    const user = this.users.find((candidate) => candidate.email.toLowerCase() === dto.email.toLowerCase());
    if (!user || user.password !== dto.password) {
      throw new UnauthorizedException("Invalid credentials");
    }

    const token = jwt.sign(
      { userId: user.userId, email: user.email, role: user.role },
      process.env.JWT_SECRET ?? "dev-secret",
      { expiresIn: "12h" },
    );
    return {
      token,
      user: { userId: user.userId, email: user.email, role: user.role },
    };
  }
}
