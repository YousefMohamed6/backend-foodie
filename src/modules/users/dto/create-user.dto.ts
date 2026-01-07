import { DevicePlatform, UserRole } from '@prisma/client';

export class CreateUserDto {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role?: UserRole;
  phoneNumber?: string;
  zoneId?: string;
  countryCode?: string;
  fcmToken?: string;
  profilePictureURL?: string;
  devicePlatform?: DevicePlatform;
  provider?: string;
  referralCode?: string;
}
