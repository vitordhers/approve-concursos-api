import { JwtPayload as JWTPayload } from 'jsonwebtoken';
import { UserRole } from '../../shared/enums/user-role.enum';

export interface JwtPayload extends JWTPayload {
  id: string;
  role: UserRole;
}
