import { User } from './entities/user.entity';
export declare class UsersService {
    private tableName;
    create(data: any): Promise<User>;
    findByEmail(email: string): Promise<User | null>;
}
