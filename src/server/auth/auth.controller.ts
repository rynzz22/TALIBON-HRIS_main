import { Body, Controller, Post, UsePipes, ValidationPipe } from "@nestjs/common";
import { wrap } from "../common/response";
import { LoginDto } from "./auth.dto";
import { AuthService } from "./auth.service";

@Controller("api/auth")
@UsePipes(new ValidationPipe({ transform: true }))
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("login")
  login(@Body() dto: LoginDto) {
    return wrap(this.authService.login(dto), "Authenticated");
  }
}
