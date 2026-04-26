import { Controller, Get, Module, Param, UseGuards } from "@nestjs/common";
import { AuthGuard } from "./common/auth.guard";
import { wrap } from "./common/response";
import { RolesGuard } from "./common/roles.guard";

@Controller("api/notifications")
@UseGuards(AuthGuard, RolesGuard)
class NotificationsController {
  @Get(":userId")
  list(@Param("userId") userId: string) {
    return wrap([], `No notifications for ${userId}`);
  }
}

@Module({
  controllers: [NotificationsController],
})
export class NotificationsModule {}
