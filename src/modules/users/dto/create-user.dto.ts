import { UserRole } from '@prisma/client';

export class CreateUserDto {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role?: UserRole;
  phoneNumber?: string;
  // Add other fields as needed
}
