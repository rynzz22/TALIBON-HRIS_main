import { IsEmail, IsEnum, IsString } from "class-validator";
import type { Role } from "../../types";

export class LoginDto {
  @IsEmail()
  email!: string;

  @IsString()
  password!: string;
}

export class SeedUserDto {
  @IsEmail()
  email!: string;

  @IsString()
  password!: string;

  @IsEnum(["admin", "dept_head", "employee", "payroll_officer"])
  role!: Role;
}
